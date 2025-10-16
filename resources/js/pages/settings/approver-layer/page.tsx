import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import LockLayout from '@/layouts/lock-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Head, Link } from '@inertiajs/react';
import { Briefcase, Calendar, ChevronRight, Clock, CreditCard, FileText, Settings, Users } from 'lucide-react';

// Types
interface ApproverLayerSummary {
    approvable_type_id: number;
    approvable_type: string;
    display_name: string;
    description: string;
    icon: string;
    total_layers: number;
    active_layers: number;
    last_updated: string;
}

interface ApproverLayerIndexProps {
    approver_layers?: ApproverLayerSummary[];
}

const getIcon = (iconName: string) => {
    const icons = {
        users: Users,
        'file-text': FileText,
        clock: Clock,
        'credit-card': CreditCard,
        calendar: Calendar,
        briefcase: Briefcase,
    };

    const IconComponent = icons[iconName as keyof typeof icons] || FileText;
    return <IconComponent className="h-6 w-6" />;
};

const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`;
    return `${Math.floor(diffInMinutes / 1440)} hari yang lalu`;
};

// Default modules for demo
const defaultModules = [
    {
        approvable_type_id: 1,
        approvable_type: 'App\\Models\\LeaveRequest',
        display_name: 'Leave Requests',
        description: 'Kelola level persetujuan untuk permohonan cuti',
        icon: 'calendar',
        total_layers: 0,
        active_layers: 0,
        last_updated: new Date().toISOString(),
    },
    {
        approvable_type_id: 2,
        approvable_type: 'App\\Models\\Overtime',
        display_name: 'Overtime Requests',
        description: 'Kelola level persetujuan untuk permohonan lembur',
        icon: 'clock',
        total_layers: 0,
        active_layers: 0,
        last_updated: new Date().toISOString(),
    },
    {
        approvable_type_id: 3,
        approvable_type: 'App\\Models\\ClientInvoice',
        display_name: 'Expense Claims',
        description: 'Kelola level persetujuan untuk klaim reimburse',
        icon: 'credit-card',
        total_layers: 0,
        active_layers: 0,
        last_updated: new Date().toISOString(),
    },
    {
        approvable_type_id: 4,
        approvable_type: 'App\\Models\\Document',
        display_name: 'Document Approvals',
        description: 'Kelola level persetujuan untuk dokumen',
        icon: 'file-text',
        total_layers: 0,
        active_layers: 0,
        last_updated: new Date().toISOString(),
    },
];

export default function ApproverLayer({ approver_layers }: ApproverLayerIndexProps) {
    const modules = approver_layers || defaultModules;

    return (
        <AppLayout>
            <Head title="Approver Layer Settings" />
            <SettingsLayout className="md:max-w-6xl">
                <LockLayout
                    title="Approver Layer Settings"
                    status="Dikunci"
                    description="Halaman ini sedang dikunci. Fitur ini akan diaktifkan pada phase 2"
                >
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold">Approver Layer Settings</h1>
                            <p className="text-muted-foreground">Kelola level persetujuan untuk berbagai jenis dokumen dan permintaan</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                            {modules.map((layer) => (
                                <Card key={layer.approvable_type_id} className="group transition-all duration-200 hover:shadow-md">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-primary/10 p-2 text-primary">{getIcon(layer.icon)}</div>
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{layer.display_name}</CardTitle>
                                                <CardDescription className="text-sm">{layer.description}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <Badge variant="outline">
                                                    {layer.total_layers} Total Layer{layer.total_layers > 1 ? 's' : ''}
                                                </Badge>
                                                <Badge
                                                    variant={layer.active_layers > 0 ? 'default' : 'secondary'}
                                                    className={layer.active_layers > 0 ? 'bg-green-100 text-green-800' : ''}
                                                >
                                                    {layer.active_layers} Aktif
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="text-xs text-muted-foreground">Diupdate {getTimeAgo(layer.last_updated)}</div>

                                        <Button
                                            asChild
                                            variant="outline"
                                            className="w-full transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                                        >
                                            <Link href={`/settings/approver-layer/${layer.approvable_type_id}`}>
                                                <Settings className="mr-2 h-4 w-4" />
                                                Kelola Layer
                                                <ChevronRight className="ml-auto h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card className="bg-muted/30">
                            <CardHeader>
                                <CardTitle className="text-base">Informasi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>
                                    <strong>Approver Layer</strong> menentukan urutan dan level persetujuan untuk berbagai jenis dokumen.
                                </p>
                                <p>• Level 1 akan diproses terlebih dahulu, kemudian level 2, dan seterusnya</p>
                                <p>• Setiap level dapat berupa user spesifik atau role</p>
                                <p>• Jika tidak ada konfigurasi khusus, sistem akan menggunakan konfigurasi default</p>
                            </CardContent>
                        </Card>
                    </div>
                </LockLayout>
            </SettingsLayout>
        </AppLayout>
    );
}
