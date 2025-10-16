import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import axios from 'axios';
import { useEffect, useState } from 'react';
import SelectEmployeeDialog, { PickerEmployee } from './SelectEmployeeDialogNew';
// Removed unused Badge import

export interface TransferSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employeeId?: number | null;
    employeeName?: string;
    historyMode?: boolean;
    onSwitchMode?: (history: boolean) => void;
}

export function TransferSheet({
    open,
    onOpenChange,
    employeeId: presetEmployeeId,
    employeeName: presetEmployeeName,
    historyMode = false,
    onSwitchMode,
}: TransferSheetProps) {
    // Single (preset) mode support
    const [employeeId, setEmployeeId] = useState<number | null>(presetEmployeeId ?? null);
    const [employeeName, setEmployeeName] = useState<string | undefined>(presetEmployeeName);
    // Multi selection (when no preset employee passed)
    const [pickerOpen, setPickerOpen] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState<PickerEmployee[]>([]);

    useEffect(() => {
        // sync when props change
        if (presetEmployeeId) {
            setEmployeeId(presetEmployeeId);
            setEmployeeName(presetEmployeeName);
        }
    }, [presetEmployeeId, presetEmployeeName]);

    const [form, setForm] = useState({
        type: 'transfer',
        to_position_id: '',
        to_level_id: '',
        to_department_id: '',
        to_shift_id: '',
        to_employment_status_id: '',
        effective_date: '',
        change_reason: '',
        approval_line: '',
    });

    // Master data options
    const [positions, setPositions] = useState<{ id: number; name: string }[]>([]);
    const [levels, setLevels] = useState<{ id: number; name: string }[]>([]);
    const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
    const [employmentStatuses, setEmploymentStatuses] = useState<{ id: number; name: string }[]>([]);
    const [loadingMaster, setLoadingMaster] = useState(false);
    const [masterLoaded, setMasterLoaded] = useState(false);

    useEffect(() => {
        if (open && !masterLoaded) {
            (async () => {
                setLoadingMaster(true);
                try {
                    const res = await axios.get('/master-data/employee-form');
                    const d = res.data?.data || {};
                    setPositions(d.positions || []);
                    setLevels(d.position_levels || []);
                    setDepartments(d.departments || []);
                    setEmploymentStatuses(d.employment_statuses || []);
                    setMasterLoaded(true);
                } catch {
                    /* ignore */
                } finally {
                    setLoadingMaster(false);
                }
            })();
        }
    }, [open, masterLoaded]);

    const atLeastOneChange = !!(form.to_position_id || form.to_level_id || form.to_department_id || form.to_shift_id || form.to_employment_status_id);
    const hasEmployees = presetEmployeeId ? !!employeeId : selectedEmployees.length > 0;

    const submitTransfer = async () => {
        if (!hasEmployees) return; // require selection first

        const targets = presetEmployeeId
            ? [{ id: employeeId!, name: employeeName }]
            : selectedEmployees.map((e) => ({ id: e.id, name: e.full_name }));

        // Execute sequentially to avoid server overload. Could be parallel with Promise.allSettled.
        for (const t of targets) {
            try {
                await axios.post(`/employees/${t.id}/transfers`, {
                    type: form.type,
                    to_position_id: form.to_position_id || null,
                    to_level_id: form.to_level_id || null,
                    to_department_id: form.to_department_id || null,
                    to_shift_id: form.to_shift_id || null,
                    to_employment_status_id: form.to_employment_status_id || null,
                    effective_date: form.effective_date || null,
                    change_reason: form.change_reason || null,
                    approval_line: form.approval_line || null,
                });
            } catch {
                // Simple continue; could collect errors.
                // console.error('Failed submit for', t.id, e);
            }
        }

        // Reset form (keep selected employees so user can reuse if needed)
        setForm({
            type: 'transfer',
            to_position_id: '',
            to_level_id: '',
            to_department_id: '',
            to_shift_id: '',
            to_employment_status_id: '',
            effective_date: '',
            change_reason: '',
            approval_line: '',
        });
        if (onSwitchMode && presetEmployeeId) onSwitchMode(true);
    };

    return (
        <>
            <SelectEmployeeDialog
                className="z-50"
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                value={selectedEmployees}
                onChange={setSelectedEmployees}
                multiple
                maxSelect={500}
            />
            <Sheet
                open={open}
                onOpenChange={(o) => {
                    onOpenChange(o);
                }}
            >
                <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
                    <SheetHeader>
                        <SheetTitle>Buat Transfer</SheetTitle>
                        <SheetDescription>
                            {employeeName && <span className="font-medium">{employeeName}</span>}{' '}
                            {historyMode ? 'Timeline perubahan & approval.' : 'Isi detail perubahan dan tanggal efektif.'}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                submitTransfer();
                            }}
                            className="space-y-4 text-sm"
                        >
                            <div className="grid grid-cols-2 gap-3 px-5">
                                {/* Employee selection */}
                                {/* <div className="col-span-2 space-y-1">
                                <Label>Karyawan</Label>
                                {presetEmployeeId ? (
                                    <Input value={employeeName || `ID: ${presetEmployeeId}`} disabled />
                                ) : (
                                    <div className="overflow-hidden rounded-md border">
                                        <Command shouldFilter={false}>
                                            <CommandInput value={employeeQuery} onValueChange={onSearchChange} placeholder="Cari nama atau NIP..." />
                                            <CommandList>
                                                <CommandEmpty>{searchLoading ? 'Mencari...' : 'Tidak ada hasil'}</CommandEmpty>
                                                <CommandGroup heading="Hasil">
                                                    {employeeOptions.map((opt) => (
                                                        <CommandItem
                                                            key={opt.id}
                                                            value={String(opt.id)}
                                                            onSelect={() => {
                                                                setEmployeeId(opt.id);
                                                                setEmployeeName(opt.full_name);
                                                            }}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{opt.full_name}</span>
                                                                <span className="text-[10px] text-muted-foreground">{opt.employee_code}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                        {employeeId && (
                                            <div className="flex items-center justify-between bg-muted/40 px-2 py-1 text-xs">
                                                <span className="truncate">Dipilih: {employeeName}</span>
                                                <button
                                                    type="button"
                                                    className="text-primary hover:underline"
                                                    onClick={() => {
                                                        setEmployeeId(null);
                                                        setEmployeeName(undefined);
                                                        setEmployeeQuery('');
                                                    }}
                                                >
                                                    Ganti
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div> */}
                                {/* Employee selection area */}
                                {presetEmployeeId ? (
                                    <div className="col-span-2 space-y-1">
                                        <Label>Karyawan</Label>
                                        <Input value={employeeName || `ID: ${presetEmployeeId}`} disabled />
                                    </div>
                                ) : (
                                    <div className="col-span-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="mb-0">Karyawan</Label>
                                            <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
                                                Pilih Karyawan
                                            </Button>
                                        </div>
                                        {selectedEmployees.length === 0 && (
                                            <div className="rounded-md border border-dashed p-3 text-center text-[11px] text-muted-foreground">
                                                Belum ada karyawan dipilih
                                            </div>
                                        )}
                                        {selectedEmployees.length > 0 && (
                                            <div className="flex flex-wrap gap-2 rounded-md border p-2">
                                                {selectedEmployees.map((emp) => (
                                                    <div
                                                        key={emp.id}
                                                        className="group flex items-center gap-1 rounded bg-muted px-2 py-1 text-[11px]"
                                                    >
                                                        <span className="max-w-[160px] truncate font-medium">{emp.full_name}</span>
                                                        <button
                                                            type="button"
                                                            className="opacity-60 transition hover:opacity-100"
                                                            onClick={() => setSelectedEmployees((prev) => prev.filter((e) => e.id !== emp.id))}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="col-span-2 space-y-1">
                                    <Label>Jenis</Label>
                                    <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih jenis" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="transfer">Transfer</SelectItem>
                                            <SelectItem value="mutation">Mutasi</SelectItem>
                                            <SelectItem value="rotation">Rotasi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Posisi Baru</Label>
                                    <Select
                                        value={form.to_position_id}
                                        onValueChange={(v) => setForm((f) => ({ ...f, to_position_id: v }))}
                                        disabled={loadingMaster}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingMaster ? 'Memuat...' : 'Pilih posisi'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {positions.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Level Baru</Label>
                                    <Select
                                        value={form.to_level_id}
                                        onValueChange={(v) => setForm((f) => ({ ...f, to_level_id: v }))}
                                        disabled={loadingMaster}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingMaster ? 'Memuat...' : 'Pilih level'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {levels.map((l) => (
                                                <SelectItem key={l.id} value={String(l.id)}>
                                                    {l.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label>Department Baru</Label>
                                    <Select
                                        value={form.to_department_id}
                                        onValueChange={(v) => setForm((f) => ({ ...f, to_department_id: v }))}
                                        disabled={loadingMaster}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingMaster ? 'Memuat...' : 'Pilih department'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((d) => (
                                                <SelectItem key={d.id} value={String(d.id)}>
                                                    {d.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Shift Baru</Label>
                                    <Input
                                        value={form.to_shift_id}
                                        onChange={(e) => setForm((f) => ({ ...f, to_shift_id: e.target.value }))}
                                        placeholder="ID Shift (opsional)"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Status Kerja Baru</Label>
                                    <Select
                                        value={form.to_employment_status_id}
                                        onValueChange={(v) => setForm((f) => ({ ...f, to_employment_status_id: v }))}
                                        disabled={loadingMaster}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingMaster ? 'Memuat...' : 'Pilih status kerja'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employmentStatuses.map((es) => (
                                                <SelectItem key={es.id} value={String(es.id)}>
                                                    {es.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label>Tanggal Efektif</Label>
                                    <Input
                                        type="date"
                                        value={form.effective_date}
                                        onChange={(e) => setForm((f) => ({ ...f, effective_date: e.target.value }))}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label>Approval Line (opsional)</Label>
                                    <Input
                                        value={form.approval_line}
                                        onChange={(e) => setForm((f) => ({ ...f, approval_line: e.target.value }))}
                                        placeholder="Kode manager (employee_code)"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label>Alasan</Label>
                                    <textarea
                                        className="min-h-[80px] w-full rounded-md border bg-background p-2 text-xs"
                                        value={form.change_reason}
                                        onChange={(e) => setForm((f) => ({ ...f, change_reason: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <SheetFooter className="flex gap-2 pt-2">
                                <Button type="submit" disabled={!hasEmployees || !atLeastOneChange}>
                                    Simpan
                                </Button>
                            </SheetFooter>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
