<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Response;
use App\Exports\EmployeeTrackingExport;

class EmployeeTrackingController extends Controller
{
    public function index(Request $request)
    {
        // Filter tanggal untuk map (default: hari ini)
        $date_from = $request->input('date_from', now()->toDateString());
        $date_to = $request->input('date_to', $date_from);

        // Ambil semua karyawan (untuk list)
        $employees = \App\Models\Employee::with(['position', 'department', 'outsourcingField'])
            ->orderBy('full_name')
            ->get()
            ->map(function($e) {
                return [
                    'id' => $e->id,
                    'full_name' => $e->full_name,
                    'employee_code' => $e->employee_code,
                    'position' => $e->position?->name,
                    'department' => $e->department?->name,
                    'type' => $e->outsourcing_field_id ? 'Outsourcing' : 'Internal',
                    'photo_url' => $e->photo_url,
                ];
            });

        // Ambil absensi sesuai range tanggal (untuk map)
        $attendances = \App\Models\Attendance::with(['employee'])
            ->whereBetween('date', [$date_from, $date_to])
            ->where(function($q) {
                $q->whereNotNull('latlot_in')->orWhereNotNull('latlot_out');
            })
            ->get()
            ->map(function($a) {
                return [
                    'id' => $a->id,
                    'employee_id' => $a->employee_id,
                    'employee_name' => $a->employee?->full_name,
                    'position' => $a->employee?->position?->name,
                    'type' => $a->employee?->outsourcing_field_id ? 'Outsourcing' : 'Internal',
                    'lat_in' => $a->latlot_in ? explode(',', $a->latlot_in)[0] : null,
                    'long_in' => $a->latlot_in ? explode(',', $a->latlot_in)[1] : null,
                    'lat_out' => $a->latlot_out ? explode(',', $a->latlot_out)[0] : null,
                    'long_out' => $a->latlot_out ? explode(',', $a->latlot_out)[1] : null,
                    'date' => $a->date,
                ];
            });

        return Inertia::render('employee-tracking', [
            'employees' => $employees,
            'attendances' => $attendances,
            'date_from' => $date_from,
            'date_to' => $date_to,
        ]);
    }

    public function export(Request $request)
    {
        $date_from = $request->input('date_from', now()->toDateString());
        $date_to = $request->input('date_to', $date_from);
        $department = $request->input('department');
        $type = $request->input('type');
        $position = $request->input('position');

        $employees = \App\Models\Employee::with(['position', 'department', 'outsourcingField'])
            ->when($department, fn($q) => $q->whereHas('department', fn($q2) => $q2->where('name', $department)))
            ->when($type, fn($q) => $type === 'Outsourcing' ? $q->whereNotNull('outsourcing_field_id') : $q->whereNull('outsourcing_field_id'))
            ->when($position, fn($q) => $q->whereHas('position', fn($q2) => $q2->where('name', $position)))
            ->orderBy('full_name')
            ->get();

        $attendances = Attendance::with(['employee'])
            ->whereBetween('date', [$date_from, $date_to])
            ->where(function ($q) {
                $q->whereNotNull('latlot_in')->orWhereNotNull('latlot_out');
            })
            ->get();

        $export = new EmployeeTrackingExport($employees, $attendances);
        $filename = 'employee-tracking-' . now()->format('Ymd_His') . '.xlsx';
        return Excel::download($export, $filename);
    }
}
