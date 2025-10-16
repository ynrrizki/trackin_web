<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Maatwebsite\Excel\Events\AfterSheet;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class EmployeeTrackingExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithColumnFormatting,
    WithStyles,
    ShouldAutoSize,
    WithEvents,
    WithTitle
{
    protected $employees;
    protected $attendances;

    public function __construct($employees, $attendances)
    {
        $this->employees = $employees;
        $this->attendances = $attendances;
    }

    public function collection()
    {
        // Map employee_id => attendance (prefer checkout > checkin)
        $attendanceMap = [];
        foreach ($this->attendances as $a) {
            $id = $a->employee_id;
            if (!isset($attendanceMap[$id])) {
                $attendanceMap[$id] = $a;
            } elseif (!empty($a->latlot_out) || (!empty($a->lat_out) && !empty($a->long_out))) {
                // Prefer checkout
                $attendanceMap[$id] = $a;
            }
        }

        $rows = [];
        foreach ($this->employees as $emp) {
            $att = $attendanceMap[$emp->id] ?? null;
            // Compose lat/long (support both latlot_in/latlot_out or lat_in/long_in)
            $checkin = '';
            $chekin_time = '';
            $checkout = '';
            $checkout_time = '';
            $date = '';
            if ($att) {
                if (!empty($att->latlot_in)) {
                    $checkin = $att->latlot_in;
                } elseif (!empty($att->lat_in) && !empty($att->long_in)) {
                    $checkin = $att->lat_in . ', ' . $att->long_in;
                }

                // Mengambil data time_in
                $chekin_time = $att->time_in ?? '';

                if (!empty($att->latlot_out)) {
                    $checkout = $att->latlot_out;
                } elseif (!empty($att->lat_out) && !empty($att->long_out)) {
                    $checkout = $att->lat_out . ', ' . $att->long_out;
                }

                // Mengambil data time_out
                $checkout_time = $att->time_out ?? '';

                $date = $att->date;
            }
            $rows[] = [
                $emp->employee_code,
                $emp->full_name,
                $emp->department?->name ?? '',
                $emp->position?->name ?? '',
                $emp->outsourcing_field_id ? 'Outsourcing' : 'Internal',
                $checkin,
                $chekin_time,
                $checkout,
                $checkout_time,
                $date,
            ];
        }
        return new Collection($rows);
    }

    public function headings(): array
    {
        return [
            'NIP',
            'Nama',
            'Departemen',
            'Posisi',
            'Tipe',
            'Checkin (Lat, Long)',
            'Jam Checkin',
            'Checkout (Lat, Long)',
            'Jam Checkout',
            'Tanggal',
        ];
    }

    public function map($row): array
    {
        // Cek apakah data tanggal (yang ada di indeks 9) tidak kosong
        $excelDate = null;
        if (!empty($row[9])) {
            try {
                // Mengubah string tanggal menjadi format Excel
                $excelDate = \PhpOffice\PhpSpreadsheet\Shared\Date::PHPToExcel(Carbon::parse($row[9]));
            } catch (\Exception $e) {
                // Jika gagal, gunakan nilai asli
                $excelDate = $row[9];
            }
        }

        return [
            (string) $row[0], // NIP
            $row[1],          // Nama
            $row[2],          // Departemen
            $row[3],          // Posisi
            $row[4],          // Tipe
            (string) $row[5], // Checkin (Lat, Long)
            (string) $row[6], // Jam Checkin
            $row[7],          // Checkout (Lat, Long)
            $row[8],          // Jam Checkout
            $excelDate,       // Tanggal (menggunakan variabel yang sudah diolah)
        ];
    }

    public function columnFormats(): array
{
    return [
        'A' => NumberFormat::FORMAT_TEXT, // NIP
        'F' => NumberFormat::FORMAT_TEXT, // Checkin (Lat, Long)
        'G' => NumberFormat::FORMAT_TEXT, // Jam Checkin
        'H' => NumberFormat::FORMAT_TEXT, // Checkout (Lat, Long)
        'I' => NumberFormat::FORMAT_TEXT, // Jam Checkout
        'J' => NumberFormat::FORMAT_DATE_YYYYMMDD, // Tanggal
    ];
}

    public function styles(Worksheet $sheet)
    {
        // Header bold, centered, vertical center
        $sheet->getStyle('A1:J1')->applyFromArray([
            'font' => ['bold' => true],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ]);
        // All cells border, vertical center
        $rowCount = $sheet->getHighestRow();
        $sheet->getStyle('A1:J' . $rowCount)->applyFromArray([
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ]);
        // Zebra striping
        for ($r = 2; $r <= $rowCount; $r += 2) {
            $sheet->getStyle('A' . $r . ':J' . $r)->applyFromArray([
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'F3F4F6'],
                ],
            ]);
        }
        // Custom column widths
        $sheet->getColumnDimension('B')->setWidth(28);
        $sheet->getColumnDimension('C')->setWidth(18);
        $sheet->getColumnDimension('D')->setWidth(18);
        $sheet->getColumnDimension('F')->setWidth(22);
        $sheet->getColumnDimension('G')->setWidth(22);
        $sheet->getColumnDimension('H')->setWidth(18);
        $sheet->getColumnDimension('I')->setWidth(18);
        $sheet->getColumnDimension('J')->setWidth(18);
        return [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                // Freeze header at A2
                $event->sheet->getDelegate()->freezePane('A2');
                // Enable autofilter
                $event->sheet->getDelegate()->setAutoFilter('A1:J1');
            },
        ];
    }

    public function title(): string
    {
        return 'Employee Tracking';
    }
}
