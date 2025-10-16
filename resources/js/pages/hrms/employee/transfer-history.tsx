import { DataTable, type DataTableColumn } from '@/components/data-table';
import { TransferSheet } from '@/components/hrms/transfer-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import LockLayout from '@/layouts/lock-layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface ApprovalTimelineItem {
    id: number;
    status: string;
    approver_name?: string | null;
    created_at?: string | null;
}
interface HistoryRow {
    id: number;
    employee: { full_name: string; employee_code: string };
    type: string;
    effective_date: string | null;
    applied_at: string | null;
    approval_status: string;
    approvals: ApprovalTimelineItem[];
    from_snapshot?: Record<string, unknown> | null;
    to_snapshot?: Record<string, unknown> | null;
}
interface PageProps {
    histories: { data: HistoryRow[]; links: { url: string | null; label: string; active: boolean }[] };
}

export default function TransferHistoryPage({ histories }: PageProps) {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Karyawan', href: route('hrms.employees.index') },
        { title: 'Employee Transfers', href: route('hrms.employees.transfers.index') },
    ];
    const [sheetOpen, setSheetOpen] = useState(false);
    // const [historyMode, setHistoryMode] = useState(true);

    const columns: DataTableColumn<HistoryRow>[] = [
        {
            key: 'employee',
            header: 'Karyawan',
            cell: (r) => (
                <div className="flex flex-col text-xs">
                    <span className="text-sm font-medium">{r.employee?.full_name}</span>
                    <span className="text-muted-foreground">{r.employee?.employee_code}</span>
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Jenis',
            cell: (r) => (
                <Badge variant="outline" className="capitalize">
                    {r.type}
                </Badge>
            ),
        },
        { key: 'effective_date', header: 'Efektif', accessor: (r) => r.effective_date || '-' },
        { key: 'applied_at', header: 'Applied', accessor: (r) => r.applied_at || '-' },
        { key: 'approval', header: 'Approval', cell: (r) => <StatusCell row={r} /> },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Transfer" />
            <LockLayout
                title="Riwayat Transfer Karyawan"
                status="Dalam Pengembangan"
                description="Halaman ini dikunci. Fitur ini akan segera tersedia pada phase 2."
            >
                <div className="flex flex-col gap-4 p-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-semibold">Riwayat Transfer / Mutasi / Rotasi</h1>
                        <Button
                            onClick={() => {
                                setSheetOpen(true);
                                // setHistoryMode(false);
                            }}
                        >
                            Buat Transfer
                        </Button>
                    </div>
                    <DataTable data={histories.data} columns={columns} emptyTitle="Belum ada riwayat" emptyDescription="Belum ada data transfer." />
                    <TransferSheet open={sheetOpen} onOpenChange={setSheetOpen} />
                </div>
            </LockLayout>
        </AppLayout>
    );
}

function StatusCell({ row }: { row: HistoryRow }) {
    const s = (row.approval_status || '').toLowerCase();
    const variant = s === 'approved' ? 'default' : s === 'rejected' ? 'destructive' : 'outline';
    return (
        <div className="flex flex-col gap-1 text-[10px]">
            <Badge variant={variant} className="w-fit capitalize">
                {row.approval_status}
            </Badge>
            <div className="flex flex-col gap-0.5">
                {row.approvals?.map((a) => (
                    <div key={a.id} className="flex items-center justify-between">
                        <span>{a.approver_name || 'Approver'}</span>
                        <span className="capitalize">{a.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
