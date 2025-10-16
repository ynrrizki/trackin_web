<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions for HRMS modules
    $permissions = [
            // Employee Management
            'employee.view',
            'employee.create',
            'employee.edit',
            'employee.delete',
            'employee.export',
            'employee.subordinate.view',

            // User Management & Employee Invitation
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'users.invite',
            'users.bulk-invite',

            // Attendance Management
            'attendance.view',
            'attendance.create',
            'attendance.edit',
            'attendance.delete',
            'attendance.approve',
            'attendance.subordinate.view',

            // Leave Management
            'leave.view',
            'leave.create',
            'leave.edit',
            'leave.delete',
            'leave.approve',
            'leave.reject',

            // Payroll Management
            'payroll.view',
            'payroll.create',
            'payroll.edit',
            'payroll.delete',
            'payroll.process',
            'payroll.approve',

            // Overtime Management
            'overtime.view',
            'overtime.create',
            'overtime.edit',
            'overtime.delete',
            'overtime.approve',

            // Department Management
            'department.view',
            'department.create',
            'department.edit',
            'department.delete',

            // Position Management
            'position.view',
            'position.create',
            'position.edit',
            'position.delete',

            // Shift Management
            'shift.view',
            'shift.create',
            'shift.edit',
            'shift.delete',
            'shift.assign',

            // Reports
            'reports.attendance',
            'reports.payroll',
            'reports.employee',
            'reports.leave',

            // Settings
            'settings.view',
            'settings.edit',
            'settings.system',

            // Role & Permission Management
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'permissions.assign',
            'permissions.remove',

            // Dashboard
            'dashboard.hrm',
            'dashboard.admin',

            // Patrol Management
            'patrol.view',
            'patrol.create',
            'patrol.subordinate.view',
            'patrol.view_all',

            // Incident Management
            'incident.view',
            'incident.create',
            'incident.subordinate.view',
            'incident.view_all',
        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles and assign permissions

        // Super Admin - All permissions
        $superAdmin = Role::create(['name' => 'Super Admin']);
        $superAdmin->givePermissionTo(Permission::all());

        // HR Manager - Full HR access except system settings
        $hrManager = Role::create(['name' => 'HR Manager']);
        $hrManager->givePermissionTo([
            // Employee Management
            'employee.view',
            'employee.create',
            'employee.edit',
            'employee.delete',
            'employee.export',

            // User Management & Employee Invitation
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'users.invite',
            'users.bulk-invite',

            // Attendance Management
            'attendance.view',
            'attendance.create',
            'attendance.edit',
            'attendance.delete',
            'attendance.approve',

            // Leave Management
            'leave.view',
            'leave.create',
            'leave.edit',
            'leave.delete',
            'leave.approve',
            'leave.reject',

            // Payroll Management
            'payroll.view',
            'payroll.create',
            'payroll.edit',
            'payroll.delete',
            'payroll.process',
            'payroll.approve',

            // Overtime Management
            'overtime.view',
            'overtime.create',
            'overtime.edit',
            'overtime.delete',
            'overtime.approve',

            // Department Management
            'department.view',
            'department.create',
            'department.edit',
            'department.delete',

            // Position Management
            'position.view',
            'position.create',
            'position.edit',
            'position.delete',

            // Shift Management
            'shift.view',
            'shift.create',
            'shift.edit',
            'shift.delete',
            'shift.assign',

            // Reports
            'reports.attendance',
            'reports.payroll',
            'reports.employee',
            'reports.leave',

            // Dashboard
            'dashboard.hrm',
        ]);

        // HR Staff - Limited HR access
        $hrStaff = Role::create(['name' => 'HR Staff']);
        $hrStaff->givePermissionTo([
            // Employee Management (limited)
            'employee.view',
            'employee.create',
            'employee.edit',

            // Attendance Management
            'attendance.view',
            'attendance.create',
            'attendance.edit',

            // Leave Management
            'leave.view',
            'leave.create',
            'leave.edit',

            // Overtime Management
            'overtime.view',
            'overtime.create',
            'overtime.edit',

            // Department & Position (view only)
            'department.view',
            'position.view',

            // Shift Management (limited)
            'shift.view',
            'shift.assign',

            // Reports (limited)
            'reports.attendance',
            'reports.employee',
            'reports.leave',

            // Dashboard
            'dashboard.hrm',
        ]);

        // Manager - Department level access
        $manager = Role::create(['name' => 'Manager']);
        $manager->givePermissionTo([
            // Employee Management (view only for department)
            'employee.view',

            // Attendance Management
            'attendance.view',
            'attendance.approve',

            // Leave Management
            'leave.view',
            'leave.approve',
            'leave.reject',

            // Overtime Management
            'overtime.view',
            'overtime.approve',

            // Reports
            'reports.attendance',
            'reports.employee',
            'reports.leave',

            // Dashboard
            'dashboard.hrm',
        ]);

        // Employee - Self service access
        $employee = Role::create(['name' => 'Employee']);
        $employee->givePermissionTo([
            // Attendance (own records)
            'attendance.view',

            // Leave (own requests)
            'leave.view',
            'leave.create',

            // Overtime (own requests)
            'overtime.view',
            'overtime.create',

            // Dashboard
            'dashboard.hrm',
        ]);

        // Payroll Staff - Payroll specific access
        $payrollStaff = Role::create(['name' => 'Payroll Staff']);
        $payrollStaff->givePermissionTo([
            // Employee (view for payroll)
            'employee.view',

            // Attendance (view for payroll calculation)
            'attendance.view',

            // Payroll Management
            'payroll.view',
            'payroll.create',
            'payroll.edit',
            'payroll.process',

            // Reports
            'reports.payroll',
            'reports.attendance',

            // Dashboard
            'dashboard.hrm',
        ]);

        // Security Staff
        $securityStaff = Role::create(['name' => 'Security Staff']);
        $securityStaff->givePermissionTo([
            'attendance.view',
            // Patrol basic
            'patrol.view',
            'patrol.create',
            // Incident basic
            'incident.view',
            'incident.create',
        ]);

        // Security Supervisor
        $securitySupervisor = Role::create(['name' => 'Security Supervisor']);
        $securitySupervisor->givePermissionTo([
            'attendance.view',
            'attendance.subordinate.view',
            'patrol.view',
            'patrol.create',
            'patrol.subordinate.view',
            'incident.view',
            'incident.create',
            'incident.subordinate.view',
        ]);

        // Operational Manager (divisi terkait outsourcing) - monitoring tanpa create
        $operationalManager = Role::create(['name' => 'Operational Manager']);
        $operationalManager->givePermissionTo([
            'patrol.view',
            'patrol.subordinate.view',
            'incident.view',
            'incident.subordinate.view',
        ]);

        $this->command->info('Roles and permissions created successfully!');
    }
}
