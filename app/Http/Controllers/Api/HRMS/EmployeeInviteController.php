<?php

namespace App\Http\Controllers\Api\HRMS;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Illuminate\Validation\ValidationException;

class EmployeeInviteController extends Controller
{
    public function inviteUser(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required_if:generate_password,false|string|min:8',
            'generate_password' => 'boolean',
            'role_ids' => 'array',
            'role_ids.*' => 'exists:roles,id',
            'send_invitation' => 'boolean',
            'custom_message' => 'nullable|string|max:1000',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);

        // Check if user already exists for this employee
        if ($employee->user_id) {
            return response()->json([
                'error' => 'Employee already has a user account'
            ], 422);
        }

        // Generate password if needed
        $password = $validated['generate_password'] ?? true
            ? Str::random(12)
            : $validated['password'];

        // Create user
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($password),
            'email_verified_at' => now(),
        ]);

        // Update employee with user_id
        $employee->update(['user_id' => $user->id]);

        // Assign roles if provided
        if (!empty($validated['role_ids'])) {
            $roles = Role::whereIn('id', $validated['role_ids'])->get();
            $user->assignRole($roles);
        }

        // Send invitation email if requested
        if ($validated['send_invitation'] ?? true) {
            $this->sendInvitationEmail($user, $password, $validated['custom_message'] ?? '');
        }

        return response()->json([
            'message' => 'User invitation sent successfully',
            'user' => $user->load(['roles', 'permissions']),
            'password' => $password, // Include for admin reference
        ], 201);
    }

    public function bulkInviteUsers(Request $request)
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:employees,id',
            'role_ids' => 'array',
            'role_ids.*' => 'exists:roles,id',
            'generate_passwords' => 'boolean',
            'send_invitations' => 'boolean',
            'custom_message' => 'nullable|string|max:1000',
        ]);

        $employees = Employee::whereIn('id', $validated['employee_ids'])
            ->whereNull('user_id') // Only employees without existing users
            ->get();

        if ($employees->isEmpty()) {
            return response()->json([
                'error' => 'No eligible employees found (may already have user accounts)'
            ], 422);
        }

        $createdUsers = [];
        $errors = [];

        foreach ($employees as $employee) {
            try {
                // Check if email is unique
                if (User::where('email', $employee->email)->exists()) {
                    $errors[] = "Email {$employee->email} already exists for {$employee->full_name}";
                    continue;
                }

                // Generate password
                $password = $validated['generate_passwords'] ?? true
                    ? Str::random(12)
                    : 'defaultPassword123';

                // Create user
                $user = User::create([
                    'name' => $employee->full_name,
                    'email' => $employee->email,
                    'password' => Hash::make($password),
                    'email_verified_at' => now(),
                ]);

                // Update employee with user_id
                $employee->update(['user_id' => $user->id]);

                // Assign roles if provided
                if (!empty($validated['role_ids'])) {
                    $roles = Role::whereIn('id', $validated['role_ids'])->get();
                    $user->assignRole($roles);
                }

                // Send invitation email if requested
                if ($validated['send_invitations'] ?? true) {
                    $this->sendInvitationEmail($user, $password, $validated['custom_message'] ?? '');
                }

                $createdUsers[] = [
                    'user' => $user->load(['roles', 'permissions']),
                    'password' => $password,
                    'employee' => $employee,
                ];

            } catch (\Exception $e) {
                $errors[] = "Failed to create user for {$employee->full_name}: " . $e->getMessage();
            }
        }

        return response()->json([
            'message' => 'Bulk invitation completed',
            'created_users' => count($createdUsers),
            'total_employees' => count($employees),
            'users' => $createdUsers,
            'errors' => $errors,
        ], 201);
    }

    private function sendInvitationEmail(User $user, string $password, string $customMessage = '')
    {
        // For now, we'll use a simple mail approach
        // In production, you might want to use Laravel's Mailable classes

        $subject = 'Welcome to WMI HRIS - Your Account Details';
        $message = "
            Dear {$user->name},

            Welcome to WMI HRIS! Your user account has been created.

            Login Details:
            Email: {$user->email}
            Password: {$password}

            Please login at: " . url('/login') . "

            For security reasons, please change your password after your first login.

            " . ($customMessage ? "\nAdditional Message:\n{$customMessage}\n" : "") . "

            Best regards,
            WMI HRIS Team
        ";

        try {
            Mail::raw($message, function ($mail) use ($user, $subject) {
                $mail->to($user->email)
                     ->subject($subject);
            });
        } catch (\Exception $e) {
            // Log the error but don't fail the user creation
            \Log::error('Failed to send invitation email: ' . $e->getMessage());
        }
    }

    public function getEmployeesWithoutUsers()
    {
        $employees = Employee::whereNull('user_id')
            ->with(['department', 'position'])
            ->search(request('search', ''))
            ->get();

        return response()->json([
            'employees' => $employees,
            'count' => $employees->count(),
        ]);
    }

    public function getEmployeesWithUsers()
    {
        $employees = Employee::whereNotNull('user_id')
            ->with(['department', 'position', 'user.roles'])
            ->search(request('search', ''))
            ->get();

        return response()->json([
            'employees' => $employees,
            'count' => $employees->count(),
        ]);
    }
}
