<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    /**
     * Transform a DatabaseNotification to the unified API shape.
     */
    protected function transform(DatabaseNotification $n): array
    {
        $data = $n->data ?? [];
        $module = $data['module'] ?? null; // e.g. 'leave' | 'overtime'
        $approvableId = $data['approvable_id'] ?? null;
        $approvableType = $data['approvable_type'] ?? null;

        // Action links (hypermedia) - optional
        $actions = [
            'mark_read' => route('notifications.markAsRead', ['id' => $n->id], false),
        ];
        // Mark unread route (PATCH fallback path, no name)
        $actions['mark_unread'] = url("/api/v1/notifications/{$n->id}/unread");

        // Check if user is sender
        $user = Auth::user();
        $isSender = false;

        Approval::where('approvable_type', $approvableType)
            ->where('approvable_id', $approvableId)
            ->where('sender_type', 'App\Models\User')
            ->where('sender_id', $user->id)
            ->exists() && $isSender = true;

        // Fetch approval status if applicable

        // Inline approval actions when applicable
        if ($module === 'leave' && $approvableId) {
            $actions['approve'] = url("/api/v1/hrms/leaves/{$approvableId}/approve");
            $actions['reject'] = url("/api/v1/hrms/leaves/{$approvableId}/reject");
        } elseif ($module === 'overtime' && $approvableId) {
            $actions['approve'] = url("/api/v1/hrms/overtimes/{$approvableId}/approve");
            $actions['reject'] = url("/api/v1/hrms/overtimes/{$approvableId}/reject");
        }

        // default: pakai nilai dari payload jika ada
        $approvalStatus = $data['approval_status'] ?? null;

        // kalau belum ada di payload, baru fallback
        if ($approvalStatus === null && $approvableId && $approvableType) {
            // apakah user adalah sender?
            $isSender = Approval::where('approvable_type', $approvableType)
                ->where('approvable_id', $approvableId)
                ->where('sender_type', User::class)
                ->where('sender_id', $user->id)
                ->exists();

            if ($isSender) {
                // aggregate status utk sender
                $statuses = Approval::where('approvable_type', $approvableType)
                    ->where('approvable_id', $approvableId)
                    ->pluck('status');
                if ($statuses->contains('rejected'))
                    $approvalStatus = 'rejected';
                elseif ($statuses->contains('pending'))
                    $approvalStatus = 'pending';
                elseif ($statuses->contains('approved'))
                    $approvalStatus = 'approved';
            } else {
                // status khusus baris approver (user penerima notifikasi)
                $approvalStatus = Approval::where('approvable_type', $approvableType)
                    ->where('approvable_id', $approvableId)
                    ->where('approver_type', $n->notifiable_type)
                    ->where('approver_id', $n->notifiable_id)
                    ->first()?->status;
            }
        }

        if ($isSender) {
            $actions['approve'] = null;
            $actions['reject'] = null;
        }

        return [
            'id' => $n->id,
            'title' => $data['title'] ?? 'Notifikasi',
            'message' => $data['message'] ?? '',
            'type' => $data['type'] ?? 'info', // 'approval' | 'system' | ...
            'is_read' => !is_null($n->read_at),
            'approval_status' => $approvalStatus,
            'created_at' => $n->created_at?->toISOString(),
            'updated_at' => $n->updated_at?->toISOString(),
            'module' => $module,
            'approvable_id' => $approvableId,
            'approvable_type' => $approvableType,
            'actions' => $actions,
        ];
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $onlyUnread = filter_var($request->query('unread', 'false'), FILTER_VALIDATE_BOOLEAN);
        $type = $request->query('type'); // e.g. 'approval'
        $since = $request->query('since'); // ISO8601 or Y-m-d H:i:s
        $perPage = (int) $request->query('per_page', 20);

        $query = $user->notifications()->latest('created_at');

        if ($user->hasRole('Super Admin')) {
            $query = DatabaseNotification::query()
                ->latest('created_at');
        }

        if ($onlyUnread) {
            $query->whereNull('read_at');
        }


        if ($since) {
            try {
                $ts = \Carbon\Carbon::parse($since);
                // Return deltas created or updated since timestamp
                $query->where(function ($q) use ($ts) {
                    $q->where('created_at', '>=', $ts)
                        ->orWhere('updated_at', '>=', $ts);
                });
            } catch (\Throwable $e) {
                // ignore parse errors
            }
        }

        $paginator = $query->paginate($perPage);
        $items = $paginator->getCollection()->map(function (DatabaseNotification $n) use ($type) {
            $data = $n->data ?? [];
            // Optional server-side type filter (by data['type'])
            if ($type && ($data['type'] ?? null) !== $type) {
                return null;
            }
            return $this->transform($n);
        })->filter()->values();

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'server_time' => now()->toISOString(),
            ],
        ]);
    }

    public function show(Request $request, $id)
    {
        $user = Auth::user();
        /** @var DatabaseNotification $notification */
        $notification = $user->notifications()->where('id', $id)->firstOrFail();
        return response()->json($this->transform($notification));
    }

    public function markAsRead(Request $request, $id)
    {
        $user = Auth::user();
        $notification = $user->notifications()->where('id', $id)->firstOrFail();
        if (is_null($notification->read_at)) {
            $notification->markAsRead();
        }
        return response()->json(['data' => $this->transform($notification)]);
    }

    public function markAsUnread(Request $request, $id)
    {
        $user = Auth::user();
        /** @var DatabaseNotification $notification */
        $notification = $user->notifications()->where('id', $id)->firstOrFail();
        if (!is_null($notification->read_at)) {
            $notification->read_at = null;
            $notification->save();
        }
        return response()->json(['data' => $this->transform($notification)]);
    }

    public function markBulkRead(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'uuid',
        ]);
        $user = Auth::user();
        $ids = $validated['ids'];
        $user->notifications()
            ->whereIn('id', $ids)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        // Return updated items in unified shape
        $updated = $user->notifications()->whereIn('id', $ids)->get()->map(fn($n) => $this->transform($n))->values();
        return response()->json(['data' => $updated]);
    }

    public function delete(Request $request, $id)
    {
        $user = Auth::user();
        $notification = $user->notifications()->where('id', $id)->firstOrFail();
        $notification->delete();
        return response()->json(['message' => 'Notification deleted']);
    }

    public function clearAll(Request $request)
    {
        $user = Auth::user();
        $user->notifications()->delete();
        return response()->json(['message' => 'All notifications cleared']);
    }

    public function unreadCount()
    {
        $user = Auth::user();
        $count = $user->unreadNotifications()->count();
        return response()->json(['unread_count' => $count]);
    }
}
