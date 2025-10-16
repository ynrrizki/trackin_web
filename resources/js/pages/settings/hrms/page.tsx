import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Briefcase, Building2, CalendarDays, Clock, Layers, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'HRMS Settings',
        href: '/settings/hrms',
    },
];

interface Props {
    stats: {
        departments: number;
        employee_types: number;
        employment_statuses: number;
        shifts: number;
    };
}

const settingsItems = [
    {
        title: 'Departemen',
        description: 'Kelola departemen dalam organisasi',
        href: '/settings/hrms/departments',
        icon: Building2,
        statKey: 'departments' as keyof Props['stats'],
    },
    {
        title: 'Tipe Karyawan',
        description: 'Atur kategori dan tipe karyawan',
        href: '/settings/hrms/employee-types',
        icon: Users,
        statKey: 'employee_types' as keyof Props['stats'],
    },
    {
        title: 'Status Kepegawaian',
        description: 'Kelola status kepegawaian karyawan',
        href: '/settings/hrms/employment-statuses',
        icon: Briefcase,
        statKey: 'employment_statuses' as keyof Props['stats'],
    },
    {
        title: 'Pengaturan Shift',
        description: 'Kelola shift dan penugasan absensi',
        href: '/settings/hrms/shifts',
        icon: Clock,
        statKey: 'shifts' as keyof Props['stats'],
    },
    {
        title: 'Kategori Cuti',
        description: 'Kelola kategori cuti dan aturan dasar',
        href: '/settings/hrms/leave-categories',
        icon: Layers,
        statKey: 'leave_categories' as keyof Props['stats'],
    },
    {
        title: 'Hari Libur',
        description: 'Kelola hari libur nasional dan cuti bersama',
        href: '/settings/hrms/holidays',
        icon: CalendarDays,
        statKey: 'holidays' as keyof Props['stats'],
    },
];

export default function HRMSSettings({ stats }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="HRMS Settings" />
            <SettingsLayout className="md:max-w-6xl">
                <div className="space-y-6">
                    <HeadingSmall title="HRMS Settings" description="Kelola konfigurasi dan master data untuk sistem HRMS" />

                    <div className="grid gap-4 md:grid-cols-2">
                        {settingsItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Card key={item.href} className="relative">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <div className="flex items-center space-x-2">
                                            <Icon className="h-5 w-5 text-muted-foreground" />
                                            <CardTitle className="text-base">{item.title}</CardTitle>
                                        </div>
                                        <Badge variant="secondary">{stats[item.statKey]}</Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="mb-4">{item.description}</CardDescription>
                                        <Link href={item.href}>
                                            <Button variant="outline" size="sm" className="w-full">
                                                Kelola {item.title}
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
