<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TrackingController;


Route::prefix('v1')->group(function () {
    Route::middleware(['auth:sanctum'])->group(function () {
        // Realtime tracking routes
        Route::prefix('tracking')->group(function () {
            Route::post('/location', [TrackingController::class, 'updateLocation']);
            Route::post('/online', [TrackingController::class, 'online']);
            Route::post('/offline', [TrackingController::class, 'offline']);
        });

        Route::group(['prefix' => 'hrms'], function () {
            Route::get('/attendances', [App\Http\Controllers\Api\V1\HRMS\AttendanceController::class, 'index']);
            Route::post('/attendances/checkIn', [App\Http\Controllers\Api\V1\HRMS\AttendanceController::class, 'checkIn']);
            Route::post('/attendances/checkOut', [App\Http\Controllers\Api\V1\HRMS\AttendanceController::class, 'checkOut']);
            Route::get('/attendances/monthly-summary', [App\Http\Controllers\Api\V1\HRMS\AttendanceController::class, 'monthlySummary']);
            Route::get('/attendances/monitoring', [App\Http\Controllers\Api\V1\HRMS\AttendanceController::class, 'monitoring']);
            Route::get('/attendances/{id}', [App\Http\Controllers\Api\V1\HRMS\AttendanceController::class, 'show']);

            // Shift information endpoint
            Route::get('/employee/shift-info', [App\Http\Controllers\Api\V1\HRMS\AttendanceController::class, 'getShiftInfo']);

            Route::get('/employees/requester', [App\Http\Controllers\Api\V1\HRMS\EmployeeController::class, 'getEmployeeRequester']);
            Route::get('/employees/directory', [App\Http\Controllers\Api\V1\HRMS\EmployeeController::class, 'directory']);
            Route::patch('/employees', [App\Http\Controllers\Api\V1\HRMS\EmployeeController::class, 'update']);

            Route::get('employees/picker', [\App\Http\Controllers\API\HRMS\EmployeePickerController::class, 'index'])->name('employees.picker');
            Route::get('employees/picker/filters', [\App\Http\Controllers\API\HRMS\EmployeePickerController::class, 'filters'])->name('employees.picker.filters');

            // Shift assignment endpoints
            Route::patch('/employees/shift-assignment', [App\Http\Controllers\Api\V1\HRMS\EmployeeController::class, 'updateShiftAssignment'])
                ->name('hrms.employees.shift-assignment');
            Route::patch('/employees/bulk-shift-assignment', [App\Http\Controllers\Api\V1\HRMS\EmployeeController::class, 'bulkUpdateShiftAssignment'])
                ->name('hrms.employees.bulk-shift-assignment');

            // Mobile Leave endpoints
            Route::get('/leaves', [App\Http\Controllers\Api\V1\HRMS\LeaveController::class, 'index']);
            Route::post('/leaves', [App\Http\Controllers\Api\V1\HRMS\LeaveController::class, 'store']);
            Route::get('/leaves/{id}', [App\Http\Controllers\Api\V1\HRMS\LeaveController::class, 'show']);
            Route::post('/leaves/{id}/approve', [App\Http\Controllers\Api\V1\HRMS\LeaveController::class, 'approve']);
            Route::post('/leaves/{id}/reject', [App\Http\Controllers\Api\V1\HRMS\LeaveController::class, 'reject']);
            Route::get('/leave-entitlements', [App\Http\Controllers\Api\V1\HRMS\LeaveEntitlementController::class, 'index']);
            Route::get('/leave-categories', [App\Http\Controllers\Api\V1\HRMS\LeaveMetaController::class, 'categories']);
            // Leave balances (entitlements)
            Route::get('/leave-entitlements', [App\Http\Controllers\Api\V1\HRMS\LeaveEntitlementController::class, 'index']);

            // Leave entitlements/balances
            Route::get('/leave-entitlements', [App\Http\Controllers\Api\V1\HRMS\LeaveEntitlementController::class, 'index']);

            // Mobile Overtime endpoints
            Route::get('/overtimes', [App\Http\Controllers\Api\V1\HRMS\OvertimeController::class, 'index']);
            Route::post('/overtimes', [App\Http\Controllers\Api\V1\HRMS\OvertimeController::class, 'store']);
            Route::get('/overtimes/{id}', [App\Http\Controllers\Api\V1\HRMS\OvertimeController::class, 'show']);
            Route::post('/overtimes/{id}/approve', [App\Http\Controllers\Api\V1\HRMS\OvertimeController::class, 'approve']);
            Route::post('/overtimes/{id}/reject', [App\Http\Controllers\Api\V1\HRMS\OvertimeController::class, 'reject']);
        });

        // Master Data Routes (untuk web & mobile)
        Route::group(['prefix' => 'master-data'], function () {
            Route::get('/employee-form', [App\Http\Controllers\API\HRMS\EmployeeMasterDataController::class, 'getEmployeeMasterData']);
            Route::get('/positions', [App\Http\Controllers\API\HRMS\EmployeeMasterDataController::class, 'getPositions']);
            Route::get('/position-levels', [App\Http\Controllers\API\HRMS\EmployeeMasterDataController::class, 'getPositionLevels']);
            Route::get('/departments', [App\Http\Controllers\API\HRMS\EmployeeMasterDataController::class, 'getDepartments']);
            Route::get('/outsourcing-fields', [App\Http\Controllers\API\HRMS\EmployeeMasterDataController::class, 'getOutsourcingFields']);
            Route::get('/projects', [App\Http\Controllers\API\HRMS\EmployeeMasterDataController::class, 'getProjects']);
        });

        Route::get('/notifications', [App\Http\Controllers\Api\V1\NotificationController::class, 'index'])
            ->name('notifications.index');
        Route::get('/notifications/{id}', [App\Http\Controllers\Api\V1\NotificationController::class, 'show'])
            ->name('notifications.show');
        Route::get('/notifications/{id}/mark-as-read', [App\Http\Controllers\Api\V1\NotificationController::class, 'markAsRead'])
            ->name('notifications.markAsRead');
        Route::patch('/notifications/{id}/unread', [App\Http\Controllers\Api\V1\NotificationController::class, 'markAsUnread'])
            ->name('notifications.markAsUnread');
        Route::patch('/notifications/read-bulk', [App\Http\Controllers\Api\V1\NotificationController::class, 'markBulkRead'])
            ->name('notifications.readBulk');
        Route::get('/notifications/unread-count', [App\Http\Controllers\Api\V1\NotificationController::class, 'unreadCount'])
            ->name('notifications.unreadCount');

        // Security Ops - Patroli mobile endpoints
        Route::group(['prefix' => 'security-ops'], function () {
            Route::get('/patrols', [App\Http\Controllers\Api\V1\SecurityOps\PatroliController::class, 'index']);
            Route::get('/patrols/monitoring', [App\Http\Controllers\Api\V1\SecurityOps\PatroliController::class, 'monitoring']);
            Route::get('/patrols/checkpoints', [App\Http\Controllers\Api\V1\SecurityOps\PatroliController::class, 'checkpoints']);
            Route::get('/patrols/{patroli}', [App\Http\Controllers\Api\V1\SecurityOps\PatroliController::class, 'show']);
            Route::post('/patrols/start', [App\Http\Controllers\Api\V1\SecurityOps\PatroliController::class, 'start']);
            Route::post('/patrols/{patroli}/visit', [App\Http\Controllers\Api\V1\SecurityOps\PatroliController::class, 'visit']);
            Route::post('/patrols/{patroli}/complete', [App\Http\Controllers\Api\V1\SecurityOps\PatroliController::class, 'complete']);
            Route::post('/patrols/{patroli}/files', [App\Http\Controllers\Api\V1\SecurityOps\PatroliController::class, 'uploadFile']);

            // Incident endpoints (mobile integration)
            Route::get('/incidents', [App\Http\Controllers\Api\V1\SecurityOps\IncidentController::class, 'index']);
            Route::get('/incidents/categories', [App\Http\Controllers\Api\V1\SecurityOps\IncidentController::class, 'categories']);
            Route::get('/incidents/statistics', [App\Http\Controllers\Api\V1\SecurityOps\IncidentController::class, 'statistics']);
            Route::post('/incidents', [App\Http\Controllers\Api\V1\SecurityOps\IncidentController::class, 'store']);
            Route::get('/incidents/{incident}', [App\Http\Controllers\Api\V1\SecurityOps\IncidentController::class, 'show']);
            Route::post('/incidents/{incident}', [App\Http\Controllers\Api\V1\SecurityOps\IncidentController::class, 'update']);
            Route::delete('/incidents/{incident}', [App\Http\Controllers\Api\V1\SecurityOps\IncidentController::class, 'destroy']);

            // Admin incident management endpoints
            Route::post('/incidents/{incident}/assign', [App\Http\Controllers\Api\V1\SecurityOps\IncidentController::class, 'assign']);
            Route::post('/incidents/{incident}/status', [App\Http\Controllers\Api\V1\SecurityOps\IncidentController::class, 'updateStatus']);
            Route::post('/incidents/{incident}/priority', [App\Http\Controllers\Api\V1\SecurityOps\IncidentController::class, 'updatePriority']);
            Route::post('/incidents/{incident}/follow-up', [App\Http\Controllers\Api\V1\SecurityOps\IncidentController::class, 'addFollowUpAction']);
        });

        // Profile endpoint
        Route::get('/profile', [App\Http\Controllers\Api\V1\Profile\ProfileController::class, 'show']);
    });
});
