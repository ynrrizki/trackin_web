import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Receipt } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'HRMS Settings',
        href: '/settings/hrms',
    },
    {
        title: 'Status Pajak',
        href: '/settings/hrms/tax-statuses',
    },
];

interface TaxStatus {
    id: number;
    name: string;
    description?: string;
    employees_count: number;
    created_at: string;
}

interface Props {
    taxStatuses: TaxStatus[];
}

export default function TaxStatuses({ taxStatuses }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Status Pajak" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Status Pajak"
                        description="Atur kategori status pajak karyawan dalam organisasi"
                    />

                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Receipt className="h-5 w-5 text-muted-foreground" />
                                <CardTitle>Daftar Status Pajak</CardTitle>
                            </div>
                            <CardDescription>
                                Total {taxStatuses.length} status pajak terdaftar dalam sistem
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama Status</TableHead>
                                            <TableHead>Deskripsi</TableHead>
                                            <TableHead className="text-center">Jumlah Karyawan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {taxStatuses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8">
                                                    Belum ada status pajak yang terdaftar
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            taxStatuses.map((status) => (
                                                <TableRow key={status.id}>
                                                    <TableCell className="font-medium">{status.name}</TableCell>
                                                    <TableCell>{status.description || '-'}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline">{status.employees_count}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {taxStatuses.length > 0 && (
                                <div className="mt-4 text-sm text-muted-foreground">
                                    <p>
                                        💡 <strong>Info:</strong> Data status pajak dikelola melalui sistem master data.
                                        Hubungi administrator untuk menambah atau mengubah status pajak.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
