import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'HRMS Settings',
        href: '/settings/hrms',
    },
    {
        title: 'Tipe Karyawan',
        href: '/settings/hrms/employee-types',
    },
];

interface EmployeeType {
    id: number;
    name: string;
    description?: string;
    employees_count: number;
    created_at: string;
}

interface Props {
    employeeTypes: EmployeeType[];
}

export default function EmployeeTypes({ employeeTypes }: Props) {
    const columns: DataTableColumn<EmployeeType>[] = [
        { key: 'name', header: 'Nama Tipe', cell: (t) => <span className="font-medium">{t.name}</span> },
        { key: 'description', header: 'Deskripsi', accessor: (t) => t.description || '-' },
        { key: 'count', header: 'Jumlah Karyawan', align: 'center', cell: (t) => <Badge variant="outline">{t.employees_count}</Badge> },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tipe Karyawan" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Tipe Karyawan"
                        description="Atur kategori dan tipe karyawan dalam organisasi"
                    />

                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <CardTitle>Daftar Tipe Karyawan</CardTitle>
                            </div>
                            <CardDescription>
                                Total {employeeTypes.length} tipe karyawan terdaftar dalam sistem
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={employeeTypes}
                                columns={columns}
                                emptyTitle="Belum ada tipe karyawan"
                                emptyDescription="Tipe karyawan akan tampil di sini setelah ditambahkan."
                                emptyIcon={Users}
                            />

                            {employeeTypes.length > 0 && (
                                <div className="mt-4 text-sm text-muted-foreground">
                                    <p>
                                        💡 <strong>Info:</strong> Data tipe karyawan dikelola melalui sistem master data.
                                        Hubungi administrator untuk menambah atau mengubah tipe karyawan.
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
