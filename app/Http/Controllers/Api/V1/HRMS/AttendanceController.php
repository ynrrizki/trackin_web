<?php

namespace App\Http\Controllers\Api\V1\HRMS;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class AttendanceController extends Controller
{
    /**
     * Format time to H:i format
     */
    private function formatTime($time)
    {
        if (!$time) {
            return null;
        }
        return date('H:i', strtotime($time));
    }
    /**
     * Get employee shift information
     */
    public function getShiftInfo(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->with(['shift', 'department', 'assignedProjects.shifts'])->first();

        if (!$employee) {
            return $this->respondError('Employee not found', 404);
        }

        // Resolve effective shift with inheritance
        $shift = $employee->effectiveShift();
        if (!$shift) {
            return $this->respondError('No shift available. Please assign a shift or configure default HO shift.', 404);
        }
        $location = $shift->getEffectiveLocation();

        return $this->respondSuccess([
            'employee' => [
                'start_time' => $this->formatTime($shift->start_time),
                'end_time' => $this->formatTime($shift->end_time),
                'employee_code' => $employee->employee_code,
                'department' => $employee->department?->name,
                'is_outsourcing' => !is_null($employee->outsourcing_field_id),
                'outsourcing_field' => $employee->outsourcingField?->name,
            ],
            'shift' => [
                'id' => $shift->id,
                'name' => $shift->name,
                'start_time' => $this->formatTime($shift->start_time),
                'end_time' => $this->formatTime($shift->end_time),
                'description' => $shift->description,
            ],
            'location' => [
                'latitude' => $location['latitude'],
                'longitude' => $location['longitude'],
                'radius' => $shift->getEffectiveRadius(),
                'has_location' => $shift->hasEffectiveLocation(),
            ]
        ], false, 'Shift information retrieved successfully');
    }

