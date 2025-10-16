import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Check, ChevronsUpDown, Search, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/* ---- shadcn combobox primitives ---- */
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Employee {
    id: number;
    employee_code: string;
    full_name: string;
    outsourcing_field_id: number;
    position?: { name: string };
    level?: { name: string };
    outsource_field?: { name: string };
}

interface Project {
    id: number;
    name: string;
    code: string;
    outsourcing_field_id: number | null;
    outsource_field?: { name: string };
}

interface Masters {
    projects: Project[];
    outsourcing_fields: { id: number; name: string }[];
    employees: Employee[];
}

interface Props {
    masters: Masters;
    selected_project_id?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Penugasan Karyawan', href: route('crm.employee-projects.index') },
    { title: 'Tugaskan Karyawan', href: route('crm.employee-projects.create') },
];

/* =============================== */
/* Combobox components (reusable)  */
/* =============================== */

type Option = { value: string; label: string; hint?: string };

function ProjectCombobox({
    options,
    value,
    onChange,
    placeholder = 'Pilih Projek',
}: {
    options: Option[];
    value?: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const selected = options.find((o) => o.value === value);
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className={cn(
                    'w-full justify-between text-left',
                    'h-auto !min-h-[52px] items-center px-3 py-2', // bikin lega utk 2 baris
                )}>
                    <div className="min-h-[2.5rem] flex-1 truncate">
                        {selected ? (
                            <>
                                <div className="truncate font-medium">{selected.label}</div>
                                {selected.hint && <div className="truncate text-xs text-muted-foreground">{selected.hint}</div>}
                            </>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Cari projek..." />
                    <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => (
                                <CommandItem
                                    key={opt.value}
                                    value={`${opt.label} ${opt.hint ?? ''}`}
                                    onSelect={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                    }}
                                    className="flex items-start gap-2 py-2"
                                >
                                    <Check className={'mt-0.5 h-4 w-4 ' + (opt.value === value ? 'opacity-100' : 'opacity-0')} />
                                    <div className="min-w-0">
                                        <div className="truncate font-medium">{opt.label}</div>
                                        {opt.hint && <div className="truncate text-xs text-muted-foreground">{opt.hint}</div>}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function SimpleCombobox({
    options,
    value,
    onChange,
    placeholder = 'Pilih opsi',
    searchPlaceholder = 'Cari...',
}: {
    options: Option[];
    value?: string;
    onChange: (v: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
}) {
    const selected = options.find((o) => o.value === value);
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'w-full justify-between text-left',
                        'h-auto !min-h-[52px] items-start px-3 py-2', // bikin lega utk 2 baris
                    )}
                >
                    <span className="truncate">{selected ? selected.label : <span className="text-muted-foreground">{placeholder}</span>}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => (
                                <CommandItem
                                    key={opt.value}
                                    value={opt.label}
                                    onSelect={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={'mr-2 h-4 w-4 ' + (opt.value === value ? 'opacity-100' : 'opacity-0')} />
                                    {opt.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

/* =============================== */
/* Page                            */
/* =============================== */

export default function EmployeeProjectCreate({ masters, selected_project_id }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        project_id: selected_project_id || '',
        employee_ids: [] as number[],
    });

    const [availableEmployees, setAvailableEmployees] = useState<Employee[]>(masters.employees || []);
    const [outsourcingFieldFilter, setOutsourcingFieldFilter] = useState('');
    const [selectAll, setSelectAll] = useState(false);

    const projectsOptions: Option[] = useMemo(
        () =>
            masters.projects.map((p) => ({
                value: String(p.id),
                label: p.name,
                hint: `${p.code} • ${p.outsource_field?.name ?? 'Semua Bidang'}`,
            })),
        [masters.projects],
    );

    const fieldsOptions: Option[] = useMemo(
        () => masters.outsourcing_fields.map((f) => ({ value: String(f.id), label: f.name })),
        [masters.outsourcing_fields],
    );

    const selectedProject = data.project_id ? masters.projects.find((p) => p.id.toString() === data.project_id) || null : null;

    // Load employees when project or field filter changes
    useEffect(() => {
        if (data.project_id) {
            loadEmployees(data.project_id, outsourcingFieldFilter);
        } else {
            setAvailableEmployees([]);
        }
    }, [data.project_id, outsourcingFieldFilter]);

    const loadEmployees = async (projectId: string, outsourcingFieldId?: string) => {
        try {
            const params = new URLSearchParams({
                project_id: projectId,
                ...(outsourcingFieldId ? { outsourcing_field_id: outsourcingFieldId } : {}),
            });
            const response = await fetch(route('crm.api.employees') + '?' + params);
            const result = await response.json();
            setAvailableEmployees(result.employees || []);
        } catch (error) {
            console.error('Error loading employees:', error);
            setAvailableEmployees([]);
        }
    };

    const handleProjectChange = (projectId: string) => {
        setData('project_id', projectId);
        setData('employee_ids', []); // reset
        setSelectAll(false);
        setOutsourcingFieldFilter('');
    };

    const handleEmployeeToggle = (employeeId: number) => {
        const cur = data.employee_ids;
        if (cur.includes(employeeId)) {
            setData(
                'employee_ids',
                cur.filter((id) => id !== employeeId),
            );
        } else {
            setData('employee_ids', [...cur, employeeId]);
        }
        setSelectAll(false);
    };

    const handleSelectAllToggle = () => {
        if (selectAll) {
            setData('employee_ids', []);
        } else {
            setData(
                'employee_ids',
                availableEmployees.map((e) => e.id),
            );
        }
        setSelectAll(!selectAll);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('crm.employee-projects.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tugaskan Karyawan ke Projek" />

            <div className="flex h-full flex-1 flex-col items-center gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mx-auto flex w-full max-w-6xl items-start justify-start">
                    <Link href={route('crm.employee-projects.index')}>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                </div>

                <div className="mt-4 flex flex-col items-center gap-2">
                    <h1 className="text-2xl font-bold">Tugaskan Karyawan ke Projek</h1>
                    <p className="text-muted-foreground">Pilih projek dan karyawan yang akan ditugaskan</p>
                </div>

                <div className="w-full max-w-6xl">
                    <form onSubmit={submit} className="space-y-6">
                        {/* Project Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Pilih Projek
                                </CardTitle>
                                <CardDescription>Pilih projek yang akan menerima penugasan karyawan</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Projek</Label>
                                    <ProjectCombobox
                                        options={projectsOptions}
                                        value={data.project_id}
                                        onChange={handleProjectChange}
                                        placeholder="Pilih Projek"
                                    />
                                    <InputError message={errors.project_id} />
                                </div>

                                {selectedProject && (
                                    <div className="rounded-lg bg-muted p-4">
                                        <h4 className="font-medium">Informasi Projek</h4>
                                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Kode:</span> {selectedProject.code}
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Bidang:</span>{' '}
                                                {selectedProject.outsource_field?.name || 'Semua Bidang'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Employee Selection */}
                        {data.project_id && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Pilih Karyawan
                                    </CardTitle>
                                    <CardDescription>Pilih karyawan yang akan ditugaskan ke projek ini</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Filter Bidang (hanya jika projek tidak mengunci bidang) */}
                                    {!selectedProject?.outsourcing_field_id && (
                                        <div className="space-y-2">
                                            <Label>Filter Bidang Outsourcing</Label>
                                            <SimpleCombobox
                                                options={fieldsOptions}
                                                value={outsourcingFieldFilter || undefined}
                                                onChange={setOutsourcingFieldFilter}
                                                placeholder="Semua Bidang"
                                                searchPlaceholder="Cari bidang…"
                                            />
                                        </div>
                                    )}

                                    {availableEmployees.length > 0 && (
                                        <div className="flex items-center gap-2 border-b pb-4">
                                            <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAllToggle} />
                                            <Label htmlFor="select-all" className="font-medium">
                                                Pilih Semua ({availableEmployees.length} karyawan)
                                            </Label>
                                        </div>
                                    )}

                                    {/* Employee list */}
                                    <div className="max-h-96 space-y-2 overflow-y-auto">
                                        {availableEmployees.length === 0 ? (
                                            <div className="py-8 text-center text-muted-foreground">
                                                {data.project_id
                                                    ? 'Tidak ada karyawan yang tersedia untuk projek ini'
                                                    : 'Pilih projek terlebih dahulu'}
                                            </div>
                                        ) : (
                                            availableEmployees.map((emp) => {
                                                const checked = data.employee_ids.includes(emp.id);
                                                return (
                                                    <label
                                                        key={emp.id}
                                                        htmlFor={`emp-${emp.id}`}
                                                        className={[
                                                            'flex cursor-pointer items-center gap-3 rounded-lg border p-3 m-2 transition',
                                                            'hover:bg-muted/50',
                                                            checked ? 'ring-2 ring-primary/40' : '',
                                                        ].join(' ')}
                                                    >
                                                        <Checkbox
                                                            id={`emp-${emp.id}`}
                                                            checked={checked}
                                                            onCheckedChange={() => handleEmployeeToggle(emp.id)}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-medium">{emp.full_name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {emp.employee_code} • {emp.position?.name} • {emp.level?.name} •{' '}
                                                                {emp.outsource_field?.name}
                                                            </div>
                                                        </div>
                                                        <Search className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>

                                    <InputError message={errors.employee_ids} />

                                    {data.employee_ids.length > 0 && (
                                        <div className="rounded-lg bg-muted p-4">
                                            <p className="font-medium">{data.employee_ids.length} karyawan dipilih untuk ditugaskan</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Submit */}
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                type="submit"
                                disabled={processing || !data.project_id || data.employee_ids.length === 0}
                                className="w-full md:w-auto"
                            >
                                {processing ? 'Menyimpan...' : `Tugaskan ${data.employee_ids.length} Karyawan`}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
