<?php

namespace App\Http\Controllers\Api\HRMS;

use App\Http\Controllers\Controller;
use App\Models\Position;
use App\Models\PositionLevel;
use App\Models\Department;
use App\Models\EmploymentStatus;
use App\Models\EmployeeType;
use App\Models\OutsourcingField;
use App\Models\ClientProject;
use Illuminate\Http\JsonResponse;

class EmployeeMasterDataController extends Controller
{
    /**
     * Get all master data for employee form
     */
    public function getEmployeeMasterData(): JsonResponse
    {
        try {
            $data = [
                'positions' => Position::select('id', 'name')
                    ->where('status', 'active')
                    ->orderBy('name')
                    ->get(),

                'position_levels' => PositionLevel::select('id', 'name', 'order')
                    ->orderBy('order')
                    ->get(),

                'departments' => Department::select('id', 'name')
                    ->where('status', 'active')
                    ->orderBy('name')
                    ->get(),

                'employment_statuses' => EmploymentStatus::select('id', 'name')
                    ->where('status', 'active')
                    ->orderBy('name')
                    ->get(),

                'employee_types' => EmployeeType::select('id', 'name')
                    ->where('status', 'active')
                    ->orderBy('name')
                    ->get(),

                'outsourcing_fields' => OutsourcingField::select('id', 'name')
                    ->where('status', 'active')
                    ->orderBy('name')
                    ->get(),
            ];

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch master data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get positions only
     */
    public function getPositions(): JsonResponse
    {
        try {
            $positions = Position::select('id', 'name')
                ->where('status', 'active')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $positions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch positions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get position levels only
     */
    public function getPositionLevels(): JsonResponse
    {
        try {
            $levels = PositionLevel::select('id', 'name', 'order')
                ->orderBy('order')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $levels
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch position levels',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get departments only
     */
    public function getDepartments(): JsonResponse
    {
        try {
            $departments = Department::select('id', 'name')
                ->where('status', 'active')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $departments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch departments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get outsourcing fields only
     */
    public function getOutsourcingFields(): JsonResponse
    {
        try {
            $fields = OutsourcingField::select('id', 'name')
                ->where('status', 'active')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $fields
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch outsourcing fields',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get projects (id, name) for selection
     */
    public function getProjects(): JsonResponse
    {
        try {
            $projects = ClientProject::select('id', 'name')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $projects
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch projects',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
