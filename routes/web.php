<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;



Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', App\Http\Controllers\DashboardController::class)->name('dashboard');

    // Employee Tracking Map
    Route::get('/employee-tracking', [App\Http\Controllers\EmployeeTrackingController::class, 'index'])
        ->name('employee-tracking.index');
    Route::get('/employee-tracking/export', [App\Http\Controllers\EmployeeTrackingController::class, 'export'])
        ->name('employee-tracking.export');


    Route::get('/inbox', [App\Http\Controllers\InboxController::class, 'index'])->name('inbox.index');
    Route::patch('/inbox/notifications/{notification}/read', [App\Http\Controllers\InboxController::class, 'markAsRead'])->name('inbox.notifications.read');
    Route::patch('/inbox/notifications/read-all', [App\Http\Controllers\InboxController::class, 'markAllAsRead'])->name('inbox.notifications.read-all');
    Route::patch('/inbox/approvals/{approval}/approve', [App\Http\Controllers\InboxController::class, 'approve'])->name('inbox.approvals.approve');
    Route::patch('/inbox/approvals/{approval}/reject', [App\Http\Controllers\InboxController::class, 'reject'])->name('inbox.approvals.reject');


    // HRMS - Human Resource Management System
    Route::prefix('hrms')->name('hrms.')->group(function () {
        // Employees
        Route::prefix('employees')->name('employees.')->group(function () {
            Route::get('/', [App\Http\Controllers\HRMS\EmployeeController::class, 'index'])
                ->name('index');
            Route::get('/create', [App\Http\Controllers\HRMS\EmployeeController::class, 'create'])
                ->name('create');
            Route::get('/bulk', [App\Http\Controllers\HRMS\EmployeeController::class, 'bulk'])
                ->name('bulk');



            // Employee Management with User Invite functionality
            // Route::get('/management', [App\Http\Controllers\EmployeeController::class, 'index'])
            //     ->name('management.index');

            // Employee Transfers (history & creation)
            Route::get('/transfers', [App\Http\Controllers\HRMS\EmployeeTransferController::class, 'all'])
                ->name('transfers.index');
            Route::get('/{employee}/transfers', [App\Http\Controllers\HRMS\EmployeeTransferController::class, 'index'])
                ->name('transfers.show');
            Route::post('/{employee}/transfers', [App\Http\Controllers\HRMS\EmployeeTransferController::class, 'store'])
                ->name('transfers.store');

            // Quick search employees for transfer combobox
            // Route::get('/api/quick/employees', [App\Http\Controllers\API\EmployeeQuickSearchController::class, 'index'])
            //     ->name('api.quick.employees');


            // Employee picker (optimized pagination & filters)
            Route::get('picker', [\App\Http\Controllers\Api\HRMS\EmployeePickerController::class, 'index'])->name('picker');
            Route::get('picker/filters', [\App\Http\Controllers\Api\HRMS\EmployeePickerController::class, 'filters'])->name('picker.filters');


            Route::get('/{employee}', [App\Http\Controllers\HRMS\EmployeeController::class, 'show'])
                ->name('show');
            Route::get('/{employee}/edit', [App\Http\Controllers\HRMS\EmployeeController::class, 'edit'])
                ->name('edit');
            Route::delete('/{employee}', [App\Http\Controllers\EmployeeController::class, 'destroy'])
                ->name('employees.destroy');
            Route::patch('/{employee}/resign', [App\Http\Controllers\EmployeeController::class, 'resign'])
                ->name('employees.resign');
        });

        // Attendance routes
        Route::prefix('/attendance')->name('attendance.')->group(function () {
            Route::get('/', [App\Http\Controllers\HRMS\AttendanceController::class, 'index'])
                ->name('index');
            Route::get('/export', [App\Http\Controllers\HRMS\AttendanceController::class, 'export'])
                ->name('export');
            Route::get('/create', [App\Http\Controllers\HRMS\AttendanceController::class, 'create'])
                ->name('create');
            Route::get('/bulk-create', [App\Http\Controllers\HRMS\AttendanceController::class, 'bulkCreate'])
                ->name('bulk-create');
            Route::post('/', [App\Http\Controllers\HRMS\AttendanceController::class, 'store'])
                ->name('store');
            Route::post('/bulk-store', [App\Http\Controllers\HRMS\AttendanceController::class, 'bulkStore'])
                ->name('bulk-store');
            Route::get('/{attendance}', [App\Http\Controllers\HRMS\AttendanceController::class, 'show'])
                ->name('show');
            Route::get('/{attendance}/edit', [App\Http\Controllers\HRMS\AttendanceController::class, 'edit'])
                ->name('edit');
            Route::put('/{attendance}', [App\Http\Controllers\HRMS\AttendanceController::class, 'update'])
                ->name('update');
            Route::delete('/{attendance}', [App\Http\Controllers\HRMS\AttendanceController::class, 'destroy'])
                ->name('destroy');
        });

        // Overtime routes
        Route::prefix('/overtime')->name('overtime.')->group(function () {
            Route::get('/', [App\Http\Controllers\HRMS\OvertimeController::class, 'index'])
                ->name('index');
            Route::get('/create', [App\Http\Controllers\HRMS\OvertimeController::class, 'create'])
                ->name('create');
            Route::post('/', [App\Http\Controllers\HRMS\OvertimeController::class, 'store'])
                ->name('store');
            Route::get('/{overtime}', [App\Http\Controllers\HRMS\OvertimeController::class, 'show'])
                ->name('show');
            Route::get('/{overtime}/edit', [App\Http\Controllers\HRMS\OvertimeController::class, 'edit'])
                ->name('edit');
            Route::put('/{overtime}', [App\Http\Controllers\HRMS\OvertimeController::class, 'update'])
                ->name('update');
            Route::delete('/{overtime}', [App\Http\Controllers\HRMS\OvertimeController::class, 'destroy'])
                ->name('destroy');
            Route::patch('/{overtime}/approve', [App\Http\Controllers\HRMS\OvertimeController::class, 'approve'])
                ->name('approve');
            Route::patch('/{overtime}/reject', [App\Http\Controllers\HRMS\OvertimeController::class, 'reject'])
                ->name('reject');
        });

        // Leave routes
        Route::prefix('/leave')->name('leave.')->group(function () {
            Route::get('', [App\Http\Controllers\HRMS\LeaveController::class, 'index'])
                ->name('index');
            Route::get('/create', [App\Http\Controllers\HRMS\LeaveController::class, 'create'])
                ->name('create');
            Route::post('', [App\Http\Controllers\HRMS\LeaveController::class, 'store'])
                ->name('store');
            Route::get('/{leave}', [App\Http\Controllers\HRMS\LeaveController::class, 'show'])
                ->name('show');
            Route::get('/{leave}/edit', [App\Http\Controllers\HRMS\LeaveController::class, 'edit'])
                ->name('edit');
            Route::put('/{leave}', [App\Http\Controllers\HRMS\LeaveController::class, 'update'])
                ->name('update');
            Route::delete('/{leave}', [App\Http\Controllers\HRMS\LeaveController::class, 'destroy'])
                ->name('destroy');
            Route::patch('/{leave}/approve', [App\Http\Controllers\HRMS\LeaveController::class, 'approve'])
                ->name('approve');
            Route::patch('/{leave}/reject', [App\Http\Controllers\HRMS\LeaveController::class, 'reject'])
                ->name('reject');
        });

        // Payroll routes
        Route::get('/payroll', [App\Http\Controllers\HRMS\EmployeePayrollController::class, 'index'])
            ->name('payroll.index');
    });

    // CRM - Client & Project Management
    Route::prefix('crm')->name('crm.')->group(function () {
        // Clients
        Route::get('/clients', [App\Http\Controllers\CRM\ClientController::class, 'index'])->name('clients.index');
        Route::get('/clients/create', [App\Http\Controllers\CRM\ClientController::class, 'create'])->name('clients.create');
        Route::post('/clients', [App\Http\Controllers\CRM\ClientController::class, 'store'])->name('clients.store');
        Route::get('/clients/{client}', [App\Http\Controllers\CRM\ClientController::class, 'show'])->name('clients.show');
        Route::get('/clients/{client}/edit', [App\Http\Controllers\CRM\ClientController::class, 'edit'])->name('clients.edit');
        Route::put('/clients/{client}', [App\Http\Controllers\CRM\ClientController::class, 'update'])->name('clients.update');
        Route::delete('/clients/{client}', [App\Http\Controllers\CRM\ClientController::class, 'destroy'])->name('clients.destroy');

        // Client Projects
        Route::get('/client-projects', [App\Http\Controllers\CRM\ClientProjectController::class, 'index'])->name('client-projects.index');
        Route::get('/client-projects/create', [App\Http\Controllers\CRM\ClientProjectController::class, 'create'])->name('client-projects.create');
        Route::post('/client-projects', [App\Http\Controllers\CRM\ClientProjectController::class, 'store'])->name('client-projects.store');
        Route::get('/client-projects/{clientProject}/edit', [App\Http\Controllers\CRM\ClientProjectController::class, 'edit'])->name('client-projects.edit');
        Route::put('/client-projects/{clientProject}', [App\Http\Controllers\CRM\ClientProjectController::class, 'update'])->name('client-projects.update');
        Route::delete('/client-projects/{clientProject}', [App\Http\Controllers\CRM\ClientProjectController::class, 'destroy'])->name('client-projects.destroy');

        // Employee Projects (Penugasan Karyawan)
        Route::get('/employee-projects', [App\Http\Controllers\CRM\EmployeeProjectController::class, 'index'])->name('employee-projects.index');
        Route::get('/employee-projects/create', [App\Http\Controllers\CRM\EmployeeProjectController::class, 'create'])->name('employee-projects.create');
        Route::post('/employee-projects', [App\Http\Controllers\CRM\EmployeeProjectController::class, 'store'])->name('employee-projects.store');
        Route::get('/employee-projects/{employeeProject}', [App\Http\Controllers\CRM\EmployeeProjectController::class, 'show'])->name('employee-projects.show');
        Route::delete('/employee-projects/{employeeProject}', [App\Http\Controllers\CRM\EmployeeProjectController::class, 'destroy'])->name('employee-projects.destroy');
        Route::delete('/employee-projects', [App\Http\Controllers\CRM\EmployeeProjectController::class, 'bulkDestroy'])->name('employee-projects.bulk-destroy');

        // API for dynamic employee loading
        Route::get('/api/employees', [App\Http\Controllers\CRM\EmployeeProjectController::class, 'getEmployees'])->name('api.employees');
    });

    // Security Ops - Team Operations
    Route::prefix('security-ops')->name('security-ops.')->group(function () {
        Route::get('/patroli', [App\Http\Controllers\SecurityOps\PatroliController::class, 'index'])->name('patroli.index');

        // create/store removed (handled by mobile/API)
        Route::get('/patroli/{patroli}', [App\Http\Controllers\SecurityOps\PatroliController::class, 'show'])->name('patroli.show');
        Route::get('/patroli/{patroli}/download', [App\Http\Controllers\SecurityOps\PatroliController::class, 'downloadZip'])->name('patroli.download');
        Route::delete('/patroli/{patroli}', [App\Http\Controllers\SecurityOps\PatroliController::class, 'destroy'])->name('patroli.destroy');
        Route::post('/patroli/{patroli}/complete', [App\Http\Controllers\SecurityOps\PatroliController::class, 'complete'])->name('patroli.complete');
        Route::delete('/patroli-files/{file}', [App\Http\Controllers\SecurityOps\PatroliController::class, 'destroyFile'])->name('patroli-files.destroy');

        // Projects list + checkpoints management
        Route::get('/projects', [App\Http\Controllers\SecurityOps\PatroliConfigController::class, 'projects'])->name('projects.index');
        Route::get('/projects/{project}/patroli-checkpoints', [App\Http\Controllers\SecurityOps\PatroliCheckpointController::class, 'index'])->name('patroli-checkpoints.index');
        Route::post('/projects/{project}/patroli-checkpoints', [App\Http\Controllers\SecurityOps\PatroliCheckpointController::class, 'store'])->name('patroli-checkpoints.store');
        Route::put('/patroli-checkpoints/{checkpoint}', [App\Http\Controllers\SecurityOps\PatroliCheckpointController::class, 'update'])->name('patroli-checkpoints.update');
        Route::delete('/patroli-checkpoints/{checkpoint}', [App\Http\Controllers\SecurityOps\PatroliCheckpointController::class, 'destroy'])->name('patroli-checkpoints.destroy');

        // Incident page
        Route::get('/incident', [App\Http\Controllers\SecurityOps\IncidentController::class, 'index'])->name('incident.index');
        Route::get('/incidents/export', [App\Http\Controllers\SecurityOps\IncidentController::class, 'export'])->name('incidents.export');

        // Incident CRUD operations
        Route::post('/incidents', [App\Http\Controllers\SecurityOps\IncidentController::class, 'store'])->name('incidents.store');
        Route::get('/incidents/{incident}', [App\Http\Controllers\SecurityOps\IncidentController::class, 'show'])->name('incidents.show');
        Route::post('/incidents/{incident}', [App\Http\Controllers\SecurityOps\IncidentController::class, 'update'])->name('incidents.update');
        Route::delete('/incidents/{incident}', [App\Http\Controllers\SecurityOps\IncidentController::class, 'destroy'])->name('incidents.destroy');

        // Incident management operations
        Route::post('/incidents/{incident}/assign', [App\Http\Controllers\SecurityOps\IncidentController::class, 'assign'])->name('incidents.assign');
        Route::post('/incidents/{incident}/status', [App\Http\Controllers\SecurityOps\IncidentController::class, 'updateStatus'])->name('incidents.status');
        Route::post('/incidents/{incident}/priority', [App\Http\Controllers\SecurityOps\IncidentController::class, 'updatePriority'])->name('incidents.priority');
        Route::post('/incidents/{incident}/follow-up', [App\Http\Controllers\SecurityOps\IncidentController::class, 'addFollowUp'])->name('incidents.follow-up');

        Route::get('/incidents', function () {
            return view('admin.incidents.index');
        })->name('incidents.admin');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');
