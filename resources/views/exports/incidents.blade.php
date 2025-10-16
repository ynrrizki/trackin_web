<table>
    <tbody>
        {{-- Spacer rows for logo and header --}}
        <tr><td></td></tr>
        <tr><td></td></tr>
        <tr><td></td></tr>
        <tr><td></td></tr>

        {{-- Header Row --}}
        <tr>
            <th style="font-weight: bold; background-color: #059669; color: white; text-align: center;">No</th>
            <th style="font-weight: bold; background-color: #059669; color: white; text-align: center;">Kategori</th>
            <th style="font-weight: bold; background-color: #059669; color: white; text-align: center;">Lokasi</th>
            <th style="font-weight: bold; background-color: #059669; color: white; text-align: center;">Tanggal</th>
            <th style="font-weight: bold; background-color: #059669; color: white; text-align: center;">Severity</th>
            <th style="font-weight: bold; background-color: #059669; color: white; text-align: center;">Deskripsi</th>
            <th style="font-weight: bold; background-color: #059669; color: white; text-align: center;">Tindakan</th>
            <th style="font-weight: bold; background-color: #059669; color: white; text-align: center;">Status</th>
            <th style="font-weight: bold; background-color: #059669; color: white; text-align: center;">Prioritas</th>
            <th style="font-weight: bold; background-color: #059669; color: white; text-align: center;">Petugas</th>
        </tr>

        {{-- Data Rows --}}
        @foreach($incidents as $index => $incident)
        <tr style="{{ $loop->iteration % 2 == 0 ? 'background-color: #f9fafb;' : '' }}">
            <td style="text-align: center;">{{ $loop->iteration }}</td>
            <td>{{ $incident->category->name ?? '-' }}</td>
            <td>{{ $incident->location ?? '-' }}</td>
            <td>{{ $incident->incident_at ? \Carbon\Carbon::parse($incident->incident_at)->format('d/m/Y H:i') : '-' }}</td>
            <td style="text-align: center; font-weight: bold; color: {{
                $incident->severity === 'Tinggi' ? '#dc2626' :
                ($incident->severity === 'Sedang' ? '#f59e0b' : '#16a34a')
            }};">{{ $incident->severity ?? '-' }}</td>
            <td>{{ Str::limit($incident->description ?? '-', 100) }}</td>
            <td>{{ Str::limit($incident->handling_steps ?? '-', 100) }}</td>
            <td style="text-align: center; font-weight: bold;">
                @switch($incident->status)
                    @case('reported')
                        <span style="color: #f59e0b;">Dilaporkan</span>
                        @break
                    @case('investigating')
                        <span style="color: #3b82f6;">Investigasi</span>
                        @break
                    @case('resolved')
                        <span style="color: #16a34a;">Terselesaikan</span>
                        @break
                    @case('closed')
                        <span style="color: #6b7280;">Ditutup</span>
                        @break
                    @default
                        <span style="color: #6b7280;">-</span>
                @endswitch
            </td>
            <td style="text-align: center; font-weight: bold;">
                @switch($incident->priority)
                    @case('critical')
                        <span style="color: #7c3aed;">Kritis</span>
                        @break
                    @case('high')
                        <span style="color: #dc2626;">Tinggi</span>
                        @break
                    @case('medium')
                        <span style="color: #f59e0b;">Sedang</span>
                        @break
                    @case('low')
                        <span style="color: #16a34a;">Rendah</span>
                        @break
                    @default
                        <span style="color: #6b7280;">-</span>
                @endswitch
            </td>
            <td>{{ $incident->assignedTo->full_name ?? 'Belum ditugaskan' }}</td>
        </tr>
        @endforeach

        {{-- Summary Row --}}
        <tr style="background-color: #e5e7eb; font-weight: bold;">
            <td colspan="10" style="text-align: center; padding: 10px;">
                Total: {{ $incidents->count() }} insiden |
                Dilaporkan: {{ $incidents->where('status', 'reported')->count() }} |
                Investigasi: {{ $incidents->where('status', 'investigating')->count() }} |
                Selesai: {{ $incidents->where('status', 'resolved')->count() + $incidents->where('status', 'closed')->count() }}
            </td>
        </tr>

        {{-- Filter Info --}}
        @if(!empty(array_filter($filters)))
        <tr><td colspan="10"></td></tr>
        <tr style="background-color: #f3f4f6;">
            <td colspan="10" style="padding: 10px; font-style: italic; color: #6b7280;">
                <strong>Filter yang diterapkan:</strong>
                @if(!empty($filters['status']) && $filters['status'] !== 'all')
                    Status: {{ ucfirst($filters['status']) }} |
                @endif
                @if(!empty($filters['priority']) && $filters['priority'] !== 'all')
                    Prioritas: {{ ucfirst($filters['priority']) }} |
                @endif
                @if(!empty($filters['severity']) && $filters['severity'] !== 'all')
                    Severity: {{ $filters['severity'] }} |
                @endif
                @if(!empty($filters['from']))
                    Dari: {{ $filters['from'] }} |
                @endif
                @if(!empty($filters['to']))
                    Sampai: {{ $filters['to'] }} |
                @endif
                @if(!empty($filters['q']))
                    Pencarian: "{{ $filters['q'] }}"
                @endif
            </td>
        </tr>
        @endif
    </tbody>
</table>
