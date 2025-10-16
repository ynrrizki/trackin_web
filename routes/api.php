<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\HRMS\EmployeeApiController;
// use App\Http\Controllers\Api\EmployeeApiController as GeneralEmployeeApiController;
use App\Http\Controllers\Api\HRMS\EmployeeMasterDataController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Api\HRMS\EmployeeInviteController;
use App\Http\Controllers\Api\TrackingController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Route::prefix('master-data')->name('master-data.')->group(function () {
//     Route::get('/employee-form', [MasterDataController::class, 'getEmployeeMasterData'])->name('employee-form');
//     Route::get('/positions', [MasterDataController::class, 'getPositions'])->name('positions');
//     Route::get('/position-levels', [MasterDataController::class, 'getPositionLevels'])->name('position-levels');
//     Route::get('/departments', [MasterDataController::class, 'getDepartments'])->name('departments');
// });

Route::get('/test', function () {
    $employee = App\Models\Employee::find(2);
    if ($employee) {
        // Create BPJS Kesehatan record
        $employee->bpjs()->updateOrCreate(
            ['bpjs_type' => 'KS'],
            [
                'participant_number' => '1234567890123456',
                'contribution_type' => 'BY-COMPANY'
            ]
        );

        // Create BPJS Ketenagakerjaan record
        $employee->bpjs()->updateOrCreate(
            ['bpjs_type' => 'TK'],
            [
                'participant_number' => '9876543210987654',
                'contribution_type' => 'BY-COMPANY'
            ]
        );
    }

    return response()->json(App\Models\Employee::with([
        'position',
        'positionLevel',
        'department',
        'employmentStatus',
        'employeeType',
        'outsourcingField',
        'emergencyContacts',
        'bankAccounts',
        'bodyProfile',
        'bpjs',
        'taxStatus'
    ])->find(2));
});

// Protected routes
Route::middleware('auth')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/refresh-token', [AuthController::class, 'refreshToken']);

    // Role & Permission Management (Super Admin only)
    Route::middleware(['permission:roles.view'])->group(function () {
        Route::get('/roles', [RolePermissionController::class, 'getRoles']);
        Route::get('/permissions', [RolePermissionController::class, 'getPermissions']);
    });

    Route::middleware(['permission:roles.create'])->group(function () {
        Route::post('/roles', [RolePermissionController::class, 'createRole']);
        Route::post('/permissions', [RolePermissionController::class, 'createPermission']);

        // Quick Setup Routes
        Route::post('/roles-permissions/quick-setup', [RolePermissionController::class, 'quickSetup'])->name('roles-permissions.quick-setup');
        Route::post('/roles-permissions/bulk-create-permissions', [RolePermissionController::class, 'bulkCreatePermissions'])->name('roles-permissions.bulk-permissions');
        Route::post('/roles-permissions/create-default-roles', [RolePermissionController::class, 'createDefaultRoles'])->name('roles-permissions.default-roles');

        // Import/Export Routes
        Route::post('/roles/import', [RolePermissionController::class, 'importRoles'])->name('roles.import');
        Route::post('/roles/quick-setup', [RolePermissionController::class, 'quickSetupTemplate'])->name('roles.quick-setup');
    });

    Route::middleware(['permission:roles.edit'])->group(function () {
        Route::put('/roles/{role}', [RolePermissionController::class, 'updateRole']);
    });

    Route::middleware(['permission:roles.delete'])->group(function () {
        Route::delete('/roles/{role}', [RolePermissionController::class, 'deleteRole']);
    });

    // User Role Assignment (requires permission management)
    Route::middleware(['permission:permissions.assign'])->group(function () {
        Route::post('/users/{user}/assign-roles', [RolePermissionController::class, 'assignRoleToUser']);
        Route::post('/users/{user}/remove-roles', [RolePermissionController::class, 'removeRoleFromUser']);
        Route::post('/users/{user}/assign-permissions', [RolePermissionController::class, 'assignPermissionToUser']);
        Route::post('/users/{user}/remove-permissions', [RolePermissionController::class, 'removePermissionFromUser']);
        Route::get('/users/{user}/roles-permissions', [RolePermissionController::class, 'getUserRolesAndPermissions']);
    });

    // Master Data Routes
    Route::prefix('master-data')->name('master-data.')->group(function () {
        Route::get('/employee-form', [EmployeeMasterDataController::class, 'getEmployeeMasterData'])->name('employee-form');
        Route::get('/positions', [EmployeeMasterDataController::class, 'getPositions'])->name('positions');
        Route::get('/position-levels', [EmployeeMasterDataController::class, 'getPositionLevels'])->name('position-levels');
        Route::get('/departments', [EmployeeMasterDataController::class, 'getDepartments'])->name('departments');
    });

    // HRMS Module Routes
    Route::prefix('hrms')->name('api.hrms.')->group(function () {
        // Employee Management Routes
        Route::middleware(['permission:employee.view'])->group(function () {
            Route::get('employees', [EmployeeApiController::class, 'index']);
            // Employee picker (optimized pagination & filters)
            Route::get('employees/picker', [\App\Http\Controllers\Api\HRMS\EmployeePickerController::class, 'index'])->name('employees.picker');
            Route::get('employees/picker/filters', [\App\Http\Controllers\Api\HRMS\EmployeePickerController::class, 'filters'])->name('employees.picker.filters');

            // Export Excel Employees
            Route::get('employees/export', [App\Http\Controllers\Api\HRMS\EmployeeApiController::class, 'export'])
                ->name('employee.export');

            Route::get('employees/{employee}', [EmployeeApiController::class, 'show']);
        });

        Route::middleware(['permission:employee.create'])->group(function () {
            Route::post('employees', [EmployeeApiController::class, 'store'])->name('employees.store');

            // Bulk employee routes
            Route::get('employees/bulk/template', [EmployeeApiController::class, 'downloadTemplate'])->name('employees.bulk.template');
            Route::post('employees/bulk/import', [EmployeeApiController::class, 'bulkImport'])->name('employees.bulk.import');
            Route::get('employees/bulk/master-data', [EmployeeApiController::class, 'getMasterDataForBulk'])->name('employees.bulk.master-data');
        });

        Route::middleware(['permission:employee.edit'])->group(function () {
            Route::put('employees/{employee}', [EmployeeApiController::class, 'update'])->name('employees.update');
            Route::patch('employees/{employee}', [EmployeeApiController::class, 'update'])->name('employees.patch');

            // Per-section update endpoints
            Route::prefix('employees/{employee}/sections')->group(function () {
                Route::patch('personal', [EmployeeApiController::class, 'updatePersonal'])->name('employees.update.personal');
                Route::patch('employment', [EmployeeApiController::class, 'updateEmployment'])->name('employees.update.employment');
                Route::patch('payroll', [EmployeeApiController::class, 'updatePayroll'])->name('employees.update.payroll');
                // Unified section update endpoint
                Route::patch('{section}', [EmployeeApiController::class, 'updateSection'])->name('employees.update.section');
            });
        });

        Route::middleware(['permission:employee.delete'])->group(function () {
            Route::delete('employees/{employee}', [EmployeeApiController::class, 'destroy'])->name('employees.destroy');
        });

        Route::get('/attendance/export', [App\Http\Controllers\HRMS\AttendanceController::class, 'export']);
    });

    // Security Ops Module Routes
    Route::prefix('security-ops')->name('api.security-ops.')->group(function () {
        // Incident Management Routes
        // Route::middleware(['permission:incident.view'])->group(function () {
        Route::get('incidents', [App\Http\Controllers\Api\SecurityOps\IncidentController::class, 'index']);
        Route::get('incidents/categories', [App\Http\Controllers\Api\SecurityOps\IncidentController::class, 'categories']);
        Route::get('incidents/statistics', [App\Http\Controllers\Api\SecurityOps\IncidentController::class, 'statistics']);
        Route::get('incidents/export', [App\Http\Controllers\Api\SecurityOps\IncidentController::class, 'export']);
        Route::get('incidents/{incident}', [App\Http\Controllers\Api\SecurityOps\IncidentController::class, 'show']);
        // });

        Route::middleware(['permission:incident.create'])->group(function () {
            Route::post('incidents', [App\Http\Controllers\Api\SecurityOps\IncidentController::class, 'store']);
        });

        // Route::middleware(['permission:incident.edit'])->group(function () {
        Route::put('incidents/{incident}', [App\Http\Controllers\Api\SecurityOps\IncidentController::class, 'update']);
        Route::patch('incidents/{incident}/assign', [App\Http\Controllers\Api\SecurityOps\IncidentController::class, 'assign']);
        Route::patch('incidents/{incident}/status', [App\Http\Controllers\Api\SecurityOps\IncidentController::class, 'updateStatus']);
        Route::patch('incidents/{incident}/priority', [App\Http\Controllers\Api\SecurityOps\IncidentController::class, 'updatePriority']);
        Route::post('incidents/{incident}/follow-up', [App\Http\Controllers\Api\SecurityOps\IncidentController::class, 'addFollowUp']);
        // });

        Route::middleware(['permission:incident.delete'])->group(function () {
            Route::delete('incidents/{incident}', [App\Http\Controllers\Api\SecurityOps\IncidentController::class, 'destroy']);
        });
    });

    // User Management Routes (requires appropriate permissions)
    Route::middleware(['permission:users.view'])->group(function () {
        Route::get('users', [UserController::class, 'index']);
    });

    Route::middleware(['permission:users.create'])->group(function () {
        Route::post('users', [UserController::class, 'store']);
    });

    Route::middleware(['permission:users.edit'])->group(function () {
        Route::put('users/{user}', [UserController::class, 'update']);
        Route::patch('users/{user}', [UserController::class, 'update']);
    });

    Route::middleware(['permission:users.delete'])->group(function () {
        Route::delete('users/{user}', [UserController::class, 'destroy']);
    });

    // Employee Invitation Routes (requires user creation permission)
    Route::middleware(['permission:users.create'])->group(function () {
        Route::post('employees/invite-user', [EmployeeInviteController::class, 'inviteUser']);
        Route::post('employees/bulk-invite-users', [EmployeeInviteController::class, 'bulkInviteUsers']);
        Route::get('employees/without-users', [EmployeeApiController::class, 'getEmployeesWithoutUsers']);
        Route::get('employees/with-users', [EmployeeInviteController::class, 'getEmployeesWithUsers']);
    });

    // Realtime tracking routes
    Route::prefix('tracking')->group(function () {
        Route::post('/location', [TrackingController::class, 'updateLocation']);
        Route::post('/online', [TrackingController::class, 'online']);
        Route::post('/offline', [TrackingController::class, 'offline']);
        Route::get('/recent', [TrackingController::class, 'recent']);
        Route::get('/last', [TrackingController::class, 'last']);
    });
});

require __DIR__ . '/api/v1.php';
