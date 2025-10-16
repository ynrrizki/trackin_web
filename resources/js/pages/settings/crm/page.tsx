import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'CRM Settings',
        href: '/settings/crm',
    },
];

interface Props {
    stats: {
        outsourcing_fields: number;
    };
}

const settingsItems = [
    {
        title: 'Bidang Outsourcing',
        description: 'Kelola bidang-bidang outsourcing untuk proyek dan karyawan',
        href: '/settings/crm/outsourcing-fields',
        icon: Building,
        statKey: 'outsourcing_fields' as keyof Props['stats'],
    },
];

export default function CRMSettings({ stats }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CRM Settings" />
            <SettingsLayout className="md:max-w-6xl">
                <div className="space-y-6">
                    <HeadingSmall title="CRM Settings" description="Kelola konfigurasi dan master data untuk sistem CRM" />

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
