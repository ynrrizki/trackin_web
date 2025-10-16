<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Exports\EmployeesExport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Role;

class EmployeeController extends Controller
{
    public function destroy(Employee $employee)
    {
        try {
            // Check if employee can be deleted (e.g., not involved in active projects)
            $canDelete = $this->canDeleteEmployee($employee);

            if (!$canDelete['can_delete']) {
                return back()->with('error', $canDelete['message']);
            }

            // Soft delete the employee
            $employee->delete();

            // Optionally deactivate associated user account
            if ($employee->user) {
                $employee->user->update([
                    'email_verified_at' => null, // Deactivate account
                ]);
            }

            return back()->with('success', 'Karyawan berhasil dihapus.');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menghapus karyawan: ' . $e->getMessage());
        }
    }

    /**
     * Change employee status to resigned
     */
    public function resign(Request $request, Employee $employee)
    {
        $request->validate([
            'resignation_reason' => 'nullable|string|max:1000',
            'resignation_date' => 'required|date',
        ]);

        try {
            $employee->update([
                'status' => Employee::STATUS_RESIGNED,
                'resignation_reason' => $request->resignation_reason,
                'resignation_date' => $request->resignation_date,
                'end_date' => $request->resignation_date,
            ]);

            // Optionally deactivate user account
            if ($employee->user) {
                $employee->user->update([
                    'email_verified_at' => null, // Deactivate account
                ]);
            }

            return back()->with('success', 'Status karyawan berhasil diubah menjadi resign.');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal mengubah status karyawan: ' . $e->getMessage());
        }
    }

    /**
     * Check if employee can be deleted
     */
    private function canDeleteEmployee(Employee $employee)
    {
        // Check if employee has active projects
        $activeProjects = $employee->projects()->where('status', 'active')->count();
        if ($activeProjects > 0) {
            return [
                'can_delete' => false,
                'message' => 'Karyawan tidak dapat dihapus karena masih terlibat dalam proyek aktif.'
            ];
        }

        // Check if employee has recent attendance records
        $recentAttendance = $employee->attendances()
            ->where('created_at', '>=', now()->subMonths(3))
            ->count();

        if ($recentAttendance > 0) {
            return [
                'can_delete' => false,
                'message' => 'Karyawan tidak dapat dihapus karena memiliki record absensi dalam 3 bulan terakhir. Gunakan fitur resign sebagai gantinya.'
            ];
        }

        return [
            'can_delete' => true,
            'message' => 'Karyawan dapat dihapus.'
        ];
    }
}
