<table>
    <thead>
        <tr>
            <th>NIP</th>
            <th>Nama</th>
            <th>Departemen</th>
            <th>Posisi</th>
            <th>Tipe</th>
            <th>Checkin (Lat,Long)</th>
            <th>Jam Checkin</th>
            <th>Checkout (Lat,Long)</th>
            <th>Jam Checkin</th>
            <th>Tanggal</th>
        </tr>
    </thead>
    <tbody>
        @foreach($employees as $emp)
            @php
                $att = $attendances->first(function ($a) use ($emp) {
                    return $a->employee_id == $emp->id;
                });
            @endphp
            <tr>
                <td>{{ $emp->employee_code }}</td>
                <td>{{ $emp->full_name }}</td>
                <td>{{ $emp->department?->name }}</td>
                <td>{{ $emp->position?->name }}</td>
                <td>{{ $emp->outsourcing_field_id ? 'Outsourcing' : 'Internal' }}</td>
                <td>
                    @if($att && $att->latlot_in)
                        {{ $att->latlot_in }}
                    @endif
                </td>
                <td>
                    @if($att && $att->latlot_out)
                        {{ $att->latlot_out }}
                    @endif
                </td>
                <td>
                    @if ($att && $att->time_in)
                        {{ $att->time_in }}
                    @endif
                </td>
                <td>
                    @if($att)
                        {{ $att->date }}
                    @endif
                </td>
                <td>
                    @if ($att && $att->time_out)
                        {{ $att->time_out }}
                    @endif
                </td>
            </tr>
        @endforeach
    </tbody>
</table>