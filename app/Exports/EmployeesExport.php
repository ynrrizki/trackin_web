<?php

namespace App\Exports;

use App\Models\Employee;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EmployeesExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles,
    WithColumnWidths,
    WithDrawings,
    ShouldAutoSize,
    WithEvents
{
    protected $filters;
    protected $employees;
    protected $filterNames;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
        $this->employees = $this->getFilteredEmployees();
        $this->resolveFilterNames(); // Siapkan nama filter untuk header
    }

    /**
     * Menyediakan data utama untuk tabel.
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return $this->employees;
    }

    /**
     * Mendefinisikan header untuk tabel utama.
     * @return array
     */
    public function headings(): array
    {
        return [
            'No',
            'Kode Karyawan',
            'Nama Lengkap',
            'Email',
            'Telepon',
            'Gender',
            'Tanggal Lahir',
            'Departemen',
            'Posisi',
            'Status Kerja',
            'Tanggal Bergabung',
            'Status',
        ];
    }

    /**
     * Memetakan setiap baris data dari koleksi ke format array.
     * @param mixed $employee
     * @return array
     */
    public function map($employee): array
    {
        static $index = 0;
        $index++;

        $statusText = $employee->status;
        switch ($employee->status) {
            case 'active':
                $statusText = 'Aktif';
                break;
            case 'inactive':
                $statusText = 'Tidak Aktif';
                break;
            case 'on_leave':
                $statusText = 'Cuti';
                break;
            case 'resigned':
                $statusText = 'Resign';
                break;
            case 'terminated':
                $statusText = 'Diberhentikan';
                break;
        }

        return [
            $index . ' )',
            $employee->employee_code ?? '-',
            $employee->full_name ?? '-',
            $employee->email ?? '-',
            $employee->phone ?? '-',
            $employee->gender == 'MALE' ? 'Laki-laki' : 'Perempuan',
            $employee->birth_date ? \Carbon\Carbon::parse($employee->birth_date)->format('d/m/Y') : '-',
            $employee->department->name ?? '-',
            $employee->position->name ?? '-',
            $employee->employmentStatus->name ?? '-',
            $employee->join_date ? \Carbon\Carbon::parse($employee->join_date)->format('d/m/Y') : '-',
            $statusText,
        ];
    }

    /**
     * Mendefinisikan lebar kolom.
     * @return array
     */
    public function columnWidths(): array
    {
        return [
            'A' => 5,   // No
            'B' => 15,  // Kode Karyawan
            'C' => 25,  // Nama Lengkap
            'D' => 25,  // Email
            'E' => 15,  // Telepon
            'F' => 12,  // Gender
            'G' => 15,  // Tanggal Lahir
            'H' => 20,  // Departemen
            'I' => 20,  // Posisi
            'J' => 18,  // Status Kerja
            'K' => 15,  // Tanggal Bergabung
            'L' => 15,  // Status
        ];
    }

    /**
     * Menambahkan gambar (logo) ke dalam sheet.
     * @return Drawing|array
     */
    public function drawings()
    {
        $drawing = new Drawing();
        $drawing->setName('WMI Logo');
        $drawing->setDescription('WMI Logo');
        $drawing->setPath(public_path('images/wmi-logo.png'));
        $drawing->setHeight(40);

        // --- UBAH BARIS INI ---
        // $drawing->setCoordinates('B1'); // Diubah dari 'A1' menjadi 'B1'
        // ----------------------

        // $drawing->setOffsetX(15);
        // $drawing->setOffsetY(10); // Sedikit disesuaikan agar pas di tengah

        return $drawing;
    }

    /**
     * Menerapkan style general pada worksheet.
     * @param Worksheet $sheet
     */
    public function styles(Worksheet $sheet)
    {
        // Style untuk header tabel utama (baris pertama dari data)
        // Posisi baris ini akan disesuaikan di dalam AfterSheet event
        return [
            1 => ['font' => ['bold' => true, 'size' => 12]],
        ];
    }

    /**
     * Memanipulasi sheet setelah data diisi.
     * Di sinilah kita membangun header, footer, dan menerapkan style dinamis.
     * @return array
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // === SOLUSI MARGIN KIRI: Sisipkan kolom baru di awal ===
                $sheet->insertNewColumnBefore('A', 1);
                $sheet->getColumnDimension('A')->setWidth(2); // Atur lebar kolom A sebagai spacer

                $highestColumn = $sheet->getHighestColumn(); // e.g., sekarang 'M'

                // === 1. MEMBUAT HEADER LAPORAN ===
                $headerRows = 5;
                $filterRows = count($this->filterNames);
                $totalHeaderRows = $headerRows + ($filterRows > 0 ? $filterRows + 2 : 0);

                $sheet->insertNewRowBefore(1, $totalHeaderRows);

                // === SOLUSI LOGO: Perbesar tinggi baris pertama ===
                $sheet->getRowDimension(1)->setRowHeight(40); // Beri ruang lebih untuk logo
                $sheet->getRowDimension(2)->setRowHeight(22);
                $sheet->getRowDimension(3)->setRowHeight(20);

                // Mengisi Judul (sekarang mulai dari kolom B)
                $sheet->mergeCells("B1:{$highestColumn}1");
                $sheet->getCell('B1')->setValue('WISE MANAJEMEN INDONESIA')->getStyle()->applyFromArray($this->getReportTitleStyle(18));

                $sheet->mergeCells("B2:{$highestColumn}2");
                $sheet->getCell('B2')->setValue('Laporan Data Karyawan')->getStyle()->applyFromArray($this->getReportTitleStyle(14));

                $sheet->mergeCells("B3:{$highestColumn}3");
                $sheet->getCell('B3')->setValue('Diekspor pada: ' . now()->format('d F Y H:i:s'))->getStyle()->applyFromArray($this->getReportTitleStyle(10, false));

                // Mengisi Filter (mulai dari kolom B)
                if ($filterRows > 0) {
                    $currentRow = 5;
                    $sheet->getCell('B' . $currentRow)->setValue('Filter yang Diterapkan:')->getStyle()->getFont()->setBold(true);
                    $currentRow++;
                    foreach ($this->filterNames as $filter) {
                        $sheet->getCell('B' . $currentRow)->setValue('• ' . $filter);
                        $currentRow++;
                    }
                }

                // === 2. STYLING TABEL UTAMA ===
                // Tabel sekarang dimulai dari kolom B
                $tableHeaderRow = $totalHeaderRows + 1;
                $headerRange = "B{$tableHeaderRow}:{$highestColumn}{$tableHeaderRow}";
                $sheet->getStyle($headerRange)->applyFromArray($this->getTableHeaderStyle());
                $sheet->getRowDimension($tableHeaderRow)->setRowHeight(25);

                $dataStartRow = $tableHeaderRow + 1;
                $highestRow = $sheet->getHighestRow();
                if ($dataStartRow <= $highestRow) {
                    $dataRange = "B{$dataStartRow}:{$highestColumn}{$highestRow}";
                    $sheet->getStyle($dataRange)->applyFromArray($this->getTableBodyStyle());

                    for ($row = $dataStartRow; $row <= $highestRow; $row++) {
                        if ($row % 2 == 1) {
                            $sheet->getStyle("B{$row}:{$highestColumn}{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('F8F9FA');
                        }
                    }
                }

                // === 3. MEMBUAT FOOTER ===
                // Footer sekarang mulai dari kolom B
                $footerStartRow = $highestRow + 2;
                $sheet->getCell('B' . $footerStartRow)->setValue('📊 Total Karyawan: ' . $this->employees->count())->getStyle()->getFont()->setBold(true);

                $sheet->getCell('B' . ($footerStartRow + 2))->setValue('Laporan ini dibuat secara otomatis oleh sistem HRMS WMI.')->getStyle()->getFont()->setItalic(true);
            },
        ];
    }

    // === Private Helper Methods ===

    private function getFilteredEmployees()
    {
        $query = Employee::with(['department', 'position', 'employmentStatus']);

        // ... (seluruh logika filter Anda yang sudah ada bisa ditaruh di sini) ...
        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }
        // Tambahkan filter lainnya sesuai kebutuhan

        return $query->orderBy('full_name')->get();
    }

    private function resolveFilterNames()
    {
        $this->filterNames = [];
        if (empty(array_filter($this->filters))) {
            return;
        }

        if (!empty($this->filters['search'])) {
            $this->filterNames[] = 'Pencarian: "' . $this->filters['search'] . '"';
        }
        if (!empty($this->filters['department_id'])) {
            // Sebaiknya resolve ID ke nama di sini
            $this->filterNames[] = 'Departemen: ' . $this->filters['department_id'];
        }
        // ... resolve filter lainnya
    }

    private function getReportTitleStyle($size, $bold = true)
    {
        return [
            'font' => ['bold' => $bold, 'size' => $size, 'name' => 'Segoe UI'],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ];
    }

    private function getTableHeaderStyle()
    {
        return [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'name' => 'Segoe UI'],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4A90E2']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '357ABD']]],
        ];
    }

    private function getTableBodyStyle()
    {
        return [
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'DDDDDD']]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ];
    }
}
