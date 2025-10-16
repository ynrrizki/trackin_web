import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeFormStepProps } from '@/types/employee';
import { useEffect, useState } from 'react';

interface MasterData {
    positions: Array<{ id: number; name: string }>;
    position_levels: Array<{ id: number; name: string }>;
    departments: Array<{ id: number; name: string }>;
    employment_statuses: Array<{ id: number; name: string }>;
    employee_types: Array<{ id: number; name: string }>;
    outsourcing_fields: Array<{ id: number; name: string }>;
}

export default function EmploymentDataStep({ form, errors, setData }: EmployeeFormStepProps) {
    const [masterData, setMasterData] = useState<MasterData | null>(null);
    const [loadingStates, setLoadingStates] = useState({
        positions: true,
        position_levels: true,
        departments: true,
        employment_statuses: true,
        employee_types: true,
        outsourcing_fields: true,
    });
    const [error, setError] = useState<string | null>(null);

    // Component untuk Select dengan loading state yang lebih smooth
    const LoadingSelect = ({
        loading,
        placeholder,
        loadingText,
        value,
        onValueChange,
        items,
        disabled,
    }: {
        loading: boolean;
        placeholder: string;
        loadingText: string;
        value: string;
        onValueChange: (value: string) => void;
        items: Array<{ id: number; name: string }>;
        disabled?: boolean;
    }) => (
        <Select value={value} onValueChange={onValueChange} disabled={loading || disabled}>
            <SelectTrigger className={loading ? 'animate-pulse' : ''}>
                <SelectValue placeholder={loading ? loadingText : placeholder} />
            </SelectTrigger>
            <SelectContent>
                {loading ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
                ) : items.length > 0 ? (
                    items.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                            {item.name}
                        </SelectItem>
                    ))
                ) : (
                    <div className="p-2 text-center text-sm text-muted-foreground">No data available</div>
                )}
            </SelectContent>
        </Select>
    );

    useEffect(() => {
        // Fetch master data
        fetch('/api/master-data/employee-form')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch master data');
                }
                return response.json();
            })
            .then((data) => {
                // Handle response format from Laravel controller
                const responseData = data.success ? data.data : data;
                setMasterData(responseData);
                setLoadingStates({
                    positions: false,
                    position_levels: false,
                    departments: false,
                    employment_statuses: false,
                    employee_types: false,
                    outsourcing_fields: false,
                });
            })
            .catch((err) => {
                setError(err.message);
                setLoadingStates({
                    positions: false,
                    position_levels: false,
                    departments: false,
                    employment_statuses: false,
                    employee_types: false,
                    outsourcing_fields: false,
                });
            });
    }, []);

    // Check if selected employee type is outsourcing
    const selectedEmployeeType = masterData?.employee_types?.find((type) => type.id.toString() === form.employee_type_id);
    const isOutsourcing =
        selectedEmployeeType?.name?.toLowerCase().includes('outsourcing') ||
        selectedEmployeeType?.name?.toLowerCase().includes('kontrak') ||
        selectedEmployeeType?.name?.toLowerCase().includes('external');

    // Auto-clear fields when employee type changes
    useEffect(() => {
        if (form.employee_type_id && selectedEmployeeType) {
            if (isOutsourcing) {
                // Clear internal fields when switching to outsourcing
                if (form.position_id) setData('position_id', '');
                if (form.department_id) setData('department_id', '');
            } else {
                // Clear outsourcing fields when switching to internal
                if (form.outsourcing_field_id) setData('outsourcing_field_id', '');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOutsourcing, form.employee_type_id]);

    return (
        <>
            {/* Error banner hanya jika ada error */}
            {error && (
                <div className="mb-4 rounded-md bg-destructive/15 p-3">
                    <div className="text-sm text-destructive">Error loading master data: {error}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Please refresh the page or contact administrator</div>
                </div>
            )}

            {/* Section 1: Informasi Dasar Kepegawaian */}
            <div className="space-y-4">
                <div className="border-b pb-2">
                    <h3 className="text-lg font-medium">Informasi Dasar Kepegawaian</h3>
                    <p className="text-sm text-muted-foreground">Data dasar karyawan dan tanggal penting</p>
                </div>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="employee_code">NIP / Employee Code (Opsional)</Label>
                        <Input
                            id="employee_code"
                            name="employee_code"
                            value={form.employee_code || ''}
                            onChange={(e) => setData('employee_code', e.target.value)}
                            placeholder="Akan di-generate otomatis jika kosong"
                        />
                        <InputError message={errors.employee_code} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="join_date" className="after:ml-1 after:text-red-500 after:content-['*']">
                                Tanggal Masuk
                            </Label>
                            <Input
                                id="join_date"
                                type="date"
                                name="join_date"
                                value={form.join_date || ''}
                                onChange={(e) => setData('join_date', e.target.value)}
                                required
                            />
                            <InputError message={errors.join_date} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="end_date">Tanggal Berakhir (Opsional)</Label>
                            <Input
                                id="end_date"
                                type="date"
                                name="end_date"
                                value={form.end_date || ''}
                                onChange={(e) => setData('end_date', e.target.value)}
                            />
                            <InputError message={errors.end_date} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Kategori Karyawan */}
            <div className="space-y-4">
                <div className="border-b pb-2">
                    <h3 className="text-lg font-medium">Kategori Karyawan</h3>
                    <p className="text-sm text-muted-foreground">Pilih tipe karyawan dan status kepegawaian</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="employee_type_id" className="after:ml-1 after:text-red-500 after:content-['*']">
                            Tipe Karyawan
                        </Label>
                        <LoadingSelect
                            loading={loadingStates.employee_types}
                            placeholder="Pilih Tipe"
                            loadingText="Loading tipe..."
                            value={form.employee_type_id || ''}
                            onValueChange={(val) => setData('employee_type_id', val)}
                            items={masterData?.employee_types || []}
                        />
                        <InputError message={errors.employee_type_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="employment_status_id" className="after:ml-1 after:text-red-500 after:content-['*']">
                            Status Kepegawaian
                        </Label>
                        <LoadingSelect
                            loading={loadingStates.employment_statuses}
                            placeholder="Pilih Status"
                            loadingText="Loading status..."
                            value={form.employment_status_id || ''}
                            onValueChange={(val) => setData('employment_status_id', val)}
                            items={masterData?.employment_statuses || []}
                        />
                        <InputError message={errors.employment_status_id} />
                    </div>
                </div>
            </div>

            {/* Section 3: Informasi Posisi & Departemen */}
            {form.employee_type_id && (
                <div className="space-y-4">
                    <div className="border-b pb-2">
                        <h3 className="text-lg font-medium">{isOutsourcing ? 'Informasi Outsourcing' : 'Informasi Posisi & Departemen'}</h3>
                        <p className="text-sm text-muted-foreground">
                            {isOutsourcing ? 'Detail bidang outsourcing dan level posisi' : 'Posisi, level, dan departemen karyawan internal'}
                        </p>
                        {/* Badge indicator */}
                        <div className="mt-2">
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    isOutsourcing ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                }`}
                            >
                                {isOutsourcing ? '🏢 Outsourcing' : '🏛️ Internal'}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {/* Level Posisi - ditampilkan untuk semua tipe */}
                        <div className="grid gap-2">
                            <Label htmlFor="level_id" className="after:ml-1 after:text-red-500 after:content-['*']">
                                Level Posisi
                            </Label>
                            <LoadingSelect
                                loading={loadingStates.position_levels}
                                placeholder="Pilih Level"
                                loadingText="Loading level..."
                                value={form.level_id || ''}
                                onValueChange={(val) => setData('level_id', val)}
                                items={masterData?.position_levels || []}
                            />
                            <InputError message={errors.level_id} />
                        </div>

                        {!isOutsourcing ? (
                            // Karyawan Internal - tampilkan Posisi dan Departemen
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="position_id" className="after:ml-1 after:text-red-500 after:content-['*']">
                                        Posisi
                                    </Label>
                                    <LoadingSelect
                                        loading={loadingStates.positions}
                                        placeholder="Pilih Posisi"
                                        loadingText="Loading posisi..."
                                        value={form.position_id || ''}
                                        onValueChange={(val) => setData('position_id', val)}
                                        items={masterData?.positions || []}
                                    />
                                    <InputError message={errors.position_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="department_id" className="after:ml-1 after:text-red-500 after:content-['*']">
                                        Departemen
                                    </Label>
                                    <LoadingSelect
                                        loading={loadingStates.departments}
                                        placeholder="Pilih Departemen"
                                        loadingText="Loading departemen..."
                                        value={form.department_id || ''}
                                        onValueChange={(val) => setData('department_id', val)}
                                        items={masterData?.departments || []}
                                    />
                                    <InputError message={errors.department_id} />
                                </div>
                            </div>
                        ) : (
                            // Karyawan Outsourcing - tampilkan Bidang Outsourcing
                            <div className="grid gap-2">
                                <Label htmlFor="outsourcing_field_id" className="after:ml-1 after:text-red-500 after:content-['*']">
                                    Bidang Outsourcing
                                </Label>
                                <LoadingSelect
                                    loading={loadingStates.outsourcing_fields}
                                    placeholder="Pilih Bidang Outsourcing"
                                    loadingText="Loading bidang..."
                                    value={form.outsourcing_field_id || ''}
                                    onValueChange={(val) => setData('outsourcing_field_id', val)}
                                    items={masterData?.outsourcing_fields || []}
                                />
                                <InputError message={errors.outsourcing_field_id} />
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Input Approval Line */}
            <div className="mt-6 grid gap-2">
                <Label htmlFor="approval_line">Approval Line</Label>
                <Input
                    id="approval_line"
                    name="approval_line"
                    type="text"
                    placeholder="Masukkan approval line (opsional)"
                    value={form.approval_line || ''}
                    onChange={(e) => setData('approval_line', e.target.value)}
                />
                <InputError message={errors.approval_line} />
            </div>
        </>
    );
}
