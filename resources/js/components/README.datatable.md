# DataTable Component

Reusable table wrapper with unified empty state & simple column API.

## Fitur

- Definisi kolom deklaratif
- Empty state seragam (ikon + judul + deskripsi)
- Skeleton rows (loading)
- Alignment per kolom (left/right/center)
- Custom cell renderer atau accessor sederhana

## Contoh Penggunaan

```tsx
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface Employee { id:number; name:string; email:string; code:string }

const columns: DataTableColumn<Employee>[] = [
  { key:'code', header:'Kode', cell: e => <Badge variant="outline">{e.code}</Badge> },
  { key:'name', header:'Nama', accessor: e => e.name },
  { key:'email', header:'Email', accessor: e => e.email },
];

<DataTable
  data={employees}
  columns={columns}
  emptyIcon={Users}
  emptyTitle="Belum ada karyawan"
  emptyDescription="Tambahkan karyawan pertama Anda."
/>;
```

## Properti

| Prop | Tipe | Deskripsi |
|------|------|-----------|
| data | T[] | Array data sumber |
| columns | DataTableColumn<`T`>[] | Definisi kolom |
| loading | boolean | Menampilkan skeleton rows |
| skeletonCount | number | Jumlah skeleton rows |
| emptyIcon | LucideIcon | Ikon saat kosong |
| emptyTitle | ReactNode | Judul empty state |
| emptyDescription | ReactNode | Deskripsi empty state |
| colSpan | number | Override colspan baris kosong |

## Kolom

`cell` > `accessor`. Jika keduanya tidak ada -> kolom kosong.

```ts
interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  className?: string;
  cell?: (row:T) => ReactNode;
  accessor?: (row:T) => ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
}
```

## Empty State Default

- Icon: FileWarning
- Title: "Belum ada data"
- Description: "Data akan muncul di sini setelah Anda menambahkannya."

## Catatan

Gunakan komponen ini untuk menyatukan pola table agar konsisten dan memudahkan improvisasi (pagination, sorting) di masa depan.

### Implementasi Saat Ini

- HRMS Employee List (`hrms/employee/page.tsx`)
- HRMS Employee Types (`settings/hrms/employee-types.tsx`)
- Security Ops Patroli (`security-ops/patroli/page.tsx`)
- Security Ops Patroli Projects (`security-ops/patroli/projects.tsx`)
- Security Ops Incident List (`security-ops/incident/page.tsx`)
- HRMS Attendance (`hrms/attendance/index.tsx`)
- HRMS Overtime (`hrms/overtime/index.tsx`)
- HRMS Leave (`hrms/leave/index.tsx`)
- CRM Clients (`crm/client/page.tsx`)
- CRM Client Projects (`crm/client-project/page.tsx`)
- CRM Employee Projects (`crm/employee-project/page.tsx`)
- CRM Tender (placeholder) (`crm/tender/page.tsx`)

Halaman lain dengan pola tabel bisa dimigrasikan bertahap mengikuti contoh di atas.
