<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px 0;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin: 15px 0 5px 0;
            letter-spacing: 1px;
        }

        .report-title {
            font-size: 18px;
            font-weight: 600;
            color: #34495e;
            margin: 5px 0 15px 0;
        }

        .export-info {
            font-size: 12px;
            color: #7f8c8d;
            margin: 10px 0;
            font-style: italic;
        }

        .filters-section {
            background-color: #f8f9fa;
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
            border-left: 4px solid #4A90E2;
        }

        .filter-title {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 13px;
        }

        .filter-item {
            margin: 3px 0;
            font-size: 11px;
            color: #5a6c7d;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        th {
            background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
            color: white;
            font-weight: bold;
            text-align: center;
            padding: 12px 8px;
            font-size: 12px;
            border: 1px solid #357ABD;
        }

        td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 11px;
            vertical-align: middle;
        }

        .number {
            text-align: center;
            font-weight: 600;
        }

        .date {
            text-align: center;
        }

        .status {
            text-align: center;
        }

        .employee-code {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            color: #2c3e50;
        }

        .employee-name {
            font-weight: 600;
            color: #2c3e50;
        }

        tr:nth-child(even) td {
            background-color: #f8f9fa;
        }

        tr:hover td {
            background-color: #e3f2fd;
        }

        .footer-info {
            margin-top: 20px;
            font-size: 11px;
            color: #7f8c8d;
            border-top: 1px solid #ecf0f1;
            padding-top: 15px;
        }

        .total-info {
            font-weight: bold;
            color: #2c3e50;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="company-name">WISE MANAJEMEN INDONESIA</div>
        <div class="report-title">Laporan Data Karyawan</div>
        <div class="export-info">Diekspor pada: {{ $exportDate }}</div>

        @if (!empty(array_filter($filters)))
            <div class="filters-section">
                <div class="filter-title">Filter yang Diterapkan:</div>
                @if (!empty($filters['search']))
                    <div class="filter-item">• Pencarian: "{{ $filters['search'] }}"</div>
                @endif
                @if (!empty($filters['department_id']))
                    <div class="filter-item">• Departemen: {{ $filters['department_id'] }}</div>
                @endif
                @if (!empty($filters['position_id']))
                    <div class="filter-item">• Posisi: {{ $filters['position_id'] }}</div>
                @endif
                @if (!empty($filters['employment_status_id']))
                    <div class="filter-item">• Status Kepegawaian: {{ $filters['employment_status_id'] }}</div>
                @endif
                @if (!empty($filters['status']))
                    <div class="filter-item">• Status: {{ ucfirst($filters['status']) }}</div>
                @endif
                @if (!empty($filters['gender']))
                    <div class="filter-item">• Jenis Kelamin:
                        {{ $filters['gender'] == 'M' ? 'Laki-laki' : 'Perempuan' }}</div>
                @endif
                @if (!empty($filters['join_date_from']) || !empty($filters['join_date_to']))
                    <div class="filter-item">
                        • Tanggal Bergabung:
                        @if (!empty($filters['join_date_from']))
                            dari {{ $filters['join_date_from'] }}
                        @endif
                        @if (!empty($filters['join_date_to']))
                            sampai {{ $filters['join_date_to'] }}
                        @endif
                    </div>
                @endif
            </div>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 4%;">No</th>
                <th style="width: 10%;">Kode Karyawan</th>
                <th style="width: 18%;">Nama Lengkap</th>
                <th style="width: 15%;">Email</th>
                <th style="width: 10%;">Telepon</th>
                <th style="width: 8%;">Gender</th>
                <th style="width: 10%;">Tanggal Lahir</th>
                <th style="width: 12%;">Departemen</th>
                <th style="width: 12%;">Posisi</th>
                <th style="width: 10%;">Status Kerja</th>
                <th style="width: 10%;">Tanggal Bergabung</th>
                <th style="width: 8%;">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($employees as $index => $employee)
                <tr>
                    <td class="number">{{ $index + 1 }}</td>
                    <td class="employee-code">{{ $employee->employee_code ?? '-' }}</td>
                    <td class="employee-name">{{ $employee->full_name ?? '-' }}</td>
                    <td>{{ $employee->email ?? '-' }}</td>
                    <td>{{ $employee->phone ?? '-' }}</td>
                    <td class="status">
                        {{ $employee->gender == 'M' ? 'Laki-laki' : ($employee->gender == 'F' ? 'Perempuan' : '-') }}
                    </td>
                    <td class="date">
                        @if ($employee->birth_date)
                            @if (is_string($employee->birth_date))
                                {{ date('d/m/Y', strtotime($employee->birth_date)) }}
                            @else
                                {{ $employee->birth_date->format('d/m/Y') }}
                            @endif
                        @else
                            -
                        @endif
                    </td>
                    <td>{{ $employee->department->name ?? '-' }}</td>
                    <td>{{ $employee->position->name ?? '-' }}</td>
                    <td>{{ $employee->employmentStatus->name ?? '-' }}</td>
                    <td class="date">
                        @if ($employee->join_date)
                            @if (is_string($employee->join_date))
                                {{ date('d/m/Y', strtotime($employee->join_date)) }}
                            @else
                                {{ $employee->join_date->format('d/m/Y') }}
                            @endif
                        @else
                            -
                        @endif
                    </td>
                    <td class="status">
                        @switch($employee->status)
                            @case('active')
                                <span
                                    style="background-color: #d4edda; color: #155724; padding: 3px 8px; border-radius: 12px; font-size: 10px;">Aktif</span>
                            @break

                            @case('inactive')
                                <span
                                    style="background-color: #f8d7da; color: #721c24; padding: 3px 8px; border-radius: 12px; font-size: 10px;">Tidak
                                    Aktif</span>
                            @break

                            @case('on_leave')
                                <span
                                    style="background-color: #fff3cd; color: #856404; padding: 3px 8px; border-radius: 12px; font-size: 10px;">Cuti</span>
                            @break

                            @case('resigned')
                                <span
                                    style="background-color: #e2e3e5; color: #383d41; padding: 3px 8px; border-radius: 12px; font-size: 10px;">Resign</span>
                            @break

                            @case('terminated')
                                <span
                                    style="background-color: #f5c6cb; color: #721c24; padding: 3px 8px; border-radius: 12px; font-size: 10px;">Diberhentikan</span>
                            @break

                            @default
                                <span
                                    style="background-color: #e2e3e5; color: #383d41; padding: 3px 8px; border-radius: 12px; font-size: 10px;">{{ $employee->status ?? '-' }}</span>
                        @endswitch
                    </td>
                </tr>
                @empty
                    <tr>
                        <td colspan="12" style="text-align: center; color: #6c757d; font-style: italic; padding: 20px;">
                            Tidak ada data karyawan yang sesuai dengan filter yang diterapkan
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div class="footer-info">
            <div class="total-info">📊 Total Karyawan: {{ $employees->count() }}</div>

            <div style="margin-top: 15px;">
                <strong>Keterangan Status Karyawan:</strong>
                <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
                    <li><strong>Aktif:</strong> Karyawan yang sedang bekerja secara aktif</li>
                    <li><strong>Tidak Aktif:</strong> Karyawan yang sementara tidak bekerja</li>
                    <li><strong>Cuti:</strong> Karyawan yang sedang dalam masa cuti</li>
                    <li><strong>Resign:</strong> Karyawan yang telah mengundurkan diri</li>
                    <li><strong>Diberhentikan:</strong> Karyawan yang diberhentikan dari perusahaan</li>
                </ul>
            </div>

            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #dee2e6; font-style: italic;">
                Laporan ini dibuat secara otomatis oleh sistem HRMS WMI.
                Untuk informasi lebih lanjut, hubungi departemen HR.
            </div>
        </div>
    </body>

    </html>
