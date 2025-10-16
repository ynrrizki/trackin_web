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
    employee_type?: { name?: string } | null;
};

export interface SelectEmployeeDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    value: PickerEmployee[];
    onChange: (next: PickerEmployee[]) => void;
    multiple?: boolean;
    maxSelect?: number;
    disabledIds?: number[];
    labels?: Partial<{
        title: string;
        selectAll: string;
        unselectAll: string;
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
const PAGE_SIZE = 40;
const MAX_PAGES = 200; // guard kalau backend salah

interface MetaType {
    has_more?: boolean;
    next_page?: number | null;
    current_page?: number | null;
    last_page?: number | null;
    total?: number | null;
    per_page?: number | null;
}

function resolveHasMore(meta: MetaType, incomingLen: number, page: number): boolean {
    if (typeof meta?.has_more === 'boolean') return meta.has_more;
    if (meta?.next_page != null) return Boolean(meta.next_page);
    if (meta?.current_page != null && meta?.last_page != null) return meta.current_page < meta.last_page;
    if (meta?.total != null && (meta?.per_page || PAGE_SIZE)) {
        const per = Number(meta.per_page ?? PAGE_SIZE);
        return page * per < Number(meta.total);
    }
    // fallback: kalau panjang page penuh, asumsikan masih ada
    return incomingLen === PAGE_SIZE;
}

function useRemoteEmployees(enabled: boolean, filters: Record<string, string>, search: string) {
    const [data, setData] = useState<PickerEmployee[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [debouncedSearch] = useDebounce(search, 400);

    const filterSignature = useMemo(
        () =>
            Object.entries(filters)
                .filter(([, v]) => !!v)
                .sort()
                .map(([k, v]) => `${k}:${v}`)
                .join('|'),
        [filters],
    );

    // reset saat query/filters berubah
    useEffect(() => {
        if (!enabled) return;
        setData([]);
        setTotal(0);
        setPage(1);
        setHasMore(true);
    }, [enabled, debouncedSearch, filterSignature]);

    // fetch
    useEffect(() => {
        if (!enabled || !hasMore || loading) return;
        if (page > MAX_PAGES) {
            setHasMore(false);
            return;
        }

        console.log(`Fetching employees page ${page}...`);
        setLoading(true);
        // const controller = new AbortController();

        // const fetchEmployeePicker = async () => {
        //     const res = await axios.get('/hrms/employees/picker');
        //     console.log('Fetched employees:', res.data);
        //     return res.data;
        // }

        // fetchEmployeePicker();

        const params: Record<string, string | number> = { page, per_page: PAGE_SIZE };
        if (debouncedSearch) params.search = debouncedSearch;
        for (const [k, v] of Object.entries(filters)) if (v) params[k] = v;

        // axios
        //     .get('/hrms/employees/picker', { signal: controller.signal })
        //     .then((res) => {
        //         const payload = res.data ?? {};
        //         const incoming: PickerEmployee[] = payload.data ?? [];
        //         const meta = payload.meta ?? {};

        //         setData((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
        //         setHasMore(resolveHasMore(meta, incoming.length, page) && page < MAX_PAGES);
        //         setTotal((prev) => Number(meta.total ?? (page === 1 ? incoming.length : prev)));
        //         setError(null);
        //     })
        //     .catch((e) => {
        //         if (!axios.isCancel(e)) setError(e.message || 'Error');
        //     })
        //     .finally(() => setLoading(false));
        axios
            .get('/hrms/employees/picker', {
                params,
            })
            .then((res) => {
                const payload = res.data ?? {};
                const incoming: PickerEmployee[] = payload.data ?? [];
                const meta = payload.meta ?? {};

                setData((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
                setHasMore(resolveHasMore(meta, incoming.length, page) && page < MAX_PAGES);
                setTotal((prev) => Number(meta.total ?? (page === 1 ? incoming.length : prev)));
                setError(null);
            })
            .catch((e) => {
                if (!axios.isCancel(e)) setError(e.message || 'Error');
            })
            .finally(() => setLoading(false));

        // return () => controller.abort();
    }, [enabled, page, debouncedSearch, filters, hasMore, loading]);

    const loadMore = useCallback(() => {
        setPage((p) => (p < MAX_PAGES ? p + 1 : p));
    }, []);

    return { data, total, hasMore, loadMore, loading, error, page };
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
    const [filters, setFilters] = useState<Record<string, string>>({
        position: '',
        department: '',
        position_level: '',
        employment_status: '',
        employee_type: '',
        outsource_field: '',
    });

    const [searchLeft, setSearchLeft] = useState('');
    const [searchRight, setSearchRight] = useState('');

    const { data: remoteEmployees, total, hasMore, loadMore, loading, page } = useRemoteEmployees(open, filters, searchLeft);

    const showList = remoteEmployees;
    const selectedIds = useMemo(() => new Set(value.map((e) => e.id)), [value]);
    const disabledIdSet = useMemo(() => new Set(disabledIds), [disabledIds]);
    const canSelectMore = maxSelect ? value.length < maxSelect : true;

    /* ---------- Virtualizer ---------- */
    const parentRef = useRef<HTMLDivElement | null>(null);
    const rowVirtualizer = useVirtualizer({
        count: showList.length + (hasMore ? 1 : 0),
        getScrollElement: () => parentRef.current,
        estimateSize: () => 68,
        overscan: 4,
        getItemKey: (i) => (i < showList.length ? showList[i].id : 'loader'),
    });

    // Throttle loadMore agar tak terpanggil dobel
    const inflightRef = useRef(false);
    useEffect(() => {
        inflightRef.current = loading;
    }, [loading]);

    // infinite scroll: JANGAN panggil ketika list masih kosong (biarkan fetch page-1 yang jalan)
    useEffect(() => {
        if (!showList.length) return;
        const items = rowVirtualizer.getVirtualItems();
        if (!items.length) return;
        const last = items[items.length - 1];

        if (last.index >= showList.length - 1 && hasMore && !loading && !inflightRef.current) {
            inflightRef.current = true;
            loadMore();
        }
    }, [rowVirtualizer, showList.length, hasMore, loading, loadMore]);

    /* ---------- Actions ---------- */
    const addEmployee = useCallback(
        (emp: PickerEmployee) => {
            if (disabledIdSet.has(emp.id)) return;
            if (multiple) {
                if (selectedIds.has(emp.id)) return;
                if (!canSelectMore) return;
                onChange([...value, emp]);
            } else {
                onChange([emp]);
                onOpenChange(false);
            }
        },
        [disabledIdSet, multiple, selectedIds, canSelectMore, value, onChange, onOpenChange],
    );

    const removeEmployee = useCallback((id: number) => onChange(value.filter((v) => v.id !== id)), [onChange, value]);

    const clearSelection = useCallback(() => onChange([]), [onChange]);

    // Select-all loaded (aman untuk API yang belum sediakan /ids)
    const allLoadedSelected = showList.length > 0 && showList.every((e) => selectedIds.has(e.id));
    const toggleSelectAll = useCallback(() => {
        if (!multiple) return;
        if (allLoadedSelected) {
            const ids = new Set(showList.map((e) => e.id));
            onChange(value.filter((v) => !ids.has(v.id)));
        } else {
            const map = new Map<number, PickerEmployee>();
            value.forEach((v) => map.set(v.id, v));
            let remain = maxSelect ? Math.max(0, maxSelect - value.length) : Infinity;
            for (const e of showList) {
                if (map.has(e.id)) continue;
                if (remain <= 0) break;
                map.set(e.id, e);
                remain--;
            }
            onChange(Array.from(map.values()));
        }
    }, [multiple, allLoadedSelected, showList, value, onChange, maxSelect]);

    const [showFilter, setShowFilter] = useState(false);
    useEffect(() => {
        if (!open) setShowFilter(false);
    }, [open]);

    const rightSearchFilter = useCallback(
        (list: PickerEmployee[]) => {
            if (!searchRight) return list;
            const q = searchRight.toLowerCase();
            return list.filter((e) => e.full_name.toLowerCase().includes(q) || (e.employee_code || '').toLowerCase().includes(q));
        },
        [searchRight],
    );

    const label = (k: keyof NonNullable<SelectEmployeeDialogProps['labels']>, d: string) => labels?.[k] || d;

    return (
        <Dialog open={open} onOpenChange={onOpenChange} modal>
            <DialogContent className={cn('!w-[1180px] !max-w-[96vw] gap-0 overflow-hidden p-0', className)}>
                <DialogHeader className="px-6 pt-5 pb-2">
                    <DialogTitle>{label('title', 'Select employee')}</DialogTitle>
                </DialogHeader>

                <div className="flex h-[72vh] divide-x">
                    {/* LEFT */}
                    <div className="flex w-1/2 flex-col">
                        <ToolbarLeft
                            total={total || showList.length}
                            shown={showList.length}
                            search={searchLeft}
                            onSearch={setSearchLeft}
                            onFilter={() => setShowFilter(true)}
                            multiple={multiple}
                            allSelected={allLoadedSelected}
                            onToggleAll={toggleSelectAll}
                            page={page}
                        />

                        <div ref={parentRef} className="flex-1 overflow-auto outline-none" role="listbox" aria-multiselectable={multiple}>
                            <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
                                {rowVirtualizer.getVirtualItems().map((vi) => {
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
                                                <SkeletonRow loading={loading} hasMore={hasMore} />
                                            </div>
                                        );
                                    }
                                    const emp = showList[vi.index];
                                    const isSelected = selectedIds.has(emp.id);
                                    const disabled =
                                        disabledIdSet.has(emp.id) ||
                                        (!multiple && selectedIds.size > 0 && !isSelected) ||
                                        (!!maxSelect && value.length >= (maxSelect ?? Infinity) && !isSelected);

                                    return (
                                        <EmployeeRow
                                            key={vi.key}
                                            employee={emp}
                                            selected={isSelected}
                                            disabled={disabled}
                                            onAdd={() => addEmployee(emp)}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}
                                        />
                                    );
                                })}

                                {showList.length === 0 && !loading && <div className="p-6 text-sm text-muted-foreground">No employee found</div>}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {label('cancel', 'Cancel')}
                    </Button>
                    <Button onClick={() => multiple && onOpenChange(false)} disabled={!multiple || value.length === 0} className="min-w-40" autoFocus>
                        {label('select', 'Select employee')}
                    </Button>
                </DialogFooter>

                <RemoteFilterSheet
                    open={showFilter}
                    onOpenChange={setShowFilter}
                    filters={filters}
                    onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
                    onReset={() =>
                        setFilters({
                            position: '',
                            department: '',
                            position_level: '',
                            employment_status: '',
                            employee_type: '',
                            outsource_field: '',
                        })
                    }
                />
            </DialogContent>
        </Dialog>
    );
};

export default SelectEmployeeDialog;

/* =========================================================================================
 * Subcomponents
 * =======================================================================================*/
// const ToolbarLeft: React.FC<{
//     total: number;
//     shown: number;
//     search: string;
//     onSearch: (v: string) => void;
//     onFilter: () => void;
//     multiple: boolean;
//     allSelected: boolean;
//     onToggleAll: () => void;
//     page: number;
// }> = ({ total, shown, search, onSearch, onFilter, multiple, allSelected, onToggleAll, page }) => (
//     <div className="flex items-center gap-2 border-b px-4 py-2 text-xs">
//         <div className="flex flex-1 flex-col">
//             <div className="font-medium">
//                 View {shown} of {total} employee(s)
//             </div>
//             <div className="text-[10px] text-muted-foreground">Page {page}</div>
//             {multiple && (
//                 <button type="button" onClick={onToggleAll} className="w-max text-primary hover:underline disabled:opacity-40" disabled={shown === 0}>
//                     {allSelected ? 'Unselect all' : 'Select all'}
//                 </button>
//             )}
//         </div>
//         <div className="flex items-center gap-2">
//             <Input placeholder="Search employee" value={search} onChange={(e) => onSearch(e.target.value)} className="h-8 w-52" />
//             <Button variant="outline" size="sm" onClick={onFilter}>
//                 <Filter className="mr-1 h-3.5 w-3.5" /> Filter
//             </Button>
//         </div>
//     </div>
// );

// const ToolbarRight: React.FC<{
//     count: number;
//     search: string;
//     onSearch: (v: string) => void;
//     onClear: () => void;
//     clearLabel: string;
// }> = ({ count, search, onSearch, onClear, clearLabel }) => (
//     <div className="flex items-center gap-2 border-b px-4 py-2 text-xs">
//         <div className="flex flex-1 flex-col">
//             <div className="font-medium">{count} employee(s) selected</div>
//             <button type="button" onClick={onClear} className="w-max text-primary hover:underline disabled:opacity-40" disabled={count === 0}>
//                 {clearLabel}
//             </button>
//         </div>
//         <Input placeholder="Search employee" value={search} onChange={(e) => onSearch(e.target.value)} className="h-8 w-52" />
//     </div>
// );

// --- KIRI
const ToolbarLeft: React.FC<{
  total: number;
  shown: number;
  search: string;
  onSearch: (v: string) => void;
  onFilter: () => void;
  multiple: boolean;
  allSelected: boolean;
  onToggleAll: () => void;
  page: number;
}> = ({ total, shown, search, onSearch, onFilter, multiple, allSelected, onToggleAll, page }) => (
  <div className="grid grid-cols-[1fr_auto] grid-rows-3 items-center gap-x-2 border-b px-4 py-2 text-xs">
    {/* kolom kiri, baris 1–3 */}
    <div className="row-start-1 col-start-1 font-medium">
      View {shown} of {total} employee(s)
    </div>
    <div className="row-start-2 col-start-1 text-[10px] leading-4 text-muted-foreground">
      Page {page}
    </div>
    <div className="row-start-3 col-start-1">
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

    {/* kolom kanan membentang 3 baris → tinggi fix sama */}
    <div className="col-start-2 row-span-3 flex items-center gap-2">
      <Input
        placeholder="Search employee"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="h-8 w-52"
      />
      <Button variant="outline" size="sm" onClick={onFilter}>
        <Filter className="mr-1 h-3.5 w-3.5" /> Filter
      </Button>
    </div>
  </div>
);

// --- KANAN
const ToolbarRight: React.FC<{
  count: number;
  search: string;
  onSearch: (v: string) => void;
  onClear: () => void;
  clearLabel: string;
}> = ({ count, search, onSearch, onClear, clearLabel }) => (
  <div className="grid grid-cols-[1fr_auto] grid-rows-3 items-center gap-x-2 border-b px-4 py-2 text-xs">
    <div className="row-start-1 col-start-1 font-medium">
      {count} employee(s) selected
    </div>
    <div className="row-start-2 col-start-1">
      <button
        type="button"
        onClick={onClear}
        className="w-max text-primary hover:underline disabled:opacity-40"
        disabled={count === 0}
      >
        {clearLabel}
      </button>
    </div>
    {/* spacer agar jumlah baris kiri=kanan → tinggi identik */}
    <div className="row-start-3 col-start-1 h-4" />

    <div className="col-start-2 row-span-3 flex items-center gap-2">
      <Input
        placeholder="Search employee"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="h-8 w-52"
      />
    </div>
  </div>
);


const EmployeeRow: React.FC<{
    employee: PickerEmployee;
    selected: boolean;
    disabled: boolean;
    onAdd: () => void;
    style?: React.CSSProperties;
    className?: string;
}> = ({ employee, selected, disabled, onAdd, style, className }) => {
    const initials = useMemo(
        () =>
            employee.full_name
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase(),
        [employee.full_name],
    );

    const activate = useCallback(() => {
        if (!disabled) onAdd();
    }, [disabled, onAdd]);

    return (
        <div
            style={style}
            role="option"
            aria-selected={selected}
            tabIndex={0}
            onClick={activate}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activate();
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
                    activate();
                }}
            >
                {selected ? <ChevronsDownUp className="h-3.5 w-3.5 text-muted-foreground" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
        </div>
    );
};

const SelectedRow: React.FC<{ employee: PickerEmployee; onRemove: () => void }> = ({ employee, onRemove }) => {
    const initials = useMemo(
        () =>
            employee.full_name
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase(),
        [employee.full_name],
    );

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

const SkeletonRow: React.FC<{ loading: boolean; hasMore: boolean }> = ({ loading, hasMore }) => (
    <div className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-muted-foreground">
        {loading ? 'Loading...' : hasMore ? 'Load more...' : 'No more'}
    </div>
);

/* =========================================================================================
 * Filter Sheet (remote options)
 * =======================================================================================*/
const RemoteFilterSheet: React.FC<{
    open: boolean;
    onOpenChange: (v: boolean) => void;
    filters: { [k: string]: string };
    onChange: (k: string, v: string) => void;
    onReset: () => void;
}> = ({ open, onOpenChange, filters, onChange, onReset }) => {
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
