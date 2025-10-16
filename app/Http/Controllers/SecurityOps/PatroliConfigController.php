<?php

namespace App\Http\Controllers\SecurityOps;

use App\Http\Controllers\Controller;
use App\Models\ClientProject;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PatroliConfigController extends Controller
{
    public function projects(Request $request)
    {
        $query = ClientProject::select('id', 'name', 'latitude', 'longitude', 'required_agents', 'outsourcing_field_id', 'notes as description', 'created_at')
            ->withCount('checkpoints')
            ->selectRaw('(SELECT COUNT(*)
                         FROM employee_projects ep
                         JOIN employees e ON ep.employee_id = e.id
                         WHERE ep.project_id = client_projects.id
                         AND e.status = ?
                         AND e.outsourcing_field_id = client_projects.outsourcing_field_id) as current_agents_count')
            ->addBinding('active', 'select');

        // Search filter
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('notes', 'LIKE', "%{$search}%");
            });
        }

        // Coordinates filter
        if ($request->filled('coordinates')) {
            $coordinatesFilter = $request->get('coordinates');
            if ($coordinatesFilter === 'with-coords') {
                $query->whereNotNull('latitude')->whereNotNull('longitude');
            } elseif ($coordinatesFilter === 'without-coords') {
                $query->where(function ($q) {
                    $q->whereNull('latitude')->orWhereNull('longitude');
                });
            }
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        switch ($sortBy) {
            case 'checkpoints':
                $query->orderBy('checkpoints_count', $sortOrder);
                break;
            case 'required_agents':
                $query->orderBy('required_agents', $sortOrder);
                break;
            case 'current_agents':
                $query->orderBy('current_agents_count', $sortOrder);
                break;
            case 'created_at':
                $query->orderBy('created_at', $sortOrder);
                break;
            default:
                $query->orderBy('name', $sortOrder);
        }

        $projects = $query->paginate(20)->withQueryString();

        return Inertia::render('security-ops/patroli/projects', [
            'projects' => $projects,
            'filters' => [
                'search' => $request->get('search'),
                'coordinates' => $request->get('coordinates'),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }
}
