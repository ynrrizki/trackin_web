<?php

namespace App\Http\Controllers\Api\V1\SecurityOps;

use App\Http\Controllers\Controller;
use App\Models\Patroli;
use App\Models\PatroliCheckpoint;
use App\Models\PatroliFile;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PatroliController extends Controller
{
    // List patrols for authenticated employee (recent first)
    public function index(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return response()->json(['message' => 'Employee profile required'], 403);
        }
        $query = Patroli::with(['checkpoint','project'])
            ->where('employee_id', $employee->id)
            ->orderByDesc('start_time');
        // optional status filter
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }
        if ($request->filled('date')) {
            $query->whereDate('start_time', $request->date('date'));
        }
        $limit = (int) $request->get('limit', 50);
        $limit = $limit > 100 ? 100 : $limit;
        $patrols = $query->limit($limit)->get();
        return response()->json(['data' => $patrols]);
    }

    // List patrols for monitoring subordinates (staff with approval_line = current user's employee_code)
    public function monitoring(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return response()->json(['message' => 'Employee profile required'], 403);
        }

        // Get subordinates: employees whose approval_line matches current user's employee_code
        $subordinateIds = \App\Models\Employee::where('approval_line', $employee->employee_code)
            ->pluck('id')
            ->toArray();

        if (empty($subordinateIds)) {
            return response()->json([
                'data' => [],
                'message' => 'No subordinates found'
            ]);
        }

        $query = Patroli::with(['checkpoint', 'project', 'employee'])
            ->whereIn('employee_id', $subordinateIds)
            ->orderByDesc('start_time');

        // optional status filter
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }
        if ($request->filled('date')) {
            $query->whereDate('start_time', $request->date('date'));
        }

        $limit = (int) $request->get('limit', 50);
        $limit = $limit > 100 ? 100 : $limit;
        $patrols = $query->limit($limit)->get();

        // Format response to include employee information
        $data = $patrols->map(function(Patroli $patrol) {
            return [
                'id' => $patrol->id,
                'status' => $patrol->status,
                'start_time' => optional($patrol->start_time)->toIso8601String(),
                'end_time' => optional($patrol->end_time)->toIso8601String(),
                'note' => $patrol->note,
                'latitude' => $patrol->latitude,
                'longitude' => $patrol->longitude,
                'project' => $patrol->project ? [
                    'id' => $patrol->project->id,
                    'name' => $patrol->project->name
                ] : null,
                'checkpoint' => $patrol->checkpoint ? [
                    'id' => $patrol->checkpoint->id,
                    'name' => $patrol->checkpoint->name
                ] : null,
                'employee' => $patrol->employee ? [
                    'id' => $patrol->employee->id,
                    'employee_code' => $patrol->employee->employee_code,
                    'full_name' => $patrol->employee->full_name
                ] : null,
            ];
        });

        return response()->json([
            'data' => $data,
            'subordinate_count' => count($subordinateIds)
        ]);
    }

    // Show single patrol with files (evidence)
    public function show(Request $request, Patroli $patroli)
    {
        $this->authorizePatroli($request, $patroli);
        $patroli->load(['checkpoint','project','files','employee']);
        $files = $patroli->files->map(function($f){
            return [
                'id' => $f->id,
                'file_path' => $f->file_path,
                'url' => asset('storage/' . $f->file_path),
            ];
        });
        return response()->json([
            'data' => [
                'id' => $patroli->id,
                'status' => $patroli->status,
                'start_time' => optional($patroli->start_time)->toIso8601String(),
                'end_time' => optional($patroli->end_time)->toIso8601String(),
                'note' => $patroli->note,
                'latitude' => $patroli->latitude,
                'longitude' => $patroli->longitude,
                'project' => $patroli->project ? ['id'=>$patroli->project->id,'name'=>$patroli->project->name] : null,
                'checkpoint' => $patroli->checkpoint ? ['id'=>$patroli->checkpoint->id,'name'=>$patroli->checkpoint->name] : null,
                'employee' => $patroli->employee ? [
                    'id' => $patroli->employee->id,
                    'employee_code' => $patroli->employee->employee_code,
                    'full_name' => $patroli->employee->full_name
                ] : null,
                'files' => $files,
            ]
        ]);
    }
    // Start a patrol
    public function start(Request $request)
    {
        $data = $request->validate([
            // project_id dihilangkan: diambil otomatis dari assignment
            'checkpoint_id' => ['nullable','integer','exists:patroli_checkpoints,id'],
            'latitude' => ['nullable','numeric'],
            'longitude' => ['nullable','numeric'],
            'note' => ['nullable','string','max:500'],
        ]);
        $employee = $request->user()->employee; // must have employee profile
        if (!$employee) {
            return response()->json(['message' => 'Employee profile required'], Response::HTTP_FORBIDDEN);
        }

        // Ambil project assignment aktif
        $assignedProjects = $employee->assignedProjects()->pluck('client_projects.id')->toArray();
        if (count($assignedProjects) === 0) {
            return response()->json(['message' => 'Anda belum memiliki penugasan project'], 422);
        }
        if (count($assignedProjects) > 1) {
            // Untuk saat ini gagal; bisa dikembangkan pilih project tertentu
            return response()->json([
                'message' => 'Multiple project assignment. Mohon tentukan project.',
                'assigned_project_ids' => $assignedProjects,
            ], 422);
        }
        $projectId = $assignedProjects[0];

        $patroli = Patroli::create([
            'employee_id' => $employee->id,
            'project_id' => $projectId,
            'checkpoint_id' => $data['checkpoint_id'] ?? null,
            'start_time' => now(),
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'note' => $data['note'] ?? null,
            'status' => Patroli::STATUS_IN_PROGRESS,
        ]);
        return response()->json(['data' => $patroli->fresh()], 201);
    }

    // Visit (checkpoint update with geofence validation)
    public function visit(Request $request, Patroli $patroli)
    {
        $this->authorizePatroli($request, $patroli);
        abort_unless($patroli->status === Patroli::STATUS_IN_PROGRESS, 409, 'Patrol not in progress');
        $data = $request->validate([
            'checkpoint_id' => ['required','integer','exists:patroli_checkpoints,id'],
            'latitude' => ['required','numeric'],
            'longitude' => ['required','numeric'],
        ]);
        $checkpoint = PatroliCheckpoint::findOrFail($data['checkpoint_id']);
        $distance = null; $inside = true; $remaining = null; $radiusVal = null;
        if ($checkpoint->latitude && $checkpoint->longitude && $checkpoint->radius_m) {
            $distance = $this->haversine($checkpoint->latitude, $checkpoint->longitude, $data['latitude'], $data['longitude']);
            $inside = $distance <= $checkpoint->radius_m;
            $radiusVal = (float) $checkpoint->radius_m;
            if (! $inside) {
                return response()->json([
                    'message' => 'Outside checkpoint radius',
                    'distance_m' => round($distance,2),
                    'radius_m' => (float) $checkpoint->radius_m,
                    'inside' => false,
                    'remaining_m' => round($distance - $checkpoint->radius_m,2),
                ], 422);
            }
        }
        $patroli->update([
            'checkpoint_id' => $checkpoint->id,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
        ]);
        return response()->json([
            'data' => $patroli->fresh(['checkpoint']),
            'geofence' => $distance !== null ? [
                'distance_m' => round($distance,2),
                'radius_m' => $radiusVal,
                'inside' => $inside,
                'remaining_m' => $inside ? 0 : ($distance !== null && $radiusVal !== null ? round($distance - $radiusVal,2) : null)
            ] : null,
        ]);
    }

    // Complete patrol
    public function complete(Request $request, Patroli $patroli)
    {
        $this->authorizePatroli($request, $patroli);
        abort_unless($patroli->status === Patroli::STATUS_IN_PROGRESS, 409, 'Already completed');
        $data = $request->validate([
            'latitude' => ['nullable','numeric'],
            'longitude' => ['nullable','numeric'],
            'note' => ['nullable','string','max:500'],
        ]);
        $patroli->update([
            'end_time' => now(),
            'latitude' => $data['latitude'] ?? $patroli->latitude,
            'longitude' => $data['longitude'] ?? $patroli->longitude,
            'note' => $data['note'] ?? $patroli->note,
            'status' => Patroli::STATUS_COMPLETED,
        ]);
        return response()->json(['data' => $patroli->fresh()]);
    }

    // Upload evidence file
    public function uploadFile(Request $request, Patroli $patroli)
    {
        $this->authorizePatroli($request, $patroli);
        $request->validate([
            'file' => ['required','file','max:5120'],
        ]);
        $path = $request->file('file')->store('patroli-files','public');
        $file = PatroliFile::create([
            'patroli_id' => $patroli->id,
            'file_path' => $path,
        ]);
        return response()->json(['data' => $file], 201);
    }

    protected function authorizePatroli(Request $request, Patroli $patroli): void
    {
        $employee = $request->user()->employee ?? null;
        if (!$employee) {
            abort(403, 'Employee profile required');
        }

        // Check if it's user's own patrol
        if ($patroli->employee_id === $employee->id) {
            return;
        }

        // Check if user is supervisor of the patrol owner (for monitoring access)
        $patrolEmployee = $patroli->employee;
        if ($patrolEmployee && $patrolEmployee->approval_line === $employee->employee_code) {
            return;
        }

        abort(403, 'Not authorized to access this patrol');
    }

    protected function haversine($lat1, $lon1, $lat2, $lon2): float
    {
        $earth = 6371000; // meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        return $earth * $c;
    }

    // List checkpoints for employee's single assigned project (optional distance calc)
    public function checkpoints(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return response()->json(['message' => 'Employee profile required'], 403);
        }
        $assignedProjects = $employee->assignedProjects()->pluck('client_projects.id')->toArray();
        if (count($assignedProjects) === 0) {
            return response()->json(['message' => 'Anda belum memiliki penugasan project'], 422);
        }
        if (count($assignedProjects) > 1) {
            return response()->json([
                'message' => 'Multiple project assignment. Mohon tentukan project.',
                'assigned_project_ids' => $assignedProjects,
            ], 422);
        }
        $projectId = $assignedProjects[0];
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        $withDistance = is_numeric($lat) && is_numeric($lng);
        $checkpoints = PatroliCheckpoint::where('project_id',$projectId)->where('active', true)->orderBy('sequence')->get();
        $data = $checkpoints->map(function($c) use ($withDistance,$lat,$lng) {
            $distance = null; $inside = null;
            if ($withDistance && $c->latitude && $c->longitude) {
                $distance = $this->haversine($c->latitude, $c->longitude, (float)$lat, (float)$lng);
                if ($c->radius_m) {
                    $inside = $distance <= $c->radius_m;
                }
            }
            return [
                'id' => $c->id,
                'name' => $c->name,
                'latitude' => $c->latitude,
                'longitude' => $c->longitude,
                'radius_m' => $c->radius_m,
                'sequence' => $c->sequence,
                'distance_m' => $distance !== null ? round($distance,2) : null,
                'inside' => $inside,
                'remaining_m' => ($distance !== null && $c->radius_m && $inside === false) ? round($distance - $c->radius_m,2) : 0,
            ];
        });
        return response()->json(['data' => $data]);
    }
}