    /**
     * Calculate distance between two coordinates in meters
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // Earth radius in meters

        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $deltaLatRad = deg2rad($lat2 - $lat1);
        $deltaLonRad = deg2rad($lon2 - $lon1);

        $a = sin($deltaLatRad / 2) * sin($deltaLatRad / 2) +
            cos($lat1Rad) * cos($lat2Rad) *
            sin($deltaLonRad / 2) * sin($deltaLonRad / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
    public function index()
    {
        $user = request()->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return $this->respondError('Employee not found', 404);
        }

        $today = date('Y-m-d');

        // List check‑in: ambil semua record, urutkan berdasarkan time_in
        $checkIns = Attendance::where('date', $today)
            ->where('employee_id', $employee->id)
            ->orderBy('time_in', 'asc')
            ->get([
                'id',
                'employee_id',
                'date',
                'time_in',
                'latlot_in',
                'is_fake_map_detected',
                'created_at'
            ]);

        // List check‑out: hanya yang sudah ada time_out, urutkan berdasarkan time_out
        $checkOuts = Attendance::where('date', $today)
            ->where('employee_id', $employee->id)
            ->whereNotNull('time_out')
            ->orderBy('time_out', 'asc')
            ->get([
                'id',
                'employee_id',
                'date',
                'time_out',
                'latlot_out',
                'is_fake_map_detected',
                'updated_at'
            ]);

        return $this->respondSuccess([
            'check_in' => $checkIns,
            'check_out' => $checkOuts,
        ], false, 'Current attendance retrieved successfully');
    }

    public function show($id)
    {
        // Logic to show a specific attendance record by ID
        $attendance = Attendance::find($id);
        if (!$attendance) {
            return $this->respondError('Attendance record not found', 404);
        }

        return $this->respondSuccess($attendance, false, 'Attendance record retrieved successfully');
    }

    // public function checkIn(Request $request)
    // {
    //     // Logic for checking in
    //     $request->validate([
    //         'latitude' => 'required|numeric',
    //         'longitude' => 'required|numeric',
    //         'is_fake_map_detected' => 'boolean',
    //     ]);

    //     // Serialize check-in to avoid duplicate records on rapid taps/concurrent requests
    //     $userId = $request->user()->id;
    //     $lockKey = "attendance:lock:check:" . $userId;
    //     return \Illuminate\Support\Facades\Cache::lock($lockKey, 10)->block(5, function () use ($request) {
    //         $employee = Employee::where('user_id', $request->user()->id)->with(['shift', 'assignedProjects.shifts'])->first();

    //         if (!$employee) {
    //             return $this->respondError('Employee not found', 404);
    //         }

    //         $shift = $employee->effectiveShift();
    //         if (!$shift) {
    //             return $this->respondError('No shift available. Please assign a shift or configure default HO shift.', 404);
    //         }
    //         $location = $shift->getEffectiveLocation();

    //         // Validate location if shift has location set
    //         if ($shift->hasEffectiveLocation()) {
    //             $distance = $this->calculateDistance(
    //                 $request->latitude,
    //                 $request->longitude,
    //                 $location['latitude'],
    //                 $location['longitude']
    //             );

    //             $allowedRadius = $shift->getEffectiveRadius();

    //             if ($distance > $allowedRadius) {
    //                 return response()->json([
    //                     'success' => false,
    //                     'message' => "You are {$distance}m away from the work location. Maximum allowed distance is {$allowedRadius}m.",
    //                     'data' => [
    //                         'distance' => round($distance, 2),
    //                         'allowed_radius' => $allowedRadius,
    //                         'work_location' => $location
    //                     ]
    //                 ], 400);
    //             }
    //         }

    //         // Check if already checked in today (open record)
    //         $today = date('Y-m-d');
    //         $existingCheckIn = Attendance::where('employee_id', $employee->id)
    //             ->where('date', $today)
    //             ->whereNull('time_out')
    //             ->first();

    //         if ($existingCheckIn) {
    //             return $this->respondError('You have already checked in today and not checked out yet', 400);
    //         }

    //         $attendance = new Attendance;
    //         $attendance->employee_id = $employee->id;
    //         $attendance->date = $today;
    //         $attendance->time_in = date('H:i:s');
    //         $attendance->latlot_in = $request->latitude . ',' . $request->longitude;
    //         $attendance->is_fake_map_detected = $request->is_fake_map_detected ?? false;
    //         $attendance->save();

    //         return $this->respondSuccess([
    //             'attendance' => $attendance,
    //             'distance' => $shift->hasEffectiveLocation() ?
    //                 round($this->calculateDistance(
    //                     $request->latitude,
    //                     $request->longitude,
    //                     $location['latitude'],
    //                     $location['longitude']
    //                 ), 2) : null,
    //             'shift' => [
    //                 'name' => $shift->name,
    //                 'start_time' => $shift->start_time,
    //                 'end_time' => $shift->end_time,
    //             ]
    //         ], false, 'Checked in successfully');
    //     });
    // }

    // public function checkOut(Request $request)
    // {
    //     // Logic for checking out
    //     $request->validate([
    //         'latitude' => 'required|numeric',
    //         'longitude' => 'required|numeric',
    //         'is_fake_map_detected' => 'boolean',
    //     ]);

    //     // Serialize check-out to avoid race-condition duplicates
    //     $userId = $request->user()->id;
    //     $lockKey = "attendance:lock:check:" . $userId;
    //     return \Illuminate\Support\Facades\Cache::lock($lockKey, 10)->block(5, function () use ($request) {
    //         $employee = Employee::where('user_id', $request->user()->id)->first();

    //         if (!$employee) {
    //             return $this->respondError('Employee not found', 404);
    //         }

    //         $attendance = Attendance::where('employee_id', $employee->id)
    //             ->whereDate('date', date('Y-m-d'))
    //             ->whereNull('time_out')
    //             ->first();

    //         if (!$attendance) {
    //             return $this->respondError('No check-in record found for today', 404);
    //         }

    //         $attendance->time_out = date('H:i:s');
    //         $attendance->latlot_out = $request->latitude . ',' . $request->longitude;
    //         $attendance->is_fake_map_detected = $request->is_fake_map_detected ?? false; // Default to false if not provided
    //         $attendance->save();

    //         return $this->respondSuccess($attendance, false, 'Checked out successfully');
    //     });
    // }


    public function checkIn(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'is_fake_map_detected' => 'boolean',
        ]);

        $userId = $request->user()->id;
        $lockKey = "attendance:lock:check:" . $userId;

        return \Illuminate\Support\Facades\Cache::lock($lockKey, 10)->block(5, function () use ($request) {
            $employee = Employee::where('user_id', $request->user()->id)
                ->with(['shift', 'assignedProjects.shifts'])
                ->first();

            if (!$employee) {
                return $this->respondError('Employee not found', 404);
            }

            $shift = $employee->effectiveShift();
            if (!$shift) {
                return $this->respondError('No shift available. Please assign a shift or configure default HO shift.', 404);
            }

            $location = $shift->getEffectiveLocation();

            // Validasi lokasi (jika ada)
            if ($shift->hasEffectiveLocation()) {
                $distance = $this->calculateDistance(
                    $request->latitude,
                    $request->longitude,
                    $location['latitude'],
                    $location['longitude']
                );

                $allowedRadius = $shift->getEffectiveRadius();
                if ($distance > $allowedRadius) {
                    return response()->json([
                        'success' => false,
                        'message' => "You are {$distance}m away from the work location. Maximum allowed distance is {$allowedRadius}m.",
                        'data' => [
                            'distance' => round($distance, 2),
                            'allowed_radius' => $allowedRadius,
                            'work_location' => $location
                        ]
                    ], 400);
                }
            }

            // Pakai tanggal "hari ini" berbasis timezone aplikasi (atau employee)
            $today = Carbon::today(config('app.timezone'))->toDateString();

            // ❗ NEW: blokir jika sudah ada attendance di tanggal ini (apapun statusnya)
            $alreadyHasToday = Attendance::where('employee_id', $employee->id)
                ->whereDate('date', $today)
                ->exists();

            if ($alreadyHasToday) {
                // Boleh bedakan pesan kalau masih open atau sudah close:
                $open = Attendance::where('employee_id', $employee->id)
                    ->whereDate('date', $today)
                    ->whereNull('time_out')
                    ->exists();

                $msg = $open
                    ? 'You have already checked in today and not checked out yet'
                    : 'You have already completed attendance today';
                // 409 lebih tepat untuk konflik aturan bisnis
                return response()->json(['success' => false, 'message' => $msg], 409);
            }

            $attendance = new Attendance;
            $attendance->employee_id = $employee->id;
            $attendance->date = $today;
            $attendance->time_in = Carbon::now(config('app.timezone'))->format('H:i:s');
            $attendance->latlot_in = $request->latitude . ',' . $request->longitude;
            $attendance->is_fake_map_detected = $request->boolean('is_fake_map_detected', false);
            $attendance->save();

            return $this->respondSuccess([
                'attendance' => $attendance,
                'distance' => $shift->hasEffectiveLocation()
                    ? round($this->calculateDistance(
                        $request->latitude,
                        $request->longitude,
                        $location['latitude'],
                        $location['longitude']
                    ), 2)
                    : null,
                'shift' => [
                    'name' => $shift->name,
                    'start_time' => $shift->start_time,
                    'end_time' => $shift->end_time,
                ]
            ], false, 'Checked in successfully');
        });
    }

    public function checkOut(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'is_fake_map_detected' => 'boolean',
        ]);

        $userId = $request->user()->id;
        $lockKey = "attendance:lock:check:" . $userId;

        return \Illuminate\Support\Facades\Cache::lock($lockKey, 10)->block(5, function () use ($request) {
            $employee = Employee::where('user_id', $request->user()->id)->first();

            if (!$employee) {
                return $this->respondError('Employee not found', 404);
            }

            $today = Carbon::today(config('app.timezone'))->toDateString();

            $attendance = Attendance::where('employee_id', $employee->id)
                ->whereDate('date', $today)
                ->whereNull('time_out')
                ->first();

            if (!$attendance) {
                // bedakan: apakah sama sekali belum check-in, atau sudah checkout
                $hasToday = Attendance::where('employee_id', $employee->id)
                    ->whereDate('date', $today)
                    ->exists();

                $msg = $hasToday
                    ? 'You have already checked out today'
                    : 'No check-in record found for today';
                return response()->json(['success' => false, 'message' => $msg], 409);
            }

            $attendance->time_out = \Carbon\Carbon::now(config('app.timezone'))->format('H:i:s');
            $attendance->latlot_out = $request->latitude . ',' . $request->longitude;
            $attendance->is_fake_map_detected = $request->boolean('is_fake_map_detected', false);
            $attendance->save();

            return $this->respondSuccess($attendance, false, 'Checked out successfully');
        });
    }


    /**
     * Get monthly attendance summary for the authenticated employee
     * Query params:
     * - month (YYYY-MM) optional; defaults to current month
     */
    public function monthlySummary(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return $this->respondError('Employee not found', 404);
        }

