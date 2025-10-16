<?php

namespace App\Http\Controllers\Api\HRMS;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmployeePickerController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::query()
            ->with([
                'position:id,name',
                'department:id,name',
                'positionLevel:id,name',
                'employmentStatus:id,name',
                'employeeType:id,name',
                'outsourceField:id,name',
            ]);

        // Basic search
        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        // Filters
        $filters = [
            'position' => 'position_id',
            'department' => 'department_id',
            'position_level' => 'level_id',
            'employment_status' => 'employment_status_id',
            'employee_type' => 'employee_type_id',
            'outsource_field' => 'outsourcing_field_id',
        ];
        foreach ($filters as $param => $column) {
            $val = $request->get($param);
            if ($val !== null && $val !== '') {
                $query->where($column, $val);
            }
        }

        // Pagination / infinite scroll style
        $perPage = (int) $request->get('per_page', 30);
        $page = (int) $request->get('page', 1);

        $paginator = $query->orderByDesc('id')->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'has_more' => $paginator->hasMorePages(),
            ],
        ]);
    }

    public function filters(Request $request)
    {
        // Provide lists of available filter options (id + name) for dynamic selects
        $base = Employee::query();

        if ($search = $request->string('search')->toString()) {
            $base->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        $ids = $base->select([
            'position_id',
            'department_id',
            'level_id',
            'employment_status_id',
            'employee_type_id',
            'outsourcing_field_id'
        ])->get();

        $idSets = [
            'position_ids' => $ids->pluck('position_id')->filter()->unique()->values(),
            'department_ids' => $ids->pluck('department_id')->filter()->unique()->values(),
            'position_level_ids' => $ids->pluck('level_id')->filter()->unique()->values(),
            'employment_status_ids' => $ids->pluck('employment_status_id')->filter()->unique()->values(),
            'employee_type_ids' => $ids->pluck('employee_type_id')->filter()->unique()->values(),
            'outsource_field_ids' => $ids->pluck('outsourcing_field_id')->filter()->unique()->values(),
        ];

        // Eager load names in bulk
        $map = fn($model, $ids) => $model::whereIn('id', $ids)->get(['id', 'name']);
        return response()->json([
            'position' => $map(\App\Models\Position::class, $idSets['position_ids']),
            'department' => $map(\App\Models\Department::class, $idSets['department_ids']),
            'position_level' => $map(\App\Models\PositionLevel::class, $idSets['position_level_ids']),
            'employment_status' => $map(\App\Models\EmploymentStatus::class, $idSets['employment_status_ids']),
            'employee_type' => $map(\App\Models\EmployeeType::class, $idSets['employee_type_ids']),
            'outsource_field' => $map(\App\Models\OutsourcingField::class, $idSets['outsource_field_ids']),
        ]);
    }
}
