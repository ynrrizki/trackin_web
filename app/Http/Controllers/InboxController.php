<?php

namespace App\Http\Controllers;

use App\Models\Approval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InboxController extends Controller
{
    /**
     * Display the inbox page.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Get notifications for the current user
        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($notification) {
                $data = $notification->data;
                return [
                    'id' => $notification->id,
                    'type' => $data['type'] ?? 'info',
                    'title' => $data['title'] ?? 'Notifikasi',
                    'message' => $data['message'] ?? '',
                    'is_read' => !is_null($notification->read_at),
                    'created_at' => $notification->created_at->toISOString(),
                    'action_url' => $data['action_url'] ?? null,
                ];
            });

        // Get approvals where current user is the approver
        $approvals = Approval::with(['approvable', 'sender', 'approver'])
            ->where(function ($query) use ($user) {
                $query->where('approver_id', $user->id)
                      ->where('approver_type', get_class($user));
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($approval) {
                $approvableData = $this->getApprovableData($approval);
                $senderData = $this->getSenderData($approval);

                return [
                    'id' => $approval->id,
                    'type' => $approvableData['type'],
                    'title' => $approval->name,
                    'description' => $approvableData['description'],
                    'requester' => $senderData,
                    'status' => $approval->status,
                    'due_date' => $approvableData['due_date'] ?? null,
                    'created_at' => $approval->created_at->toISOString(),
                ];
            });

        // Calculate stats
        $stats = [
            'total_notifications' => $notifications->count(),
            'unread_notifications' => $notifications->where('is_read', false)->count(),
            'pending_approvals' => $approvals->where('status', 'pending')->count(),
            'urgent_approvals' => 0, // Removed priority field
        ];

        return Inertia::render('inbox/page', [
            'notifications' => $notifications,
            'approvals' => $approvals,
            'stats' => $stats,
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, $notificationId)
    {
        $user = Auth::user();
        $notification = $user->notifications()->where('id', $notificationId)->first();

        if ($notification && is_null($notification->read_at)) {
            $notification->markAsRead();
        }

        return back();
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        $user = Auth::user();
        $user->unreadNotifications->markAsRead();

        return back();
    }

    /**
     * Approve an approval request
     */
    public function approve(Request $request, $approvalId)
    {
        $approval = Approval::findOrFail($approvalId);

        // Check if current user is the approver
        $user = Auth::user();
        if ($approval->approver_id !== $user->id || $approval->approver_type !== get_class($user)) {
            return back()->withErrors(['message' => 'Anda tidak memiliki akses untuk approval ini.']);
        }

        $approval->update(['status' => 'approved']);

        return back()->with('success', 'Approval berhasil disetujui.');
    }

    /**
     * Reject an approval request
     */
    public function reject(Request $request, $approvalId)
    {
        $approval = Approval::findOrFail($approvalId);

        // Check if current user is the approver
        $user = Auth::user();
        if ($approval->approver_id !== $user->id || $approval->approver_type !== get_class($user)) {
            return back()->withErrors(['message' => 'Anda tidak memiliki akses untuk approval ini.']);
        }

        $approval->update(['status' => 'rejected']);

        return back()->with('success', 'Approval berhasil ditolak.');
    }

    /**
     * Get approvable data based on type
     */
    private function getApprovableData($approval)
    {
        $approvable = $approval->approvable;
        $type = class_basename($approval->approvable_type);

        switch ($type) {
            case 'LeaveRequest':
                return [
                    'type' => 'leave_request',
                    'description' => "Permohonan cuti dari {$approvable->start_date} sampai {$approvable->end_date}",
                    'due_date' => $approvable->start_date ?? null,
                ];
            case 'Overtime':
                return [
                    'type' => 'overtime_request',
                    'description' => "Permohonan lembur untuk {$approvable->duration} jam",
                    'due_date' => $approvable->date ?? null,
                ];
            case 'ClientInvoice':
                return [
                    'type' => 'expense_claim',
                    'description' => "Klaim reimburse sebesar " . number_format($approvable->amount ?? 0, 0, ',', '.'),
                    'due_date' => null,
                ];
            default:
                return [
                    'type' => 'document_approval',
                    'description' => 'Persetujuan dokumen',
                    'due_date' => null,
                ];
        }
    }

    /**
     * Get sender data
     */
    private function getSenderData($approval)
    {
        $sender = $approval->sender;

        return [
            'id' => $sender->id ?? 0,
            'name' => $sender->name ?? 'Unknown',
            'avatar' => null,
            'department' => $sender->department->name ?? null,
        ];
    }
}
