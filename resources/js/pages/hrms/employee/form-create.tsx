import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import FormEmployeeWizard from './FormEmployeeWizard';

const breadcrumbs = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Karyawan',
        href: route('hrms.employees.index'),
    },
    {
        title: 'Tambah Karyawan',
        href: route('hrms.employees.create'),
    },
];

export default function EmployeeFormCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Karyawan" />
            <div className="flex h-full flex-1 flex-col items-center gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mx-auto flex w-full max-w-2xl items-start justify-start">
                    <Link href={route('hrms.employees.index')}>
                        <Button variant={'outline'}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                </div>
                <div className="mt-4 flex flex-col items-center gap-2">
                    <h1 className="text-2xl font-bold">Formulir Pembuatan Karyawan</h1>
                    <p className="text-muted-foreground">Isi formulir di bawah ini untuk menambahkan karyawan baru ke sistem.</p>
                </div>
                <FormEmployeeWizard />
            </div>
        </AppLayout>
    );
}
