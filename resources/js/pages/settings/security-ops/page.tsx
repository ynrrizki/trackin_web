import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Security OPS Settings',
        href: '/settings/security-ops',
    },
];

const settingsItems = [
    {
        title: 'Kategori Kejadian',
        description: 'Kelola kategori-kategori kejadian untuk pelaporan dan analisis',
        href: '/settings/security-ops/incident-categories',
        icon: Building,
        // statKey: 'outsourcing_fields' as keyof Props['stats'],
        // statKey: ''
    },
];

export default function SECSettings() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Security OPS Settings" />
            <SettingsLayout className="md:max-w-6xl">
                <div className="space-y-6">
                    <HeadingSmall title="Security OPS Settings" description={'Kelola konfigurasi dan master data untuk sistem Security OPS'} />

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
                                        {/* <Badge variant="secondary">{stats[item.statKey]}</Badge> */}
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
