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
import { Building2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'HRMS Settings',
        href: '/settings/hrms',
    },
    {
        title: 'Departemen',
        href: '/settings/hrms/departments',
    },
];

interface Department {
    id: number;
    name: string;
    description?: string;
    employees_count: number;
    created_at: string;
}

interface Props {
    departments: Department[];
}

export default function Departments({ departments }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Departemen" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Departemen"
                        description="Kelola departemen dalam organisasi"
                    />

                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                <CardTitle>Daftar Departemen</CardTitle>
                            </div>
                            <CardDescription>
                                Total {departments.length} departemen terdaftar dalam organisasi
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama Departemen</TableHead>
                                            <TableHead>Deskripsi</TableHead>
                                            <TableHead className="text-center">Jumlah Karyawan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {departments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8">
                                                    Belum ada departemen yang terdaftar
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            departments.map((department) => (
                                                <TableRow key={department.id}>
                                                    <TableCell className="font-medium">{department.name}</TableCell>
                                                    <TableCell>{department.description || '-'}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline">{department.employees_count}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {departments.length > 0 && (
                                <div className="mt-4 text-sm text-muted-foreground">
                                    <p>
                                        💡 <strong>Info:</strong> Data departemen dikelola melalui sistem master data.
                                        Hubungi administrator untuk menambah atau mengubah departemen.
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
