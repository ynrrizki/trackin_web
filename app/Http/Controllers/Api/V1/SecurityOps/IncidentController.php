<?php

namespace App\Http\Controllers\Api\V1\SecurityOps;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\IncidentCategory;
use App\Models\Employee;
use App\Exports\IncidentsExport;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;

class IncidentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        $query = Incident::query()->with(['category', 'reporter', 'assignedTo'])->orderByDesc('incident_at');

        $canViewAll = $user->can('incident.view_all') || $user->hasRole('admin');

        if ($employee && !$canViewAll) {
            $allowedEmployeeIds = [$employee->id];
            $processedCodes = [];
            $queue = [$employee->employee_code];
            while (!empty($queue)) {
                $code = array_shift($queue);
                if (!$code || in_array($code, $processedCodes, true))
                    continue;
                $processedCodes[] = $code;
                $subs = Employee::where('approval_line', $code)->pluck('id', 'employee_code');
                if ($subs->isNotEmpty()) {
                    foreach ($subs as $empCode => $empId) {
                        if (!in_array($empId, $allowedEmployeeIds, true)) {
                            $allowedEmployeeIds[] = $empId;
                            $queue[] = $empCode;
                        }
                    }
                }
            }
            // User can see incidents they reported or assigned to them
            $query->where(function ($q) use ($allowedEmployeeIds, $employee) {
                $q->whereIn('reporter_employee_id', $allowedEmployeeIds)
                    ->orWhere('assigned_to_employee_id', $employee->id);
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }
        if ($request->filled('severity')) {
            $query->where('severity', $request->string('severity'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority'));
        }
        if ($request->filled('from')) {
            $query->where('incident_at', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->where('incident_at', '<=', $request->date('to'));
        }
        if ($q = $request->string('q')->toString()) {
            $query->where(function ($w) use ($q) {
                $w->where('location', 'like', "%$q%")
                    ->orWhere('description', 'like', "%$q%")
                    ->orWhere('related_name', 'like', "%$q%")
                    ->orWhere('related_status', 'like', "%$q%");
            });
        }

        $incidents = $query->paginate($request->integer('per_page', 20));

        return response()->json($incidents->through(function ($i) {
            return [
                'id' => $i->id,
                'reporter' => $i->reporter ? [
                    'id' => $i->reporter->id,
                    'employee_code' => $i->reporter->employee_code,
                    'full_name' => $i->reporter->full_name,
                ] : null,
                'assigned_to' => $i->assignedTo ? [
                    'id' => $i->assignedTo->id,
                    'employee_code' => $i->assignedTo->employee_code,
                    'full_name' => $i->assignedTo->full_name,
                ] : null,
                'category' => $i->category ? [
                    'id' => $i->category->id,
                    'name' => $i->category->name,
                ] : null,
                'incident_at' => optional($i->incident_at)->toIso8601String(),
                'long' => $i->long ? (float) $i->long : null,
                'lat' => $i->lat ? (float) $i->lat : null,
                'location' => $i->location,
                'related_name' => $i->related_name,
                'related_status' => $i->related_status,
                'severity' => $i->severity,
                'priority' => $i->priority,
                'status' => $i->status,
                'status_label' => $i->status_label,
                'priority_label' => $i->priority_label,
                'description' => $i->description,
                'handling_steps' => $i->handling_steps,
                'follow_up_actions' => $i->follow_up_actions,
                'resolution_notes' => $i->resolution_notes,
                'resolved_at' => optional($i->resolved_at)->toIso8601String(),
                'photo_url' => $i->photo_url,
                'created_at' => $i->created_at?->toIso8601String(),
            ];
        }));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => ['required', Rule::exists('incident_categories', 'id')],
            'incident_at' => ['required', 'date'],
            'long' => ['nullable', 'numeric'],
            'lat' => ['nullable', 'numeric'],
            'location' => ['nullable', 'string', 'max:255'],
            'related_name' => ['nullable', 'string', 'max:255'],
            'related_status' => ['nullable', 'string', 'max:255'],
            'severity' => ['required', 'string', Rule::in(['Rendah', 'Sedang', 'Tinggi'])],
            'description' => ['nullable', 'string'],
            'handling_steps' => ['nullable', 'string'],
            'photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($request->hasFile('photo')) {
            /** @var UploadedFile $file */
            $file = $request->file('photo');
            $path = $file->store('incidents', 'public');
            // Generate public URL (ensure 'public' disk is symlinked via storage:link)
            $validated['photo_url'] = asset('storage/' . $path);
        }

        $employee = Employee::where('user_id', $request->user()->id)->first();
        if ($employee) {
            $validated['reporter_employee_id'] = $employee->id;
        }

        $incident = Incident::create($validated);

        return response()->json([
            'message' => 'Incident created',
            'data' => $incident->fresh('category')
        ], 201);
    }

    public function show(Incident $incident)
    {
        $incident->load(['category', 'reporter', 'assignedTo']);
        return response()->json([
            'id' => $incident->id,
            'reporter' => $incident->reporter ? [
                'id' => $incident->reporter->id,
                'employee_code' => $incident->reporter->employee_code,
                'full_name' => $incident->reporter->full_name,
            ] : null,
            'assigned_to' => $incident->assignedTo ? [
                'id' => $incident->assignedTo->id,
                'employee_code' => $incident->assignedTo->employee_code,
                'full_name' => $incident->assignedTo->full_name,
            ] : null,
            'category' => $incident->category ? [
                'id' => $incident->category->id,
                'name' => $incident->category->name,
            ] : null,
            'incident_at' => optional($incident->incident_at)->toIso8601String(),
            'long' => $incident->long ? (float) $incident->long : null,
            'lat' => $incident->lat ? (float) $incident->lat : null,
            'location' => $incident->location,
            'related_name' => $incident->related_name,
            'related_status' => $incident->related_status,
            'severity' => $incident->severity,
            'priority' => $incident->priority,
            'status' => $incident->status,
            'status_label' => $incident->status_label,
            'priority_label' => $incident->priority_label,
            'description' => $incident->description,
            'handling_steps' => $incident->handling_steps,
            'follow_up_actions' => $incident->follow_up_actions,
            'resolution_notes' => $incident->resolution_notes,
            'resolved_at' => optional($incident->resolved_at)->toIso8601String(),
            'photo_url' => $incident->photo_url,
            'created_at' => $incident->created_at?->toIso8601String(),
            'updated_at' => $incident->updated_at?->toIso8601String(),
        ]);
    }

    public function update(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'category_id' => ['sometimes', Rule::exists('incident_categories', 'id')],
            'incident_at' => ['sometimes', 'date'],
            'long' => ['nullable', 'numeric'],
            'lat' => ['nullable', 'numeric'],
            'location' => ['nullable', 'string', 'max:255'],
            'related_name' => ['nullable', 'string', 'max:255'],
            'related_status' => ['nullable', 'string', 'max:255'],
            'severity' => ['sometimes', 'string', Rule::in(['Rendah', 'Sedang', 'Tinggi'])],
            'description' => ['nullable', 'string'],
            'handling_steps' => ['nullable', 'string'],
            'photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $path = $file->store('incidents', 'public');
            $validated['photo_url'] = asset('storage/' . $path);
        }

        $incident->update($validated);

        return response()->json([
            'message' => 'Incident updated',
            'data' => $incident->fresh('category')
        ]);
    }

    public function destroy(Incident $incident)
    {
        $incident->delete();
        return response()->json(['message' => 'Incident deleted']);
    }

    public function categories()
    {
        return response()->json(IncidentCategory::select('id', 'name')->orderBy('name')->get());
    }

    /**
     * Assign incident to officer
     */
    public function assign(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'assigned_to_employee_id' => ['required', 'exists:employees,id'],
        ]);

        $incident->update($validated);

        return response()->json([
            'message' => 'Insiden berhasil ditugaskan',
            'data' => $incident->fresh(['assignedTo'])
        ]);
    }

    /**
     * Update incident status
     */
    public function updateStatus(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in([
                    Incident::STATUS_REPORTED,
                    Incident::STATUS_INVESTIGATING,
                    Incident::STATUS_RESOLVED,
                    Incident::STATUS_CLOSED
                ])
            ],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $updates = ['status' => $validated['status']];

        // If resolving/closing, add timestamp and notes
        if (in_array($validated['status'], [Incident::STATUS_RESOLVED, Incident::STATUS_CLOSED])) {
            $updates['resolved_at'] = now();
            if (isset($validated['notes'])) {
                $updates['resolution_notes'] = $validated['notes'];
            }
        }

        $incident->update($updates);

        return response()->json([
            'message' => 'Status insiden berhasil diperbarui',
            'data' => $incident->fresh()
        ]);
    }

    /**
     * Update incident priority
     */
    public function updatePriority(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'priority' => [
                'required',
                Rule::in([
                    Incident::PRIORITY_LOW,
                    Incident::PRIORITY_MEDIUM,
                    Incident::PRIORITY_HIGH,
                    Incident::PRIORITY_CRITICAL
                ])
            ],
        ]);

        $incident->update($validated);

        return response()->json([
            'message' => 'Prioritas insiden berhasil diperbarui',
            'data' => $incident->fresh()
        ]);
    }

    /**
     * Add follow-up action
     */
    public function addFollowUpAction(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'description' => ['required', 'string', 'max:500'],
            'created_by' => ['nullable', 'string', 'max:255']
        ]);

        $followUps = $incident->follow_up_actions ?? [];
        $followUps[] = [
            'id' => uniqid(),
            'description' => $validated['description'],
            'created_by' => $validated['created_by'] ?? $request->user()->name ?? 'User',
            'created_at' => now()->toIso8601String(),
        ];

        $incident->update(['follow_up_actions' => $followUps]);

        return response()->json([
            'message' => 'Tindak lanjut berhasil ditambahkan',
            'data' => $incident->fresh()
        ]);
    }

    /**
     * Get incident statistics
     */
    public function statistics(Request $request)
    {
        $user = $request->user();
        $canViewAll = $user->can('incident.view_all') || $user->hasRole('admin');

        $query = Incident::query();

        if (!$canViewAll) {
            $employee = Employee::where('user_id', $user->id)->first();
            if ($employee) {
                $allowedEmployeeIds = [$employee->id];
                // Add subordinates logic here if needed
                $query->whereIn('reporter_employee_id', $allowedEmployeeIds);
            }
        }

        $stats = [
            'total' => $query->count(),
            'by_status' => $query->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),
            'by_priority' => $query->selectRaw('priority, count(*) as count')
                ->groupBy('priority')
                ->pluck('count', 'priority'),
            'by_severity' => $query->selectRaw('severity, count(*) as count')
                ->groupBy('severity')
                ->pluck('count', 'severity'),
            'recent_count' => $query->where('created_at', '>=', now()->subDays(7))->count(),
        ];

        return response()->json($stats);
    }
}

