<?php

namespace App\Exports;

use App\Models\Attendance;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Carbon\Carbon;

class AttendanceExport implements
    FromQuery,
    WithHeadings,
    WithMapping,
    WithStyles,
    ShouldAutoSize,
    WithEvents
{
    protected $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $query = Attendance::with([
            'employee' => function ($q) {
                $q->select('id', 'employee_code', 'full_name', 'email', 'department_id', 'position_id', 'level_id', 'shift_id', 'outsourcing_field_id')
                    ->with([
                        'department:id,name',
                        'position:id,name',
                        'positionLevel:id,name',
                        'shift:id,name',
                        'outsourceField:id,name'
                    ]);
            }
        ]);

        // Apply basic date filter - simple version for testing
        if (!empty($this->filters['date_from']) && !empty($this->filters['date_to'])) {
            $query->whereBetween('date', [$this->filters['date_from'], $this->filters['date_to']]);
        } else {
            // Default to current month if no date filter
            $query->whereMonth('date', now()->month)
                ->whereYear('date', now()->year);
        }

        // Apply other filters one by one (easier to debug)
        if (!empty($this->filters['employee_id'])) {
            $query->where('employee_id', $this->filters['employee_id']);
        }

        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('full_name', 'like', '%' . $search . '%')
                    ->orWhere('employee_code', 'like', '%' . $search . '%');
            });
        }

        return $query->orderBy('date', 'desc')->limit(100); // Limit for testing
    }

    public function headings(): array
    {
        return [
            'Tanggal',
            'Kode Karyawan',
            'Nama Karyawan',
            'Email',
            'Department',
            'Posisi',
            'Level Posisi',
            'Shift',
            'Tipe Karyawan',
            'Bidang Outsourcing',
            'Jam Masuk',
            'Jam Keluar',
            'Durasi Kerja',
            'Status',
            'Lokasi Check-in',
            'Lokasi Check-out',
            'Deteksi GPS Palsu',
        ];
    }

    public function map($attendance): array
    {
        $employee = $attendance->employee ?? null;

        if (!$employee) {
            return [
                $attendance->date ?? '-',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
                $attendance->time_in ?? '-',
                $attendance->time_out ?? '-',
                '-',
                '-',
                '-',
                '-',
                '-'
            ];
        }

        // Calculate work duration
        $duration = '-';
        if ($attendance->time_in && $attendance->time_out) {
            try {
                $timeIn = Carbon::parse($attendance->time_in);
                $timeOut = Carbon::parse($attendance->time_out);
                $diff = $timeIn->diff($timeOut);
                $duration = $diff->format('%H:%I');
            } catch (\Exception $e) {
                $duration = 'Error';
            }
        }

        // Determine status
        $status = 'No Check-in';
        if ($attendance->time_in) {
            if ($attendance->time_out) {
                $status = 'Complete';
            } else {
                $status = 'Incomplete';
            }
        }

        return [
            $attendance->date ?? '-',
            $employee->employee_code ?? '-',
            $employee->full_name ?? '-',
            $employee->email ?? '-',
            $employee->department?->name ?? '-',
            $employee->position?->name ?? '-',
            $employee->positionLevel?->name ?? '-',
            $employee->shift?->name ?? '-',
            $employee->outsourcing_field_id ? 'Outsourcing' : 'Internal',
            $employee->outsourceField?->name ?? '-',
            $attendance->time_in ?? '-',
            $attendance->time_out ?? '-',
            $duration,
            $status,
            $attendance->latlot_in ? 'GPS Location' : '-',
            $attendance->latlot_out ? 'GPS Location' : '-',
            $attendance->is_fake_map_detected ? 'Ya' : 'Tidak',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style the header row
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4A90E2'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
            ],
            // Center align specific columns
            'A:A' => ['alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]], // Date
            'B:B' => ['alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]], // Employee Code
            'K:M' => ['alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]], // Time columns
            'N:Q' => ['alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]], // Status columns
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Apply auto-filter to header row
                $highestColumn = $sheet->getHighestColumn();
                $sheet->setAutoFilter("A1:{$highestColumn}1");
                // Freeze header row
                $sheet->freezePane('A2');
                // Set default font
                $sheet->getParent()->getDefaultStyle()->getFont()->setName('Arial')->setSize(10);
                // Set row height for header
                $sheet->getRowDimension(1)->setRowHeight(20);
            },
        ];
    }

}