        // Determine month range
        $monthParam = $request->get('month'); // format YYYY-MM
        try {
            $start = $monthParam
                ? Carbon::createFromFormat('Y-m', $monthParam)->startOfMonth()
                : Carbon::now()->startOfMonth();
        } catch (\Exception $e) {
            return $this->respondError('Invalid month format. Use YYYY-MM', 422);
        }
        $end = (clone $start)->endOfMonth();

        // Fetch attendance records for the range
        $attendances = Attendance::where('employee_id', $employee->id)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->get()
            ->keyBy('date');

        // Fetch approved leave requests intersecting the range
        $leaves = LeaveRequest::approved()
            ->where('employee_id', $employee->id)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start, $end])
                    ->orWhereBetween('end_date', [$start, $end])
                    ->orWhere(function ($qq) use ($start, $end) {
                        $qq->where('start_date', '<=', $start)
                            ->where('end_date', '>=', $end);
                    });
            })
            ->get();

        // Build a quick lookup for leave by date
        $leaveByDate = [];
        foreach ($leaves as $leave) {
            $period = CarbonPeriod::create(Carbon::parse($leave->start_date)->startOfDay(), Carbon::parse($leave->end_date)->startOfDay());
            foreach ($period as $day) {
                $key = $day->toDateString();
                $leaveByDate[$key] = [
                    'reason' => $leave->reason,
                    'leave_id' => $leave->id,
                ];
            }
        }

        $days = [];
        $totals = [
            'present' => 0,
            'partial' => 0,
            'absent' => 0,
            'leave' => 0,
        ];

        foreach (CarbonPeriod::create($start, $end) as $day) {
            $date = $day->toDateString();

            if (isset($leaveByDate[$date])) {
                $days[] = [
                    'date' => $date,
                    'status' => 'leave',
                    'leave' => $leaveByDate[$date],
                ];
                $totals['leave']++;
                continue;
            }

            $att = $attendances->get($date);
            if ($att) {
                $status = 'present';
                if ($att->time_in && !$att->time_out) {
                    $status = 'partial';
                } elseif (!$att->time_in && $att->time_out) {
                    $status = 'partial';
                }
                $days[] = [
                    'date' => $date,
                    'status' => $status,
                    'time_in' => $att->time_in,
                    'time_out' => $att->time_out,
                ];
                $totals[$status]++;
            } else {
                $days[] = [
                    'date' => $date,
                    'status' => 'absent',
                ];
                $totals['absent']++;
            }
        }

        // Attach effective shift info for context
        $shift = $employee->effectiveShift();

        return $this->respondSuccess([
            'month' => $start->format('Y-m'),
            'shift' => $shift ? [
                'id' => $shift->id,
                'name' => $shift->name,
                'start_time' => $shift->start_time,
                'end_time' => $shift->end_time,
            ] : null,
            'days' => $days,
            'totals' => $totals,
        ], false, 'Monthly attendance summary');
    }

    /**
     * Monitoring attendance list for a given date.
     * - HR (HR Manager/HR Staff/Super Admin) can see all employees and filter by:
     *   - filter=internal (employees without outsourcing_field_id)
     *   - filter=project & project_name=... (employees assigned to projects matching name)
     * - Non-HR sees only their subordinates (approval_line = their employee_code)
     * Query params: date (YYYY-MM-DD), filter, project_name
     */
    public function monitoring(Request $request)
    {
        $user = $request->user();
        $you = Employee::where('user_id', $user->id)->first();
        if (!$you) {
            return $this->respondError('Employee not found', 404);
        }

        $isHr = $user->hasRole('HR Manager') || $user->hasRole('HR Staff') || $user->hasRole('Super Admin');
        $date = $request->query('date', date('Y-m-d'));
        try {
            $parsed = Carbon::createFromFormat('Y-m-d', $date)->toDateString();
            $date = $parsed;
        } catch (\Exception $e) {
            return $this->respondError('Invalid date format. Use YYYY-MM-DD', 422);
        }

        $filter = $request->query('filter'); // internal | project
        $projectName = $request->query('project_name');

        $empQuery = Employee::with(['department', 'employeeType', 'outsourcingField', 'assignedProjects'])
            ->active();

        if (!$isHr) {
            // Limit to subordinates based on approval_line
            $empQuery->where('approval_line', $you->employee_code);
        }

        if ($isHr && $filter === 'internal') {
            $empQuery->whereNull('outsourcing_field_id');
        } elseif ($isHr && $filter === 'project') {
            if ($projectName) {
                // Filter by matching project name or code
                $empQuery->whereHas('assignedProjects', function ($q) use ($projectName) {
                    $q->where('name', 'like', '%' . $projectName . '%')
                        ->orWhere('code', 'like', '%' . $projectName . '%');
                });
            } else {
                // No project name provided: include employees that have any project assignment
                $empQuery->whereHas('assignedProjects');
            }
        }

        $employees = $empQuery->get(['id', 'employee_code', 'full_name', 'department_id', 'employee_type_id', 'outsourcing_field_id']);

        // Get today's attendance for these employees
        $employeeIds = $employees->pluck('id')->all();
        $attByEmp = Attendance::whereIn('employee_id', $employeeIds)
            ->where('date', $date)
            ->get()
            ->groupBy('employee_id');

        $items = [];
        $totals = [
            'present' => 0,
            'absent' => 0,
        ];

        foreach ($employees as $emp) {
            $attList = $attByEmp->get($emp->id) ?? collect();
            $hasAttendance = $attList->isNotEmpty();
            $firstIn = $attList->filter(fn($a) => !empty($a->time_in))->sortBy('time_in')->first();
            $lastOut = $attList->filter(fn($a) => !empty($a->time_out))->sortByDesc('time_out')->first();

            $status = $hasAttendance ? 'Masuk' : 'Tidak Masuk';
            if ($hasAttendance)
                $totals['present']++;
            else
                $totals['absent']++;

            $items[] = [
                'employee' => [
                    'id' => $emp->id,
                    'employee_code' => $emp->employee_code,
                    'name' => $emp->full_name,
                    'department' => $emp->department?->name,
                    'employee_type' => $emp->employeeType?->name,
                    'outsourcing_field' => $emp->outsourcingField?->name,
                    'projects' => $emp->assignedProjects->map(fn($p) => [
                        'id' => $p->id,
                        'code' => $p->code,
                        'name' => $p->name,
                    ])->values(),
                ],
                'attendance' => [
                    'date' => $date,
                    'status' => $status,
                    'time_in' => $firstIn?->time_in,
                    'time_out' => $lastOut?->time_out,
                ],
            ];
        }

        return $this->respondSuccess([
            'date' => $date,
            'is_hr' => $isHr,
            'applied_filter' => $filter,
            'project_name' => $projectName,
            'totals' => $totals,
            'items' => $items,
        ], false, 'Attendance monitoring');
    }
}
