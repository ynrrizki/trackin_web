import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Share } from 'lucide-react';
import { toast } from 'sonner';

interface EmployeeHeaderProps {
    employee: {
        id?: number | string;
        full_name: string;
        email: string;
        photo_url?: string;
        status?: string;
        join_date?: string;
        basic_salary?: number;
        department?: { name: string };
        position?: { name: string };
        employeeType?: { name: string };
    };
    getInitials: (name: string) => string;
    formatDate: (date: string) => string;
    formatCurrency?: (amount: number) => string; // optional, not displayed anymore
    getStatusBadge: (status: string) => string;
    getEmploymentTypeBadge: (type: string) => string;
}

export function EmployeeHeader({
    employee,
    getInitials,
    formatDate,
    getStatusBadge,
    getEmploymentTypeBadge
}: EmployeeHeaderProps) {
    const handleShare = async () => {
        const sharePath = employee.id != null ? `/employees/${employee.id}` : `/employees/${encodeURIComponent(employee.full_name)}`;
        const url = `${window.location.origin}${sharePath}`;
        const title = `Employee Profile: ${employee.full_name}`;
        const text = `${employee.full_name} • ${employee.position?.name || ''} • ${employee.department?.name || ''}`.trim();

        try {
            if (navigator.share) {
                await navigator.share({ title, text, url });
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                toast.success('Link profil disalin ke clipboard');
            } else {
                // fallback
                prompt('Salin link profil ini:', url);
            }
        } catch {
            // user cancelled or failed
        }
    };

    return (
        <div className="rounded-lg border p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-4 sm:mb-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                    <Link href={route('hrms.employees.index')}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="hidden text-sm text-muted-foreground sm:block">Kembali</div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex" onClick={handleShare}>
                        <Share className="mr-2 h-4 w-4" />
                        Share Profile
                    </Button>
                </div>
            </div>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
                <Avatar className="h-16 w-16 border-4 border-white shadow-lg sm:h-20 sm:w-20">
                    <AvatarImage src={employee.photo_url || undefined} />
                    <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
                        {getInitials(employee.full_name)}
                    </AvatarFallback>
                </Avatar>

                <div className="w-full flex-1">
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <h1 className="text-xl font-bold sm:text-2xl">{employee.full_name}</h1>
                        <Badge className={getStatusBadge(employee.status || 'active')}>{employee.status || 'active'}</Badge>
                    </div>
                    <p className="mb-4 text-muted-foreground">{employee.email}</p>

                    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <p className="mb-1 text-muted-foreground">Hired Since</p>
                            <p className="font-medium">{employee.join_date ? formatDate(employee.join_date) : '-'}</p>
                        </div>
                        <div>
                            <p className="mb-1 text-muted-foreground">Department</p>
                            <p className="font-medium">{employee.department?.name || '-'}</p>
                        </div>
                        <div>
                            <p className="mb-1 text-muted-foreground">Role</p>
                            <p className="font-medium">{employee.position?.name || '-'}</p>
                        </div>
                        <div>
                            <p className="mb-1 text-muted-foreground">Employment</p>
                            <Badge className={`border ${getEmploymentTypeBadge(employee.employeeType?.name || '')}`}>
                                {employee.employeeType?.name || 'Full-Time'}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
