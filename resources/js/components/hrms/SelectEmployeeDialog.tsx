import { useVirtualizer } from '@tanstack/react-virtual';
import axios from 'axios';
import { ChevronsDownUp, Filter, Plus, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { cn } from '@/lib/utils';
import type { Employee as BaseEmployee } from '@/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';

/* =========================================================================================
 * Types
 * =======================================================================================*/

export type PickerEmployee = BaseEmployee & {
    employee_type?: { name?: string } | null; // optional, kalau ada
};

export interface SelectEmployeeDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;

    // daftar yang sedang terpilih (kendali parent)
    value: PickerEmployee[];
    onChange: (next: PickerEmployee[]) => void;

    // optional
    multiple?: boolean;
    maxSelect?: number;
    disabledIds?: number[];

    labels?: Partial<{
        title: string;
        selectAll: string;
        clearSelection: string;
        cancel: string;
        select: string;
        emptyRightTitle: string;
        emptyRightDesc: string;
    }>;

    className?: string;
}

/* =========================================================================================
 * Remote Employees (pagination + filter + search)
 * =======================================================================================*/

function useRemoteEmployees(enabled: boolean, filters: Record<string, string>, search: string) {
    const [data, setData] = useState<PickerEmployee[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [debouncedSearch] = useDebounce(search, 400);

    const reset = useCallback(() => {
        setData([]);
        setTotal(0);
        setPage(1);
        setHasMore(true);
    }, []);

    const filterSignature = useMemo(
        () =>
            Object.entries(filters)
                .filter(([, v]) => !!v)
                .sort()
                .map(([k, v]) => `${k}:${v}`)
                .join('|'),
        [filters],
    );

    useEffect(() => {
        if (enabled) reset();
    }, [enabled, debouncedSearch, filterSignature, reset]);

    useEffect(() => {
        if (!enabled || !hasMore || loading) return;

        setLoading(true);
        const controller = new AbortController();

        const params: Record<string, string | number> = { page, per_page: 40 };
        if (debouncedSearch) params.search = debouncedSearch;
        Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));

        axios
            .get('/api/hrms/employees/picker', { params, signal: controller.signal })
            .then((res) => {
                const payload = res.data ?? {};
                const incoming: PickerEmployee[] = payload.data || [];
                setData((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
                setHasMore(payload.meta?.has_more ?? false);
                setTotal((prev) => payload.meta?.total ?? (page === 1 ? incoming.length : prev));
            })
            .catch((e) => {
                if (!axios.isCancel(e)) setError(e.message || 'Error');
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [enabled, hasMore, loading, page, debouncedSearch, filters]);

    const loadMore = useCallback(() => {
        if (hasMore && !loading) setPage((p) => p + 1);
    }, [hasMore, loading]);

    return { data, total, hasMore, loadMore, loading, error, reset, setPage };
}

/* =========================================================================================
 * Remote Filter Options
 * =======================================================================================*/

function useRemoteFilterOptions(open: boolean, search: string) {
    const [options, setOptions] = useState<Record<string, { id: number; name: string }[]>>({});
    const [loading, setLoading] = useState(false);
    const [debouncedSearch] = useDebounce(search, 400);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        const controller = new AbortController();

        axios
            .get('/api/hrms/employees/picker/filters', {
                params: debouncedSearch ? { search: debouncedSearch } : {},
                signal: controller.signal,
            })
            .then((res) => setOptions(res.data || {}))
            .catch(() => {})
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [open, debouncedSearch]);

    return { options, loading };
}

/* =========================================================================================
 * Main Component
 * =======================================================================================*/

const SelectEmployeeDialog: React.FC<SelectEmployeeDialogProps> = ({
    open,
    onOpenChange,
    value,
    onChange,
    multiple = true,
    maxSelect,
    disabledIds = [],
    labels,
    className,
}) => {
    // server filters
    const [filters, setFilters] = useState<{ [k: string]: string }>({
        position: '',
        department: '',
        position_level: '',
        employment_status: '',
        employee_type: '',
        outsource_field: '',
    });

    const [searchLeft, setSearchLeft] = useState('');
    const [searchRight, setSearchRight] = useState('');

    const { data: remoteEmployees, total, hasMore, loadMore, loading } = useRemoteEmployees(open, filters, searchLeft);

    const showList = remoteEmployees;

    const selectedIds = useMemo(() => new Set(value.map((e) => e.id)), [value]);
    const disabledIdSet = useMemo(() => new Set(disabledIds), [disabledIds]);

    // virtualizer
    const parentRef = useRef<HTMLDivElement | null>(null);
    const rowVirtualizer = useVirtualizer({
        count: showList.length + (hasMore ? 1 : 0),
        getScrollElement: () => parentRef.current,
        estimateSize: () => 68,
        overscan: 8,
    });

    // infinite scroll trigger
    useEffect(() => {
        const items = rowVirtualizer.getVirtualItems();
        if (!items.length) return;
        const last = items[items.length - 1];
        if (last.index >= showList.length - 1 && hasMore && !loading) {
            loadMore();
        }
    }, [rowVirtualizer, showList.length, hasMore, loading, loadMore]);

    // keyboard navigation
    const [activeIndex, setActiveIndex] = useState(0);
    useEffect(() => {
        setActiveIndex(0);
    }, [searchLeft, filters, open]);

    const onListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!showList.length) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, showList.length - 1));
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            const emp = showList[activeIndex];
            if (emp) addEmployee(emp);
        }
    };

    const rightSearchFilter = useCallback(
        (list: PickerEmployee[]) => {
            if (!searchRight) return list;
            const q = searchRight.toLowerCase();
            return list.filter((e) => e.full_name.toLowerCase().includes(q) || (e.employee_code || '').toLowerCase().includes(q));
        },
        [searchRight],
    );

    const canSelectMore = maxSelect ? value.length < maxSelect : true;

    // semua hasil (yang LOADED) sudah kepilih?
    const allLoadedSelected = showList.length > 0 && showList.every((e) => selectedIds.has(e.id));

    // toggle select all (mencoba endpoint /ids; fallback loaded only)
    const toggleSelectAll = async () => {
        if (!multiple) return;

        if (allLoadedSelected) {
            const ids = new Set(showList.map((e) => e.id));
            onChange(value.filter((v) => !ids.has(v.id)));
            return;
        }

        try {
            const params = { ...filters, search: searchLeft };
            const { data } = await axios.get<{ ids: number[] }>('/api/hrms/employees/picker/ids', {
                params,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            const idSet = new Set<number>(data?.ids || []);
            const map = new Map<number, PickerEmployee>();
            value.forEach((v) => map.set(v.id, v));
            // masukkan dari cache loaded yang match id
            showList.forEach((e) => idSet.has(e.id) && map.set(e.id, e));
            onChange(Array.from(map.values()));
        } catch {
            // fallback: loaded only
            const map = new Map<number, PickerEmployee>();
            value.forEach((v) => map.set(v.id, v));
            showList.forEach((e) => map.set(e.id, e));
            onChange(Array.from(map.values()));
        }
    };

    const addEmployee = (emp: PickerEmployee) => {
        if (disabledIdSet.has(emp.id)) return;
        if (multiple) {
            if (selectedIds.has(emp.id)) return;
            if (!canSelectMore) return;
            onChange([...value, emp]);
        } else {
            onChange([emp]);
            onOpenChange(false);
        }
    };

    const removeEmployee = (id: number) => onChange(value.filter((v) => v.id !== id));

    const clearSelection = () => onChange([]);

    const submit = () => {
        // single mode sudah close saat klik item
        if (multiple) onOpenChange(false);
    };

    const resetFilters = () =>
        setFilters({
            position: '',
            department: '',
            position_level: '',
            employment_status: '',
            employee_type: '',
            outsource_field: '',
        });

    const applyFilterValue = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));

    const [showFilter, setShowFilter] = useState(false);
    useEffect(() => {
        if (!open) setShowFilter(false);
    }, [open]);

    const activeFilterCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

    const label = (k: keyof NonNullable<SelectEmployeeDialogProps['labels']>, fallback: string) => labels?.[k] || fallback;

    return (
        <Dialog open={open} onOpenChange={onOpenChange} modal>
            <DialogContent className={cn('!w-[1180px] !max-w-[96vw] gap-0 p-0', 'overflow-hidden', className)}>
                <DialogHeader className="sticky top-0 z-20 bg-background px-6 pt-5 pb-2">
                    <DialogTitle>{label('title', 'Select employee')}</DialogTitle>
                </DialogHeader>

                <div className="flex h-[72vh] divide-x">
                    {/* LEFT: source list */}
                    <div className="flex w-1/2 flex-col">
                        <ToolbarLeft
                            total={total}
                            shown={showList.length}
                            search={searchLeft}
                            onSearch={setSearchLeft}
                            onFilter={() => setShowFilter(true)}
                            multiple={multiple}
                            allSelected={allLoadedSelected}
                            onToggleAll={toggleSelectAll}
                            activeFilterCount={activeFilterCount}
                        />
                        <div
                            ref={parentRef}
                            className="flex-1 overflow-auto outline-none"
                            role="listbox"
                            aria-multiselectable={multiple}
                            tabIndex={0}
                            onKeyDown={onListKeyDown}
                        >
                            <div
                                style={{
                                    height: rowVirtualizer.getTotalSize(),
                                    position: 'relative',
                                }}
                            >
                                {rowVirtualizer.getVirtualItems().map((vi) => {
                                    // skeleton row
                                    if (vi.index >= showList.length) {
                                        return (
                                            <div
                                                key={vi.key}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    transform: `translateY(${vi.start}px)`,
                                                }}
                                            >
                                                <SkeletonRow />
                                            </div>
                                        );
                                    }

                                    const emp = showList[vi.index];

                                    const disabled =
                                        disabledIdSet.has(emp.id) ||
                                        (!multiple && selectedIds.size > 0 && !selectedIds.has(emp.id)) ||
                                        (!canSelectMore && !selectedIds.has(emp.id));

                                    return (
                                        <EmployeeRow
                                            key={emp.id}
                                            employee={emp}
                                            selected={selectedIds.has(emp.id)}
                                            disabled={disabled}
                                            onAdd={() => addEmployee(emp)}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                transform: `translateY(${vi.start}px)`,
                                            }}
                                            className={cn(activeIndex === vi.index && 'ring-2 ring-primary/40')}
                                        />
                                    );
                                })}

                                {showList.length === 0 && !loading && <div className="p-6 text-sm text-muted-foreground">No employee found</div>}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: selected list */}
                    <div className="flex w-1/2 flex-col">
                        <ToolbarRight
                            count={value.length}
                            search={searchRight}
                            onSearch={setSearchRight}
                            onClear={clearSelection}
                            clearLabel={label('clearSelection', 'Clear selection')}
                        />
                        <div className="flex-1 overflow-auto">
                            <div role="listbox" aria-label="Selected employees">
                                {rightSearchFilter(value).length === 0 ? (
                                    <div className="space-y-2 p-6 text-center text-sm text-muted-foreground">
                                        <p className="font-medium">{label('emptyRightTitle', 'No employee selected')}</p>
                                        <p className="text-xs">
                                            {label('emptyRightDesc', 'You must select at least one from employee list from the sidebar.')}
                                        </p>
                                    </div>
                                ) : (
                                    rightSearchFilter(value).map((emp) => (
                                        <SelectedRow key={emp.id} employee={emp} onRemove={() => removeEmployee(emp.id)} />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                <DialogFooter className="gap-2 px-6 py-4">
                    <div className="mr-auto text-xs text-muted-foreground">
                        Selected: <span className="font-medium">{value.length}</span>
                    </div>

                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {label('cancel', 'Cancel')}
                    </Button>
                    <Button onClick={submit} className="min-w-40" autoFocus disabled={multiple && value.length === 0}>
                        {label('select', 'Select employee')}
                    </Button>
                </DialogFooter>

                <RemoteFilterSheet
                    open={showFilter}
                    onOpenChange={setShowFilter}
                    filters={filters}
                    onChange={applyFilterValue}
                    onReset={resetFilters}
                />
            </DialogContent>
        </Dialog>
    );
};

export default SelectEmployeeDialog;

/* =========================================================================================
 * Subcomponents
 * =======================================================================================*/

interface ToolbarLeftProps {
    total: number;
    shown: number;
    search: string;
    onSearch: (v: string) => void;
    onFilter: () => void;
    multiple: boolean;
    allSelected: boolean;
    onToggleAll: () => void;
    activeFilterCount: number;
}

const ToolbarLeft: React.FC<ToolbarLeftProps> = ({
    total,
    shown,
    search,
    onSearch,
    onFilter,
    multiple,
    allSelected,
    onToggleAll,
    activeFilterCount,
}) => {
    return (
        <div className="flex items-center gap-2 border-b px-4 py-2 text-xs">
            <div className="flex flex-1 flex-col">
                <div className="font-medium">
                    View {shown} of {total} employee(s)
                </div>
                {multiple && (
                    <button
                        type="button"
                        onClick={onToggleAll}
                        className="w-max text-primary hover:underline disabled:opacity-40"
                        disabled={shown === 0}
                    >
                        {allSelected ? 'Unselect all' : 'Select all'}
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Input placeholder="Search employee" value={search} onChange={(e) => onSearch(e.target.value)} className="h-8 w-52" />
                <Button variant="outline" size="sm" onClick={onFilter} className="relative">
                    <Filter className="mr-1 h-3.5 w-3.5" /> Filter
                    {activeFilterCount > 0 && (
                        <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            {activeFilterCount} selected
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
};

interface ToolbarRightProps {
    count: number;
    search: string;
    onSearch: (v: string) => void;
    onClear: () => void;
    clearLabel: string;
}
const ToolbarRight: React.FC<ToolbarRightProps> = ({ count, search, onSearch, onClear, clearLabel }) => {
    return (
        <div className="flex items-center gap-2 border-b px-4 py-2 text-xs">
            <div className="flex flex-1 flex-col">
                <div className="font-medium">{count} employee(s) selected</div>
                <button type="button" onClick={onClear} className="w-max text-primary hover:underline disabled:opacity-40" disabled={count === 0}>
                    {clearLabel}
                </button>
            </div>
            <Input placeholder="Search employee" value={search} onChange={(e) => onSearch(e.target.value)} className="h-8 w-52" />
        </div>
    );
};

interface EmployeeRowProps {
    employee: PickerEmployee;
    selected: boolean;
    disabled: boolean;
    onAdd: () => void;
    style?: React.CSSProperties;
    className?: string;
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({ employee, selected, disabled, onAdd, style, className }) => {
    const initials = employee.full_name
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase();

    const handleActivate = useCallback(() => {
        if (!disabled) onAdd();
    }, [disabled, onAdd]);

    return (
        <div
            style={style}
            role="option"
            aria-selected={selected}
            tabIndex={0}
            onClick={handleActivate}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleActivate();
                }
            }}
            className={cn(
                'group flex cursor-pointer items-center gap-3 border-b px-4 py-3 text-sm outline-none',
                'hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring',
                selected && 'bg-muted/60',
                disabled && 'cursor-not-allowed opacity-50',
                className,
            )}
        >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary uppercase">
                {initials}
            </div>

            <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{employee.full_name}</div>
                <div className="truncate text-[11px] text-muted-foreground">{employee.employee_code || '-'}</div>
            </div>

            {employee.employee_type?.name && (
                <Badge variant="outline" className="text-[10px] capitalize">
                    {employee.employee_type.name}
                </Badge>
            )}

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto h-7 w-7"
                disabled={disabled || selected}
                aria-label={selected ? 'Selected' : 'Add employee'}
                onClick={(e) => {
                    e.stopPropagation();
                    handleActivate();
                }}
            >
                {selected ? <ChevronsDownUp className="h-3.5 w-3.5 text-muted-foreground" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
        </div>
    );
};

interface SelectedRowProps {
    employee: PickerEmployee;
    onRemove: () => void;
}

const SelectedRow: React.FC<SelectedRowProps> = ({ employee, onRemove }) => {
    const initials = employee.full_name
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase();

    return (
        <div className="group flex items-center gap-3 border-b px-4 py-3 text-sm" role="option" aria-selected>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary uppercase">
                {initials}
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{employee.full_name}</div>
                <div className="truncate text-[11px] text-muted-foreground">{employee.employee_code || '-'}</div>
            </div>
            {employee.employee_type?.name && (
                <Badge variant="outline" className="text-[10px] capitalize">
                    {employee.employee_type.name}
                </Badge>
            )}
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={onRemove}
                aria-label="Remove employee"
            >
                <X className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
};

/* -----------------------------------------------------------------------------------------
 * Filter Sheet (remote options)
 * ---------------------------------------------------------------------------------------*/

interface RemoteFilterSheetProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    filters: { [k: string]: string };
    onChange: (k: string, v: string) => void;
    onReset: () => void;
}

const RemoteFilterSheet: React.FC<RemoteFilterSheetProps> = ({ open, onOpenChange, filters, onChange, onReset }) => {
    const { options, loading } = useRemoteFilterOptions(open, '');

    const fields: { key: string; label: string; optionKey: string }[] = [
        { key: 'position', label: 'Position', optionKey: 'position' },
        { key: 'department', label: 'Department', optionKey: 'department' },
        { key: 'position_level', label: 'Position Level', optionKey: 'position_level' },
        { key: 'employment_status', label: 'Employment Status', optionKey: 'employment_status' },
        { key: 'employee_type', label: 'Employee Type', optionKey: 'employee_type' },
        { key: 'outsource_field', label: 'Outsource Field', optionKey: 'outsource_field' },
    ];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-[320px] p-0">
                <SheetHeader className="border-b px-5 py-4">
                    <SheetTitle className="text-base">Filters</SheetTitle>
                </SheetHeader>

                <div className="flex h-[calc(100%-120px)] flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto">
                        <div className="space-y-5 px-5 py-4">
                            {loading && <div className="text-xs text-muted-foreground">Loading options...</div>}

                            {fields.map((f) => {
                                const opts = options[f.optionKey] as { id: number; name: string }[] | undefined;

                                return (
                                    <div key={f.key} className="flex flex-col gap-1 text-sm">
                                        <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                                        <select
                                            value={filters[f.key] || ''}
                                            onChange={(e) => onChange(f.key, e.target.value)}
                                            className="h-8 rounded-md border bg-background px-2 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        >
                                            <option value="">All</option>
                                            {(opts || []).map((opt) => (
                                                <option key={opt.id} value={String(opt.id)}>
                                                    {opt.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <SheetFooter className="flex flex-col gap-2 border-t px-5 py-3">
                        <div className="flex w-full gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={onReset}>
                                Reset filter
                            </Button>
                            <Button type="button" className="flex-1" onClick={() => onOpenChange(false)}>
                                Apply filter
                            </Button>
                        </div>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    );
};

/* -----------------------------------------------------------------------------------------
 * Skeleton row
 * ---------------------------------------------------------------------------------------*/

function SkeletonRow() {
    return (
        <div className="animate-pulse px-4 py-3">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-muted" />
                    <div className="h-2 w-1/5 rounded bg-muted/70" />
                </div>
                <div className="h-7 w-7 rounded bg-muted/70" />
            </div>
        </div>
    );
}
