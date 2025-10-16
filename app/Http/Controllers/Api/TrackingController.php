<?php

namespace App\Http\Controllers\Api;

use App\Events\UserLocationUpdated;
use App\Events\UserOnlineStatusChanged;
use App\Events\DutyStatus;
use App\Models\TrackingPoint;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class TrackingController extends Controller
{
    public function updateLocation(Request $request)
    {
        $data = $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        $user = $request->user();
        $user->latlong = $data['lat'] . ',' . $data['lng'];
        $user->save();

        // Check attendance status and determine duty status
        $attendance = \App\Models\Attendance::where('employee_id', $user->employee->id ?? null)
            ->where('date', now()->toDateString())
            ->first();
        $dutyStatus = DutyStatus::NOT_STARTED;
        if ($attendance) {
            if ($attendance->time_in && !$attendance->time_out) {
                $dutyStatus = DutyStatus::ON_DUTY;
            } elseif ($attendance->time_out) {
                $dutyStatus = DutyStatus::OFF_DUTY;
            }
        }

        // Persist tracking point
        TrackingPoint::create([
            'user_id' => $user->id,
            'latitude' => $data['lat'],
            'longitude' => $data['lng'],
            'duty' => $dutyStatus->value,
        ]);

        // Broadcast to presence channel
        // broadcast(new UserLocationUpdated($user->id, $user->employee->id ?? null, (float) $data['lat'], (float) $data['lng']))->toOthers();
        broadcast(new UserLocationUpdated($user->id, $user->employee->id ?? null, (float) $data['lat'], (float) $data['lng'], $dutyStatus));

        return response()->json(['status' => 'ok']);
    }

    public function online(Request $request)
    {
        $user = $request->user();

        // broadcast(new UserOnlineStatusChanged($user->id, $user->employee->id ?? null, true))->toOthers();
        broadcast(new UserOnlineStatusChanged($user->id, $user->employee->id ?? null, true, ));
        return response()->json(['status' => 'ok']);
    }

    public function offline(Request $request)
    {
        $user = $request->user();
        // broadcast(new UserOnlineStatusChanged($user->id, $user->employee->id ?? null, false))->toOthers();
        broadcast(new UserOnlineStatusChanged($user->id, $user->employee->id ?? null, false));
        return response()->json(['status' => 'ok']);
    }

    /**
     * Return recent tracking points for the authenticated user (or by employee/user id via query).
     */
    public function recent(Request $request)
    {
        $user = $request->user();
        $limit = (int) ($request->integer('limit') ?: 300);
        $minutes = (int) ($request->integer('minutes') ?: 180); // last 3 hours by default

        $query = TrackingPoint::query()
            ->where('user_id', $user->id)
            ->where('created_at', '>=', now()->subMinutes($minutes))
            ->orderBy('created_at', 'asc')
            ->limit($limit);

        $points = $query->get(['latitude as lat', 'longitude as lng', 'duty', 'created_at']);

        return response()->json([
            'points' => $points,
        ]);
    }

    /**
     * Return last tracking point for a specific employee or user.
     * Params: employee_id or user_id. If both present, user_id takes precedence.
     */
    public function last(Request $request)
    {
        $userId = $request->integer('user_id');
        $employeeId = $request->integer('employee_id');

        if (!$userId && $employeeId) {
            // $userId = User::where('employee_id', $employeeId)->value('id');
            $userId = User::whereHas('employee', function ($q) use ($employeeId) {
                $q->where('id', $employeeId);
            })->first()?->id;
        }

        if (!$userId) {
            return response()->json(['point' => null]);
        }

        $point = TrackingPoint::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->first(['latitude as lat', 'longitude as lng', 'duty', 'created_at']);

        if (!$point) {
            return response()->json(['point' => null]);
        }

        return response()->json([
            'point' => [
                'lat' => (float) $point?->lat,
                'lng' => (float) $point?->lng,
                'duty' => $point?->duty,
                'created_at' => $point?->created_at,
            ],
        ]);
    }
}
