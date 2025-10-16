<?php

namespace App\Http\Controllers\Api\V1\HRMS;

use App\Http\Controllers\Controller;
use App\Models\Overtime;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class OvertimeController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();
        if (!$employee) {
            return response()->json(['message' => 'Employee not found for user'], 422);
        }

        $query = Overtime::with('approvals')->where('employee_id', $employee->id);

        if ($status = $request->query('status')) {
            if ($status === 'pending')
                $query->pending();
            elseif ($status === 'approved')
                $query->approved();
            elseif ($status === 'rejected')
                $query->rejected();
        }
        if ($from = $request->query('date_from')) {
            $query->where('date', '>=', $from);
        }
        if ($to = $request->query('date_to')) {
            $query->where('date', '<=', $to);
        }

        $perPage = (int) ($request->query('per_page', 20));
        $items = $query->orderBy('date', 'desc')->paginate($perPage);

        $data = $items->getCollection()->map(function (Overtime $ot) {
            return [
                'id' => $ot->id,
                'date' => optional($ot->date)->toDateString(),
                'start_time' => optional($ot->start_time)->format('H:i'),
                'end_time' => optional($ot->end_time)->format('H:i'),
                'description' => $ot->description,
                'status' => $ot->status,
                'duration' => $ot->duration_hours,
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
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'description' => 'required|string|max:500',
        ]);

        $start = Carbon::createFromFormat('Y-m-d H:i', $validated['date'] . ' ' . $validated['start_time']);
        $end = Carbon::createFromFormat('Y-m-d H:i', $validated['date'] . ' ' . $validated['end_time']);
        if ($end->lt($start))
            $end->addDay();

        $ot = Overtime::create([
            'employee_id' => $employee->id,
            'date' => $validated['date'],
            'start_time' => $start,
            'end_time' => $end,
            'description' => $validated['description'],
        ]);
        $ot->createApprovalFlow();

        return $this->show($ot->id);
    }

    public function show($id)
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();
        $ot = Overtime::with(['approvals.approver', 'approvals.sender'])
            ->where('id', $id)
            ->where('employee_id', optional($employee)->id)
            ->firstOrFail();

        // Determine if current user can approve (compute early for lints)
        $canApprove = $ot->approvals()
            ->where('status', 'pending')
            ->where('approver_type', \App\Models\User::class)
            ->where('approver_id', $user->id)
            ->exists();

        $timeline = $ot->approvals->map(function ($ap) {
            $approverName = method_exists($ap->approver, 'name') ? $ap->approver->name : ($ap->approver->full_name ?? 'Approver');
            return [
                'id' => $ap->id,
                'status' => strtolower($ap->getAttributes()['status'] ?? 'pending'),
                // 'approver_name' => $approverName,
                'approver_name' => $ap->approver->name ?? $approverName,
                'created_at' => optional($ap->created_at)->toISOString(),
            ];
        })->values();

        return response()->json([
            'id' => $ot->id,
            'date' => optional($ot->date)->toDateString(),
            'start_time' => optional($ot->start_time)->format('H:i'),
            'end_time' => optional($ot->end_time)->format('H:i'),
            'description' => $ot->description,
            'status' => $ot->status,
            'duration' => $ot->duration_hours,
            'approvals' => $timeline,
            'can_approve' => $canApprove,
        ]);
    }

    public function approve($id)
    {
        $user = Auth::user();

        $approval = \App\Models\Approval::where('approvable_type', Overtime::class)
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
            'message' => 'Overtime request approved successfully',
            'overtime_request_id' => $id,
        ]);
    }

    public function reject($id)
    {
        $user = Auth::user();

        $approval = \App\Models\Approval::where('approvable_type', Overtime::class)
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

        // return response()->noContent(); // ✅
        return response()->json([
            'message' => 'Overtime request rejected successfully',
            'overtime_request_id' => $id,
        ]);
    }

    // public function approve($id)
    // {
    //     $user = Auth::user();
    //     $approval = \App\Models\Approval::where('approvable_type', Overtime::class)
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
    //     $approval = \App\Models\Approval::where('approvable_type', Overtime::class)
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
}
