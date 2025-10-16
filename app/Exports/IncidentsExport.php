<?php

namespace App\Exports;

use App\Models\Incident;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class IncidentsExport implements FromView, WithEvents, WithDrawings
{
    protected $filters;
    protected $incidents;
    protected $user;
    protected $employee;

    public function __construct($filters = [], $user = null, $employee = null)
    {
        $this->filters = $filters;
        $this->user = $user;
        $this->employee = $employee;
        $this->incidents = $this->getFilteredIncidents();
    }

    public function view(): View
    {
        return view('exports.incidents', [
            'incidents' => $this->incidents,
            'filters' => $this->filters,
            'exportDate' => now()->format('d/m/Y H:i'),
        ]);
    }

    public function drawings()
    {
        $drawing = new Drawing();
        $drawing->setName('WMI Logo');
        $drawing->setDescription('WMI Logo');

        // Use existing logo
        $logoPath = public_path('images/Logo_WMI-removebg.png');
        if (file_exists($logoPath)) {
            $drawing->setPath($logoPath);
            $drawing->setHeight(60);
            $drawing->setCoordinates('A1');
            $drawing->setOffsetX(10);
            $drawing->setOffsetY(5);
        }

        return $drawing;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Set row height for logo
                $sheet->getRowDimension('1')->setRowHeight(50);
                $sheet->getRowDimension('2')->setRowHeight(20);
                $sheet->getRowDimension('3')->setRowHeight(20);

                // Merge cells for title
                $sheet->mergeCells('B1:H1');
                $sheet->setCellValue('B1', '');

                // Merge cells for company info
                $sheet->mergeCells('B2:H2');
                $sheet->setCellValue('B2', 'PT. Wise Manajemen Indonesia');

                // Export info
                $sheet->mergeCells('B3:H3');
                $sheet->setCellValue('B3', 'Diekspor pada: ' . now()->format('d/m/Y H:i:s'));

                // Style title
                $sheet->getStyle('B1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 16,
                        'color' => ['rgb' => '1f2937']
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_LEFT,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ]
                ]);

                // Style company info
                $sheet->getStyle('B2')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 12,
                        'color' => ['rgb' => '059669']
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_LEFT,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ]
                ]);

                // Style export info
                $sheet->getStyle('B3')->applyFromArray([
                    'font' => [
                        'size' => 10,
                        'color' => ['rgb' => '6b7280']
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_LEFT,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ]
                ]);

                // Find the header row (should be row 5)
                $headerRow = 5;
                $lastRow = $sheet->getHighestRow();
                $lastColumn = 'J'; // Adjust based on number of columns

                // Style header row
                $sheet->getStyle("A{$headerRow}:{$lastColumn}{$headerRow}")->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => 'ffffff']
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '059669']
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000']
                        ]
                    ]
                ]);

                // Style data rows
                if ($lastRow > $headerRow) {
                    $sheet->getStyle("A" . ($headerRow + 1) . ":{$lastColumn}{$lastRow}")->applyFromArray([
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => ['rgb' => 'd1d5db']
                            ]
                        ],
                        'alignment' => [
                            'vertical' => Alignment::VERTICAL_CENTER,
                        ]
                    ]);

                    // Alternate row colors
                    for ($row = $headerRow + 1; $row <= $lastRow; $row++) {
                        if (($row - $headerRow) % 2 == 0) {
                            $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->applyFromArray([
                                'fill' => [
                                    'fillType' => Fill::FILL_SOLID,
                                    'startColor' => ['rgb' => 'f9fafb']
                                ]
                            ]);
                        }
                    }
                }

                // Auto-size columns
                foreach (range('A', $lastColumn) as $column) {
                    $sheet->getColumnDimension($column)->setAutoSize(true);
                }

                // Set minimum width for certain columns
                $sheet->getColumnDimension('A')->setWidth(5);  // No
                $sheet->getColumnDimension('C')->setWidth(20); // Lokasi
                $sheet->getColumnDimension('F')->setWidth(30); // Deskripsi
                $sheet->getColumnDimension('G')->setWidth(25); // Tindakan
            },
        ];
    }

    protected function getFilteredIncidents()
    {
        $query = Incident::with(['category', 'reporter', 'assignedTo'])
            ->orderByDesc('incident_at');

        // Apply permission filters if user and employee are provided
        if ($this->user && $this->employee) {
            $canViewAll = $this->user->can('incident.view_all') || $this->user->hasRole('admin');

            if (!$canViewAll) {
                $allowedEmployeeIds = [$this->employee->id];
                $processedCodes = [];
                $queue = [$this->employee->employee_code];
                while (!empty($queue)) {
                    $code = array_shift($queue);
                    if (!$code || in_array($code, $processedCodes, true)) continue;
                    $processedCodes[] = $code;
                    $subs = \App\Models\Employee::where('approval_line', $code)->pluck('id','employee_code');
                    if ($subs->isNotEmpty()) {
                        foreach ($subs as $empCode => $empId) {
                            if (!in_array($empId, $allowedEmployeeIds, true)) {
                                $allowedEmployeeIds[] = $empId;
                                $queue[] = $empCode;
                            }
                        }
                    }
                }
                // User can see incidents they reported or assigned to them
                $query->where(function($q) use ($allowedEmployeeIds) {
                    $q->whereIn('reporter_employee_id', $allowedEmployeeIds)
                      ->orWhere('assigned_to_employee_id', $this->employee->id);
                });
            }
        }

        // Apply filters
        if (!empty($this->filters['status']) && $this->filters['status'] !== 'all') {
            $query->where('status', $this->filters['status']);
        }

        if (!empty($this->filters['priority']) && $this->filters['priority'] !== 'all') {
            $query->where('priority', $this->filters['priority']);
        }

        if (!empty($this->filters['severity']) && $this->filters['severity'] !== 'all') {
            $query->where('severity', $this->filters['severity']);
        }

        if (!empty($this->filters['category_id']) && $this->filters['category_id'] !== 'all') {
            $query->where('category_id', $this->filters['category_id']);
        }

        if (!empty($this->filters['from'])) {
            $query->where('incident_at', '>=', $this->filters['from']);
        }

        if (!empty($this->filters['to'])) {
            $query->where('incident_at', '<=', $this->filters['to']);
        }

        if (!empty($this->filters['q'])) {
            $q = $this->filters['q'];
            $query->where(function ($w) use ($q) {
                $w->where('location', 'like', "%$q%")
                    ->orWhere('description', 'like', "%$q%")
                    ->orWhere('related_name', 'like', "%$q%")
                    ->orWhere('related_status', 'like', "%$q%");
            });
        }

        return $query->get();
    }
}
