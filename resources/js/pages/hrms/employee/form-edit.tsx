import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { EmployeeFormType } from '@/types/employee';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import FormEmployeeEditWizard from './FormEmployeeEditWizard';

interface EmployeeFormEditProps {
    employee: EmployeeFormType & { id: number };
}

export default function EmployeeFormEdit({ employee }: EmployeeFormEditProps) {
    const breadcrumbs = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Karyawan',
            href: '/hrms/employees',
        },
        {
            title: employee.full_name || 'Employee',
            href: `/hrms/employees/${employee.id}`,
        },
        {
            title: 'Edit',
            href: `/hrms/employees/${employee.id}/edit`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Karyawan - ${employee.full_name}`} />
            <div className="flex h-full flex-1 flex-col items-center gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mx-auto flex w-full max-w-2xl items-start justify-start">
                    <Link href={`/employees/${employee.id}`}>
                        <Button variant={'outline'}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali ke Detail
                        </Button>
                    </Link>
                </div>
                <div className="mt-4 flex flex-col items-center gap-2">
                    <h1 className="text-2xl font-bold">Edit Data Karyawan</h1>
                    <p className="text-muted-foreground">
                        Perbarui informasi karyawan <strong>{employee.full_name}</strong>
                    </p>
                </div>
                <FormEmployeeEditWizard employee={employee} />
            </div>
        </AppLayout>
    );
}
