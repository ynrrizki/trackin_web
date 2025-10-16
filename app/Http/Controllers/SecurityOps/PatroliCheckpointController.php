<?php

namespace App\Http\Controllers\SecurityOps;

use App\Http\Controllers\Controller;
use App\Models\PatroliCheckpoint;
use App\Models\ClientProject;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PatroliCheckpointController extends Controller
{
    public function index(ClientProject $project)
    {
        // Removed incorrect $project->load(['id','name']) which attempted to eager-load non-relations
        return Inertia::render('security-ops/patroli/checkpoints', [
            'project' => $project->only(['id','name']),
            'checkpoints' => PatroliCheckpoint::where('project_id', $project->id)
                ->orderBy('sequence')
                ->get(),
        ]);
    }

    public function store(Request $request, ClientProject $project)
    {
        $data = $request->validate([
            'name' => ['required','string','max:150'],
            'description' => ['nullable','string'],
            'latitude' => ['nullable','numeric'],
            'longitude' => ['nullable','numeric'],
            'radius_m' => ['nullable','integer','min:5','max:500'],
            'sequence' => ['nullable','integer','min:0'],
            'active' => ['nullable','boolean'],
        ]);
        if (!isset($data['radius_m'])) { $data['radius_m'] = 25; }
        $data['project_id'] = $project->id;
        PatroliCheckpoint::create($data);
        return back()->with('success','Checkpoint added');
    }

    public function update(Request $request, PatroliCheckpoint $checkpoint)
    {
        $data = $request->validate([
            'name' => ['sometimes','string','max:150'],
            'description' => ['nullable','string'],
            'latitude' => ['nullable','numeric'],
            'longitude' => ['nullable','numeric'],
            'radius_m' => ['nullable','integer','min:5','max:500'],
            'sequence' => ['nullable','integer','min:0'],
            'active' => ['nullable','boolean'],
        ]);
        $checkpoint->update($data);
        return back()->with('success','Checkpoint updated');
    }

    public function destroy(PatroliCheckpoint $checkpoint)
    {
        $checkpoint->delete();
        return back()->with('success','Checkpoint deleted');
    }
}
