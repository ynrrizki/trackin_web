import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import LockLayout from '@/layouts/lock-layout';
import { Head } from '@inertiajs/react';
import { Calculator, FileSpreadsheet, Wallet } from 'lucide-react';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Payroll', href: '/payroll' },
];

export default function PayrollPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />

            <LockLayout
                title="Payroll"
                status="Dalam Pengembangan"
                description="Halaman ini sedang dalam pengembangan. Fitur ini akan segera tersedia."
            >
                <div className="mx-auto w-full max-w-[1100px] px-4 py-6">
                    {/* Ringkasan */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                    Total Gaji Bulan Ini
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-7 w-40 rounded bg-muted/30" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <Calculator className="h-4 w-4 text-muted-foreground" />
                                    Potongan & Tunjangan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="h-4 w-48 rounded bg-muted/30" />
                                    <div className="h-4 w-44 rounded bg-muted/30" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                                    Rekap Slip Gaji
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-7 w-36 rounded bg-muted/30" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabel Placeholder */}
                    <div className="mt-6 rounded-lg border">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <div className="h-4 w-40 rounded bg-muted/30" />
                            <div className="h-8 w-32 rounded bg-muted/30" />
                        </div>
                        <div className="divide-y">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3">
                                    <div className="h-4 w-28 rounded bg-muted/30" />
                                    <div className="h-4 w-24 rounded bg-muted/30" />
                                    <div className="h-4 w-20 rounded bg-muted/30" />
                                    <div className="h-4 w-24 justify-self-end rounded bg-muted/30" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </LockLayout>
        </AppLayout>
    );
}
