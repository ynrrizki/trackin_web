<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AttendanceController extends Controller
{
    /**
     * Get current user's shift information
     */
    public function getMyShift(Request $request)
    {
        try {
            $user = Auth::user();
            $employee = $user->employee;

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee data not found'
                ], 404);
            }

            $shift = $employee->shift;

            if (!$shift) {
                return response()->json([
                    'success' => false,
                    'message' => 'No shift assigned to this employee'
                ], 404);
            }

            // Get effective location (shift location > project location > null)
            $effectiveLocation = null;
            if ($shift->hasEffectiveLocation()) {
                $effectiveLocation = $shift->getEffectiveLocation();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'shift' => [
                        'id' => $shift->id,
                        'name' => $shift->name,
                        'start_time' => $shift->start_time,
                        'end_time' => $shift->end_time,
                        'description' => $shift->description,
                    ],
                    'location' => $effectiveLocation,
                    'employee' => [
                        'id' => $employee->id,
                        'employee_code' => $employee->employee_code,
                        'full_name' => $employee->full_name,
                        'department' => $employee->department?->name,
                        'position' => $employee->position?->name,
                        'is_outsource' => !is_null($employee->outsourcing_field_id),
                        'outsourcing_field' => $employee->outsourcingField?->name,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch shift data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get shift by employee ID or employee code
     */
    public function getShiftByEmployee(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'employee_id' => 'nullable|exists:employees,id',
                'employee_code' => 'nullable|exists:employees,employee_code',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            if (!$request->employee_id && !$request->employee_code) {
                return response()->json([
                    'success' => false,
                    'message' => 'Either employee_id or employee_code is required'
                ], 422);
            }

            $employee = null;
            if ($request->employee_id) {
                $employee = Employee::find($request->employee_id);
            } else {
                $employee = Employee::where('employee_code', $request->employee_code)->first();
            }

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            $shift = $employee->shift;

            if (!$shift) {
                return response()->json([
                    'success' => false,
                    'message' => 'No shift assigned to this employee'
                ], 404);
            }

            // Get effective location
            $effectiveLocation = null;
            if ($shift->hasEffectiveLocation()) {
                $effectiveLocation = $shift->getEffectiveLocation();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'shift' => [
                        'id' => $shift->id,
                        'name' => $shift->name,
                        'start_time' => $shift->start_time,
                        'end_time' => $shift->end_time,
                        'description' => $shift->description,
                    ],
                    'location' => $effectiveLocation,
                    'employee' => [
                        'id' => $employee->id,
                        'employee_code' => $employee->employee_code,
                        'full_name' => $employee->full_name,
                        'department' => $employee->department?->name,
                        'position' => $employee->position?->name,
                        'is_outsource' => !is_null($employee->outsourcing_field_id),
                        'outsourcing_field' => $employee->outsourcingField?->name,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch employee shift data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clock in attendance
     */
    public function clockIn(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'is_fake_gps_detected' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $employee = $user->employee;

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee data not found'
                ], 404);
            }

            $today = Carbon::today();

            // Check if already clocked in today
            $existingAttendance = Attendance::where('employee_id', $employee->id)
                ->where('date', $today)
                ->first();

            if ($existingAttendance && $existingAttendance->time_in) {
                return response()->json([
                    'success' => false,
                    'message' => 'Already clocked in today',
                    'data' => [
                        'time_in' => $existingAttendance->time_in,
                        'date' => $existingAttendance->date
                    ]
                ], 409);
            }

            $attendanceData = [
                'employee_id' => $employee->id,
                'date' => $today,
                'time_in' => Carbon::now()->format('H:i:s'),
                'latlot_in' => $request->latitude . ',' . $request->longitude,
                'is_fake_map_detected' => $request->boolean('is_fake_gps_detected', false),
            ];

            if ($existingAttendance) {
                $existingAttendance->update($attendanceData);
                $attendance = $existingAttendance;
            } else {
                $attendance = Attendance::create($attendanceData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Clock in successful',
                'data' => [
                    'id' => $attendance->id,
                    'date' => $attendance->date,
                    'time_in' => $attendance->time_in,
                    'location' => $attendance->latlot_in,
                    'is_fake_gps_detected' => $attendance->is_fake_map_detected,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clock in',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clock out attendance
     */
    public function clockOut(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'is_fake_gps_detected' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $employee = $user->employee;

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee data not found'
                ], 404);
            }

            $today = Carbon::today();

            $attendance = Attendance::where('employee_id', $employee->id)
                ->where('date', $today)
                ->first();

            if (!$attendance || !$attendance->time_in) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please clock in first'
                ], 409);
            }

            if ($attendance->time_out) {
                return response()->json([
                    'success' => false,
                    'message' => 'Already clocked out today',
                    'data' => [
                        'time_out' => $attendance->time_out,
                        'date' => $attendance->date
                    ]
                ], 409);
            }

            $attendance->update([
                'time_out' => Carbon::now()->format('H:i:s'),
                'latlot_out' => $request->latitude . ',' . $request->longitude,
                'is_fake_map_detected' => $request->boolean('is_fake_gps_detected', false) || $attendance->is_fake_map_detected,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Clock out successful',
                'data' => [
                    'id' => $attendance->id,
                    'date' => $attendance->date,
                    'time_in' => $attendance->time_in,
                    'time_out' => $attendance->time_out,
                    'location_in' => $attendance->latlot_in,
                    'location_out' => $attendance->latlot_out,
                    'is_fake_gps_detected' => $attendance->is_fake_map_detected,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clock out',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attendance history
     */
    public function getAttendanceHistory(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'limit' => 'nullable|integer|min:1|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $employee = $user->employee;

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee data not found'
                ], 404);
            }

            $query = Attendance::where('employee_id', $employee->id);

            if ($request->start_date) {
                $query->where('date', '>=', $request->start_date);
            }

            if ($request->end_date) {
                $query->where('date', '<=', $request->end_date);
            }

            $attendances = $query->orderBy('date', 'desc')
                ->limit($request->get('limit', 30))
                ->get();

            return response()->json([
                'success' => true,
                'data' => $attendances->map(function ($attendance) {
                    return [
                        'id' => $attendance->id,
                        'date' => $attendance->date,
                        'time_in' => $attendance->time_in,
                        'time_out' => $attendance->time_out,
                        'location_in' => $attendance->latlot_in,
                        'location_out' => $attendance->latlot_out,
                        'is_fake_gps_detected' => $attendance->is_fake_map_detected,
                    ];
                })
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch attendance history',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
