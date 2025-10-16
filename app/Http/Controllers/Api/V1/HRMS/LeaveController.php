<?php

namespace App\Http\Controllers\Api\V1\HRMS;

use App\Http\Controllers\Controller;
use App\Models\ApprovableType;
use App\Models\LeaveRequest;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();
        if (!$employee) {
            return response()->json(['message' => 'Employee not found for user'], 422);
        }

        $query = LeaveRequest::with('approvals')
            ->where('employee_id', $employee->id);

        // Filters
        if ($status = $request->query('status')) {
            if ($status === 'pending')
                $query->pending();
            elseif ($status === 'approved')
                $query->approved();
            elseif ($status === 'rejected')
                $query->rejected();
        }
        if ($from = $request->query('date_from')) {
            $query->where('end_date', '>=', $from);
        }
        if ($to = $request->query('date_to')) {
            $query->where('start_date', '<=', $to);
        }

        $perPage = (int) ($request->query('per_page', 20));
        $items = $query->orderBy('start_date', 'desc')->paginate($perPage);

        $data = $items->getCollection()->map(function (LeaveRequest $lr) {
            return [
                'id' => $lr->id,
                'start_date' => optional($lr->start_date)->toDateString(),
                'end_date' => optional($lr->end_date)->toDateString(),
                'reason' => $lr->reason,
                'approval_status' => $lr->approval_status, // from HasApprovable accessor (renamed)
                'duration' => $lr->start_date ? $lr->start_date->diffInDays($lr->end_date) + 1 : null,
                'leave_category_code' => optional($lr->category)->code,
                'leave_category_name' => optional($lr->category)->name,
            ];
        })->values();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();
        if (!$employee) {
            return response()->json(['message' => 'Employee not found for user'], 422);
        }

        $validated = $request->validate([
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:500',
            'leave_category_code' => 'nullable|string|exists:leave_categories,code',
            'proof' => 'sometimes|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        // Overlap check (pending/approved)
        $overlapping = LeaveRequest::where('employee_id', $employee->id)
            ->where(function ($query) use ($validated) {
                $query->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhere(function ($sub) use ($validated) {
                        $sub->where('start_date', '<=', $validated['start_date'])
                            ->where('end_date', '>=', $validated['end_date']);
                    });
            })
            ->where(function ($q) {
                $q->pending()->orWhere(fn($qq) => $qq->approved());
            })
            ->exists();
        if ($overlapping) {
            return response()->json(['message' => 'There is an overlapping leave request for this period'], 422);
        }

        $category = isset($validated['leave_category_code'])
            ? \App\Models\LeaveCategory::where('code', $validated['leave_category_code'])->first()
            : \App\Models\LeaveCategory::where('code', 'ANNUAL')->first();

        // If category requires proof, enforce file presence
        if ($category && $category->requires_proof && !$request->hasFile('proof')) {
            return response()->json(['message' => 'Kategori ini mewajibkan lampiran bukti (gambar atau PDF)'], 422);
        }

        // If category deducts balance, ensure entitlement closing > 0
        if ($category && $category->deduct_balance) {
            $engine = app(\App\Services\LeaveEntitlementEngine::class);
            $ent = $engine->recalcYear($employee, $category, now()->year);
            if (($ent->closing ?? 0) <= 0) {
                return response()->json(['message' => 'Saldo cuti tidak mencukupi untuk kategori ini'], 422);
            }
        }

        $proofPath = null;
        if ($request->hasFile('proof')) {
            $proofPath = $request->file('proof')->store('proofs/leave', 'public');
        }

        $leave = LeaveRequest::create([
            'employee_id' => $employee->id,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'reason' => $validated['reason'] ?? null,
            'leave_category_id' => optional($category)->id,
            'proof_path' => $proofPath,
        ]);
        // Create layered approval
        $leave->createApprovalFlow($employee->approval_line);

        return $this->show($leave->id);
    }

    public function show($id)
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();
        $leave = LeaveRequest::with(['approvals.approver', 'approvals.sender'])
            ->where('id', $id)
            ->where('employee_id', optional($employee)->id)
            ->firstOrFail();

        $timeline = $leave->approvals->map(function ($ap) {
            $approverName = method_exists($ap->approver, 'name') ? $ap->approver->name : ($ap->approver->full_name ?? 'Approver');
            return [
                'id' => $ap->id,
                'status' => strtolower($ap->getAttributes()['status'] ?? 'pending'),
                'approver_name' => $ap->approver->name ?? $approverName,
                'created_at' => optional($ap->created_at)->toISOString(),
            ];
        })->values();

        // Determine if current user can approve (has a pending approval assigned)
        $canApprove = $leave->approvals()
            ->where('status', 'pending')
            ->where('approver_type', \App\Models\User::class)
            ->where('approver_id', $user->id)
            ->exists();

        return response()->json([
            'id' => $leave->id,
            'start_date' => optional($leave->start_date)->toDateString(),
            'end_date' => optional($leave->end_date)->toDateString(),
            'reason' => $leave->reason,
            'approval_status' => $leave->approval_status,
            'duration' => $leave->start_date ? $leave->start_date->diffInDays($leave->end_date) + 1 : null,
            'leave_category_code' => optional($leave->category)->code,
            'leave_category_name' => optional($leave->category)->name,
            'category_requires_proof' => (bool) optional($leave->category)->requires_proof,
            'approvals' => $timeline,
            'can_approve' => $canApprove,
        ]);
    }

    // public function approve($id)
    // {
    //     $user = Auth::user();
    //     // Find pending approval assigned to current user for this approvable
    //     $approval = \App\Models\Approval::where('approvable_type', LeaveRequest::class)
    //         ->where('approvable_id', $id)
    //         ->where('status', 'pending')
    //         ->where('approver_type', \App\Models\User::class)
    //         ->where('approver_id', $user->id)
    //         ->first();

    //     if (!$approval) {
    //         return response()->json(['message' => 'Tidak ada permintaan persetujuan yang menunggu untuk Anda'], 422);
    //     }

    //     $approval->status = 'approved';
    //     $approval->save();

    //     return $this->show($id);
    // }

    // public function reject($id)
    // {
    //     $user = Auth::user();
    //     $approval = \App\Models\Approval::where('approvable_type', LeaveRequest::class)
    //         ->where('approvable_id', $id)
    //         ->where('status', 'pending')
    //         ->where('approver_type', \App\Models\User::class)
    //         ->where('approver_id', $user->id)
    //         ->first();

    //     if (!$approval) {
    //         return response()->json(['message' => 'Tidak ada permintaan persetujuan yang menunggu untuk Anda'], 422);
    //     }

    //     $approval->status = 'rejected';
    //     $approval->save();

    //     return $this->show($id);
    // }

    public function approve($id)
    {
        $user = Auth::user();

        $approval = \App\Models\Approval::where('approvable_type', LeaveRequest::class)
            ->where('approvable_id', $id)
            ->where('status', 'pending')
            ->where('approver_type', \App\Models\User::class)
            ->where('approver_id', $user->id)
            ->first();

        if (!$approval) {
            return response()->json(['message' => 'Tidak ada permintaan persetujuan yang menunggu untuk Anda'], 422);
        }

        \DB::transaction(function () use ($approval) {
            $approval->update(['status' => 'approved']);
            // event model akan melanjutkan flow (create next level, notif, dst)
        });

        // return response()->noContent(); // ✅ tidak panggil show()
        return response()->json([
            'message' => 'Leave request approved successfully',
            'leave_request_id' => $id,
        ]);
    }

    public function reject($id)
    {
        $user = Auth::user();

        $approval = \App\Models\Approval::where('approvable_type', LeaveRequest::class)
            ->where('approvable_id', $id)
            ->where('status', 'pending')
            ->where('approver_type', \App\Models\User::class)
            ->where('approver_id', $user->id)
            ->first();

        if (!$approval) {
            return response()->json(['message' => 'Tidak ada permintaan persetujuan yang menunggu untuk Anda'], 422);
        }

        \DB::transaction(function () use ($approval) {
            $approval->update(['status' => 'rejected']);
        });

        return response()->json([
            'message' => 'Leave request rejected successfully',
            'leave_request_id' => $id,
        ]);
    }
}
