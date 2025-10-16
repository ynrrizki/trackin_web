<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ApprovableType;
use App\Models\ApproverLayer;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class ApproverLayerController extends Controller
{
    /**
     * Display approver layer settings index
     */
    public function index()
    {
        // Get all approvable types with their layer statistics
        $approvableTypes = ApprovableType::withCount([
            'approverLayers as total_layers',
            'activeApproverLayers as active_layers'
        ])
            ->with([
                'approverLayers' => function ($query) {
                    $query->latest('updated_at')->limit(1);
                }
            ])
            ->get()
            ->map(function ($type) {
                $lastUpdated = $type->approverLayers->first()?->updated_at ?? $type->updated_at;

                return [
                    'approvable_type_id' => $type->id,
                    'approvable_type' => $type->model_class,
                    'display_name' => $type->display_name,
                    'description' => $type->description,
                    'icon' => $type->icon,
                    'total_layers' => $type->total_layers,
                    'active_layers' => $type->active_layers,
                    'last_updated' => $lastUpdated,
                ];
            });

        return Inertia::render('settings/approver-layer/page', [
            'approver_layers' => $approvableTypes,
        ]);
    }

    /**
     * Display approver layer detail for specific type
     */
    public function show($approvableTypeId)
    {
        $approvableType = ApprovableType::findOrFail($approvableTypeId);

        // Get existing layers for this type
        $layers = ApproverLayer::where('approvable_type_id', $approvableTypeId)
            ->orderBy('level')
            ->get()
            ->map(function ($layer) {
                // Use the safe accessor from the model
                $approverData = $layer->approver_data;

                return [
                    'id' => $layer->id,
                    'level' => $layer->level,
                    'approvable_type_id' => $layer->approvable_type_id,
                    'approver_id' => $layer->approver_id,
                    'approver_type' => $layer->approver_type,
                    'approver_name' => $approverData['name'],
                    'approver_email' => $approverData['email'],
                    'department' => $approverData['department'],
                    'status' => $layer->status,
                    'description' => $layer->description,
                ];
            });

        // Get available approvers (users, employees, and roles)
        $availableApprovers = [
            'users' => User::select('id', 'name', 'email')
                ->whereDoesntHave('employee') // Filter users yang tidak memiliki employee record
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'department' => $user->department ?? null,
                        'type' => 'App\\Models\\User',
                        'category' => 'users',
                        'display' => $user->name . ' (' . $user->email . ')',
                    ];
                }),
            'employees' => \App\Models\Employee::select('id', 'full_name', 'email', 'employee_code')
                ->with('department')
                ->get()
                ->map(function ($employee) {
                    return [
                        'id' => $employee->id,
                        'name' => $employee->full_name,
                        'email' => $employee->email,
                        'employee_id' => $employee->employee_id,
                        'department' => $employee->department->name ?? null,
                        'type' => 'App\\Models\\Employee',
                        'category' => 'employees',
                        'display' => $employee->full_name . ' (' . $employee->employee_code . ')',
                    ];
                }),
            'roles' => Role::select('id', 'name')
                ->get()
                ->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'description' => null,
                        'type' => 'Spatie\\Permission\\Models\\Role',
                        'category' => 'roles',
                        'display' => $role->name,
                    ];
                }),
        ];

        return Inertia::render('settings/approver-layer/detail', [
            'approvable_type' => $approvableType->model_class,
            'approvable_type_id' => $approvableType->id,
            'display_name' => $approvableType->display_name,
            'layers' => $layers,
            'available_approvers' => $availableApprovers,
        ]);
    }

    /**
     * Update approver layers for specific type
     */
    public function update(Request $request, $approvableTypeId)
    {
        $approvableType = ApprovableType::findOrFail($approvableTypeId);

        $request->validate([
            'layers' => 'required|array',
            'layers.*.approver_id' => 'required|integer',
            'layers.*.approver_type' => 'required|string',
            'layers.*.level' => 'required|integer',
            'layers.*.status' => 'required|in:active,inactive',
            'layers.*.description' => 'nullable|string',
        ]);

        // Delete existing layers for this type
        ApproverLayer::where('approvable_type_id', $approvableTypeId)->delete();

        // Create new layers
        foreach ($request->layers as $index => $layerData) {
            ApproverLayer::create([
                'approvable_type_id' => $approvableTypeId,
                'approver_id' => $layerData['approver_id'],
                'approver_type' => $layerData['approver_type'],
                'level' => $layerData['level'],
                'status' => $layerData['status'],
                'description' => $layerData['description'],
            ]);
        }

        return back()->with('success', 'Approver layers updated successfully.');
    }
}
