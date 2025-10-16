<?php

namespace App\Http\Controllers\SecurityOps;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\IncidentCategory;
use App\Models\Employee;
use App\Exports\IncidentsExport;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class IncidentController extends Controller
{
    public function index(Request $request)
    {
        // Validate date range if provided
        $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
        ]);

        $filters = [
            'q' => $request->string('q')->toString(),
            'category_id' => $request->integer('category_id') ?: null,
            'severity' => $request->string('severity')->toString(),
            'status' => $request->string('status')->toString(),
            'priority' => $request->string('priority')->toString(),
            'from' => $request->string('from')->toString(),
            'to' => $request->string('to')->toString(),
        ];

        // If no date range provided, set default to last 60 days to cover typical incident data
        if (!$filters['from'] && !$filters['to']) {
            $filters['from'] = now()->subDays(60)->format('Y-m-d');
            $filters['to'] = now()->format('Y-m-d');
        }

        // Validate max range (90 days)
        if ($filters['from'] && $filters['to']) {
            $fromDate = \Carbon\Carbon::parse($filters['from']);
            $toDate = \Carbon\Carbon::parse($filters['to']);
            $daysDiff = $fromDate->diffInDays($toDate);

            if ($daysDiff > 90) {
                return back()->withErrors(['date_range' => 'Rentang waktu maksimal adalah 90 hari.']);
            }
        }

        $query = Incident::query()
            ->with(['category', 'reporter', 'assignedTo'])
            ->orderByDesc('incident_at');


        if ($filters['category_id']) {
            $query->where('category_id', $filters['category_id']);
        }
        if ($filters['severity']) {
            $query->where('severity', $filters['severity']);
        }
        if ($filters['status']) {
            $query->where('status', $filters['status']);
        }
        
        if ($filters['priority']) {
            $query->where('priority', $filters['priority']);
        }

        if ($filters['from']) {
            $query->whereDate('incident_at', '>=', $filters['from']);
        }
        
        if ($filters['to']) {
            $query->whereDate('incident_at', '<=', $filters['to']);
        }
        
        if ($filters['q']) {
            $q = $filters['q'];
            $query->where(function ($w) use ($q) {
                $w->where('location', 'like', "%$q%")
                    ->orWhere('description', 'like', "%$q%")
                    ->orWhere('related_name', 'like', "%$q%")
                    ->orWhere('related_status', 'like', "%$q%");
            });
        }

        // Limit to avoid overloading map; adjust as needed
        $incidents = $query->limit(300)->get()->map(function ($i) {
            return [
                'id' => $i->id,
                'lat' => (float) $i->lat,
                'long' => (float) $i->long,
                'location' => $i->location,
                'incident_at' => optional($i->incident_at)->toDateTimeString(),
                'severity' => $i->severity,
                'priority' => $i->priority,
                'status' => $i->status,
                'status_label' => $i->status_label,
                'priority_label' => $i->priority_label,
                'description' => $i->description,
                'handling_steps' => $i->handling_steps,
                'related_name' => $i->related_name,
                'related_status' => $i->related_status,
                'photo_url' => $i->photo_url,
                'follow_up_actions' => $i->follow_up_actions,
                'resolution_notes' => $i->resolution_notes,
                'resolved_at' => optional($i->resolved_at)->toIso8601String(),
                'category' => $i->category ? [
                    'id' => $i->category->id,
                    'name' => $i->category->name,
                ] : null,
                'reporter' => $i->reporter ? [
                    'id' => $i->reporter->id,
                    'full_name' => $i->reporter->full_name,
                ] : null,
                'assigned_to' => $i->assignedTo ? [
                    'id' => $i->assignedTo->id,
                    'full_name' => $i->assignedTo->full_name,
                ] : null,
            ];
        });

        return Inertia::render('security-ops/incident/page', [
            'incidents' => $incidents,
            'categories' => IncidentCategory::select('id','name')->orderBy('name')->get(),
            'employees' => Employee::select('id','full_name')->orderBy('full_name')->get(),
            'filters' => $filters,
        ]);
    }

    public function export(Request $request)
    {
        $filters = [
            'q' => $request->string('q')->toString(),
            'category_id' => $request->integer('category_id') ?: null,
            'severity' => $request->string('severity')->toString(),
            'status' => $request->string('status')->toString(),
            'priority' => $request->string('priority')->toString(),
            'from' => $request->string('from')->toString(),
            'to' => $request->string('to')->toString(),
        ];

        // Clean empty filters
        $filters = array_filter($filters, function($value) {
            return $value !== null && $value !== '';
        });

        $filename = 'laporan-insiden-' . now()->format('Y-m-d-H-i-s') . '.xlsx';

        return Excel::download(new IncidentsExport($filters), $filename);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:incident_categories,id'],
            'incident_at' => ['required', 'date'],
            'long' => ['nullable', 'numeric'],
            'lat' => ['nullable', 'numeric'],
            'location' => ['nullable', 'string', 'max:255'],
            'related_name' => ['nullable', 'string', 'max:255'],
            'related_status' => ['nullable', 'string', 'max:255'],
            'severity' => ['required', 'string', 'in:Rendah,Sedang,Tinggi'],
            'description' => ['nullable', 'string'],
            'handling_steps' => ['nullable', 'string'],
            'photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $path = $file->store('incidents', 'public');
            $validated['photo_url'] = asset('storage/' . $path);
        }

        $employee = Employee::where('user_id', $request->user()->id)->first();
        if ($employee) {
            $validated['reporter_employee_id'] = $employee->id;
        }

        $incident = Incident::create($validated);

        return response()->json([
            'message' => 'Incident berhasil dibuat',
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
                'name' => $incident->reporter->full_name,
            ] : null,
            'assigned_to' => $incident->assignedTo ? [
                'id' => $incident->assignedTo->id,
                'name' => $incident->assignedTo->full_name,
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
        ]);
    }

    public function update(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'category_id' => ['sometimes', 'exists:incident_categories,id'],
            'incident_at' => ['sometimes', 'date'],
            'long' => ['nullable', 'numeric'],
            'lat' => ['nullable', 'numeric'],
            'location' => ['nullable', 'string', 'max:255'],
            'related_name' => ['nullable', 'string', 'max:255'],
            'related_status' => ['nullable', 'string', 'max:255'],
            'severity' => ['sometimes', 'string', 'in:Rendah,Sedang,Tinggi'],
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
            'message' => 'Incident berhasil diupdate',
            'data' => $incident->fresh('category')
        ]);
    }

    public function destroy(Incident $incident)
    {
        $incident->delete();

        return response()->json([
            'message' => 'Incident berhasil dihapus'
        ]);
    }

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

    public function updateStatus(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:reported,investigating,resolved,closed'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $updates = ['status' => $validated['status']];

        // If resolving/closing, add timestamp and notes
        if (in_array($validated['status'], ['resolved', 'closed'])) {
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

    public function updatePriority(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'priority' => ['required', 'in:low,medium,high,critical'],
        ]);

        $incident->update($validated);

        return response()->json([
            'message' => 'Prioritas insiden berhasil diperbarui',
            'data' => $incident->fresh()
        ]);
    }

    public function addFollowUp(Request $request, Incident $incident)
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
}
