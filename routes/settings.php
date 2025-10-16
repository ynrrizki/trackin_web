<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');

    Route::get('settings/user', [\App\Http\Controllers\UserController::class, 'index'])->name('users.index');
    Route::get('settings/role-permission', [\App\Http\Controllers\Auth\AuthorizationController::class, 'index'])->name('role-permission.index');

    // Approver Layer routes
    Route::get('settings/approver-layer', [\App\Http\Controllers\Settings\ApproverLayerController::class, 'index'])->name('approver-layer.index');
    Route::get('settings/approver-layer/{approvableTypeId}', [\App\Http\Controllers\Settings\ApproverLayerController::class, 'show'])->name('approver-layer.show');
    Route::patch('settings/approver-layer/{approvableTypeId}', [\App\Http\Controllers\Settings\ApproverLayerController::class, 'update'])->name('approver-layer.update');

    // HRMS Settings routes
    Route::prefix('settings/hrms')->name('settings.hrms.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Settings\HRMSController::class, 'index'])->name('index');
        Route::get('/departments', [\App\Http\Controllers\Settings\HRMSController::class, 'departments'])->name('departments');
        Route::get('/employee-types', [\App\Http\Controllers\Settings\HRMSController::class, 'employeeTypes'])->name('employee-types');
        Route::get('/employment-statuses', [\App\Http\Controllers\Settings\HRMSController::class, 'employmentStatuses'])->name('employment-statuses');

        // Shifts management
        Route::get('/shifts', [\App\Http\Controllers\Settings\HRMSController::class, 'shifts'])->name('shifts');
        Route::post('/shifts', [\App\Http\Controllers\Settings\HRMSController::class, 'storeShift'])->name('shifts.store');
        Route::put('/shifts/{shift}', [\App\Http\Controllers\Settings\HRMSController::class, 'updateShift'])->name('shifts.update');
        Route::delete('/shifts/{shift}', [\App\Http\Controllers\Settings\HRMSController::class, 'destroyShift'])->name('shifts.destroy');

        // Shift assignments
        Route::get('/assign-shifts', [\App\Http\Controllers\Settings\HRMSController::class, 'assignShift'])->name('assign-shifts');
        Route::post('/assign-shifts', [\App\Http\Controllers\Settings\HRMSController::class, 'bulkAssignShift'])->name('assign-shifts.store');

    // Leave settings
    Route::get('/leave-categories', [\App\Http\Controllers\Settings\LeaveSettingsController::class, 'categories'])->name('leave-categories');
    Route::post('/leave-categories', [\App\Http\Controllers\Settings\LeaveSettingsController::class, 'storeCategory'])->name('leave-categories.store');
    Route::put('/leave-categories/{category}', [\App\Http\Controllers\Settings\LeaveSettingsController::class, 'updateCategory'])->name('leave-categories.update');
    Route::delete('/leave-categories/{category}', [\App\Http\Controllers\Settings\LeaveSettingsController::class, 'destroyCategory'])->name('leave-categories.destroy');

    // Holidays
    Route::get('/holidays', [\App\Http\Controllers\Settings\LeaveSettingsController::class, 'holidays'])->name('holidays');
    Route::post('/holidays', [\App\Http\Controllers\Settings\LeaveSettingsController::class, 'storeHoliday'])->name('holidays.store');
    Route::put('/holidays/{holiday}', [\App\Http\Controllers\Settings\LeaveSettingsController::class, 'updateHoliday'])->name('holidays.update');
    Route::delete('/holidays/{holiday}', [\App\Http\Controllers\Settings\LeaveSettingsController::class, 'destroyHoliday'])->name('holidays.destroy');
    });

    // CRM Settings routes
    Route::prefix('settings/crm')->name('settings.crm.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Settings\CRMController::class, 'index'])->name('index');
        Route::get('/outsourcing-fields', [\App\Http\Controllers\Settings\CRMController::class, 'outsourcingFields'])->name('outsourcing-fields');
        Route::post('/outsourcing-fields', [\App\Http\Controllers\Settings\CRMController::class, 'storeOutsourcingField'])->name('outsourcing-fields.store');
        Route::put('/outsourcing-fields/{outsourcingField}', [\App\Http\Controllers\Settings\CRMController::class, 'updateOutsourcingField'])->name('outsourcing-fields.update');
        Route::delete('/outsourcing-fields/{outsourcingField}', [\App\Http\Controllers\Settings\CRMController::class, 'destroyOutsourcingField'])->name('outsourcing-fields.destroy');
    });

    Route::prefix('settings/security-ops')->name('settings.security-ops.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Settings\SecurityOpsController::class, 'index'])->name('index');
        Route::get('/incident-categories', [\App\Http\Controllers\Settings\SecurityOpsController::class, 'incidentCategories'])->name('incident-categories');
        Route::post('/incident-categories', [\App\Http\Controllers\Settings\SecurityOpsController::class, 'storeIncidentCategory'])->name('incident-categories.store');
        Route::put('/incident-categories/{category}', [\App\Http\Controllers\Settings\SecurityOpsController::class, 'updateIncidentCategory'])->name('incident-categories.update');
        Route::delete('/incident-categories/{category}', [\App\Http\Controllers\Settings\SecurityOpsController::class, 'destroyIncidentCategory'])->name('incident-categories.destroy');
    });
});
