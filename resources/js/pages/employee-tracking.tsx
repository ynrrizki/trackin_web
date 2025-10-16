import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEchoPresence } from '@laravel/echo-react';
import { AnimatePresence, motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, ArrowRight, Copy, Download, ExternalLink, Filter, LocateFixed, Menu, RefreshCw, Search, Users, X } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet';
import { toast } from 'sonner';

/* ---------------- Debounce hook ---------------- */
function useDebounced<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debounced;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Employee Tracker', href: '/employee-tracking' },
];

type AttendanceMarker = {
    id: number;
    employee_id: number;
    employee_name: string;
    position: string | null;
    type: string; // Internal | Outsourcing
    lat_in: string | null;
    long_in: string | null;
    lat_out: string | null;
    long_out: string | null;
    date: string;
};

type PageProps = {
    employees: Array<{
        id: number;
        full_name: string;
        employee_code: string;
        position: string | null;
        department: string | null;
        type: string;
        photo_url: string | null;
    }>;
    attendances: AttendanceMarker[];
    date_from: string;
    date_to: string;
};

export default function EmployeeTrackingPage() {
    const page = usePage<PageProps>();
    const { employees = [], attendances = [], date_from, date_to } = page.props;

    // State untuk filter tambahan
    const [showFilter, setShowFilter] = useState(false);
    const [departmentFilter, setDepartmentFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [positionFilter, setPositionFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Ambil opsi unik untuk dropdown
    const departmentOptions = useMemo(() => {
        const set = new Set<string>();
        employees.forEach((e) => {
            if (e.department) set.add(e.department);
        });
        return Array.from(set).sort();
    }, [employees]);

    const typeOptions = useMemo(() => {
        const set = new Set<string>();
        employees.forEach((e) => {
            if (e.type) set.add(e.type);
        });
        return Array.from(set).sort();
    }, [employees]);

    const positionOptions = useMemo(() => {
        const set = new Set<string>();
        employees.forEach((e) => {
            if (e.position) set.add(e.position);
        });
        return Array.from(set).sort();
    }, [employees]);

    // Helper: copy to clipboard
    const copyToClipboard = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            toast.success(`Disalin: ${text}`);
        } else {
            // fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            toast.success(`Disalin: ${text}`);
        }
    };

    // State untuk search/filter
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounced(search, 250);
    const [dateRange, setDateRange] = useState({ from: date_from, to: date_to });
    const [showCheckin, setShowCheckin] = useState(true);
    const [showCheckout, setShowCheckout] = useState(true);
    const mapRef = useRef<L.Map | null>(null);
    const markerRefs = useRef<Record<string, L.CircleMarker>>({});
    const [activeEmployeeId, setActiveEmployeeId] = useState<number | null>(null);

    // Sidebar mobile drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [sidebarMinimized, setSidebarMinimized] = useState(false);

    // Live locations (with TTL) & tracks
    const [liveLocations, setLiveLocations] = useState<Record<number, { lat: number; lng: number; at: number }>>({});
    const [tracks, setTracks] = useState<Record<number, Array<[number, number]>>>({}); // max 300 points per employee

    // Constants
    const LIVE_TTL_MS = 120_000; // 2 minutes
    const TRACK_LIMIT = 300;

    // Echo presence channel (still used but only for location events now)
    const { channel: getChannel, leave } = useEchoPresence('employee-tracking');

    // NEW: duty dari event (dipakai juga sidebar)
    const [dutyByEmp, setDutyByEmp] = useState<Record<number, 'on' | 'off' | 'not'>>({});

    // NEW: turunan dari attendances untuk popup & layer Off Duty
    const { lastCheckoutByEmp, openCheckinByEmp } = useMemo(() => {
        const lastOut: Record<number, AttendanceMarker | undefined> = {};
        const openIn: Record<number, AttendanceMarker | undefined> = {};

        // kelompokkan per employee dan ambil record terakhir
        const byEmp: Record<number, AttendanceMarker[]> = {};
        attendances.forEach((a) => (byEmp[a.employee_id] ||= []).push(a));
        Object.values(byEmp).forEach((arr) => arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

        Object.entries(byEmp).forEach(([eid, arr]) => {
            const last = arr[arr.length - 1];
            if (!last) return;
            if (last.lat_in && (!last.lat_out || !last.long_out)) {
                openIn[+eid] = last; // masih on (untuk info popup)
            }
            if (last.lat_out && last.long_out) {
                lastOut[+eid] = last; // titik checkout terakhir
            }
        });

        return { lastCheckoutByEmp: lastOut, openCheckinByEmp: openIn };
    }, [attendances]);

    // HYBRID STATUS: Initialize dutyByEmp dari database saat component mount
    useEffect(() => {
        const initialDuty: Record<number, 'on' | 'off' | 'not'> = {};

        employees.forEach(emp => {
            const openCheckin = openCheckinByEmp[emp.id];
            const lastCheckout = lastCheckoutByEmp[emp.id];

            if (openCheckin && (!lastCheckout || new Date(openCheckin.date) > new Date(lastCheckout.date))) {
                initialDuty[emp.id] = 'on';  // Ada checkin aktif, belum checkout
            } else if (lastCheckout) {
                initialDuty[emp.id] = 'off'; // Sudah checkout
            } else {
                initialDuty[emp.id] = 'not'; // Belum mulai
            }
        });

        setDutyByEmp(initialDuty);
        console.log('🗄️ Initialized duty status from database:', initialDuty);
    }, [employees, openCheckinByEmp, lastCheckoutByEmp]);

    // HYBRID STATUS: Get employee status dengan WebSocket sebagai prioritas dan database sebagai fallback
    const getEmployeeStatus = useCallback((empId: number): 'on' | 'off' | 'not' => {
        // Prioritas: WebSocket data jika ada dan fresh
        const wsStatus = dutyByEmp[empId];
        if (wsStatus) return wsStatus;

        // Fallback: Hitung dari database
        const openCheckin = openCheckinByEmp[empId];
        const lastCheckout = lastCheckoutByEmp[empId];

        if (openCheckin && (!lastCheckout || new Date(openCheckin.date) > new Date(lastCheckout.date))) {
            return 'on';
        }
        if (lastCheckout) return 'off';
        return 'not';
    }, [dutyByEmp, openCheckinByEmp, lastCheckoutByEmp]);

    useEffect(() => {
        const ch = getChannel();
        console.log('🔔 Subscribed to presence channel "employee-tracking" for live locations.', ch);

        ch.listen('.user.location-updated', (e: { employee_id?: number | null; lat: number; lng: number; duty: 'on' | 'off' | 'not' }) => {
            console.log('📶 Received location update event:', e);
            if (!e.employee_id) return;
            const empId = e.employee_id!;
            // const duty = dutyRef.current[empId];
            // Only accept if currently On Duty
            setDutyByEmp((prev) => ({ ...prev, [empId]: e.duty }));
            console.log('📍 Location update received for employee', empId, 'Duty status:', e.duty, e);

            // 2) Kalau bukan ON, hapus titik live biar gak “nyangkut”
            if (e.duty !== 'on' && e.duty !== 'off') {
                setLiveLocations((prev) => {
                    if (!(empId in prev)) return prev;
                    const next = { ...prev };
                    delete next[empId];
                    return next;
                });
                return;
            }

            // 3) ON: simpan titik live + track
            setLiveLocations((prev) => ({ ...prev, [empId]: { lat: e.lat, lng: e.lng, at: Date.now() } }));

            setTracks((prev) => {
                const existing: [number, number][] = prev[empId] || [];
                const next: [number, number][] = [...existing, [e.lat, e.lng] as [number, number]];
                if (next.length > TRACK_LIMIT) next.splice(0, next.length - TRACK_LIMIT);
                return { ...prev, [empId]: next };
            });
        });

        return () => {
            try {
                leave();
            } catch (err) {
                console.warn('Error leaving channel', err);
            }
        };
    }, [getChannel, leave]);

    // TTL cleanup every 30s
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveLocations((prev) => {
                const now = Date.now();
                let changed = false;
                const next: typeof prev = {};
                Object.entries(prev).forEach(([empId, loc]) => {
                    if (now - loc.at <= LIVE_TTL_MS) next[+empId] = loc;
                    else changed = true;
                });
                return changed ? next : prev;
            });
        }, 30_000);
        return () => clearInterval(interval);
    }, []);

    // Filtered employees by search & filter
    const filteredEmployees = useMemo(() => {
        return employees.filter(e => {
            const matchSearch =
                !debouncedSearch ||
                e.full_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                (e.employee_code && e.employee_code.toLowerCase().includes(debouncedSearch.toLowerCase()));
            const matchDept = !departmentFilter || e.department === departmentFilter;
            const matchType = !typeFilter || e.type === typeFilter;
            const matchPos = !positionFilter || e.position === positionFilter;
            const matchStatus = statusFilter === 'all' || getEmployeeStatus(e.id) === statusFilter;
            return matchSearch && matchDept && matchType && matchPos && matchStatus;
        });
    }, [employees, debouncedSearch, departmentFilter, typeFilter, positionFilter, statusFilter, getEmployeeStatus]);

    // Add fallback locations from database for employees without live location data
    const fallbackLocations = useMemo(() => {
        const locations: Record<number, { lat: number; lng: number; attendance: AttendanceMarker }> = {};
        
        filteredEmployees.forEach(employee => {
            const empId = employee.id;
            const status = getEmployeeStatus(empId);
            
            // Only show fallback if no live location exists
            if (liveLocations[empId]) return;
            
            if (status === 'on') {
                const openCheckin = openCheckinByEmp[empId];
                if (openCheckin?.lat_in && openCheckin.long_in) {
                    locations[empId] = {
                        lat: parseFloat(openCheckin.lat_in),
                        lng: parseFloat(openCheckin.long_in),
                        attendance: openCheckin
                    };
                }
            }
        });
        
        return locations;
    }, [filteredEmployees, getEmployeeStatus, liveLocations, openCheckinByEmp]);

    // Duty status mapping already derived: dutyByEmp

    // Map center (default Jakarta)
    const firstIn = attendances.find((a) => a.lat_in && a.long_in);
    const center: [number, number] = firstIn ? [parseFloat(firstIn.lat_in!), parseFloat(firstIn.long_in!)] : [-6.2, 106.8166];

    // Handle filter tanggal map
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDateRange((prev) => ({ ...prev, [name]: value }));
    };

    const applyDateFilter = () => {
        router.get(
            '/employee-tracking',
            {
                date_from: dateRange.from,
                date_to: dateRange.to,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Fit to data (bounds) per new spec: live points (on duty) + last checkout (off duty)
    const fitToData = useCallback(() => {
        if (!mapRef.current) return;
        const bounds: L.LatLngBoundsExpression = [];
        
        if (showCheckin) {
            filteredEmployees
                .filter(emp => getEmployeeStatus(emp.id) === 'on')
                .forEach((emp) => {
                    const live = liveLocations[emp.id];
                    const fallback = fallbackLocations[emp.id];
                    
                    if (live) {
                        bounds.push([live.lat, live.lng]);
                    } else if (fallback) {
                        bounds.push([fallback.lat, fallback.lng]);
                    }
                });
        }
        
        if (showCheckout) {
            filteredEmployees
                .filter(emp => getEmployeeStatus(emp.id) === 'off')
                .forEach((emp) => {
                    const outAtt = lastCheckoutByEmp[emp.id];
                    if (outAtt?.lat_out && outAtt.long_out) {
                        bounds.push([parseFloat(outAtt.lat_out), parseFloat(outAtt.long_out)]);
                    }
                });
        }
        
        if (bounds.length > 0) {
            mapRef.current.fitBounds(bounds, { padding: [60, 60] });
        }
    }, [filteredEmployees, getEmployeeStatus, liveLocations, fallbackLocations, lastCheckoutByEmp, showCheckin, showCheckout]);

    // Refetch handler
    const handleRefetch = () => {
        router.reload();
    };

    // Sidebar click: focus to relevant marker depending on duty status
    const handleEmployeeClick = (empId: number) => {
        setActiveEmployeeId(empId);
        const duty = getEmployeeStatus(empId);
        if (!mapRef.current) return;
        
        if (duty === 'on') {
            // live marker or fallback marker
            const live = liveLocations[empId];
            const fallback = fallbackLocations[empId];
            
            if (live) {
                const marker = markerRefs.current[`live-${empId}`];
                mapRef.current.flyTo([live.lat, live.lng], 17, { animate: true });
                marker?.openPopup();
                return;
            } else if (fallback) {
                const marker = markerRefs.current[`fallback-${empId}`];
                mapRef.current.flyTo([fallback.lat, fallback.lng], 17, { animate: true });
                marker?.openPopup();
                return;
            } else if (tracks[empId] && tracks[empId].length) {
                const [lat, lng] = tracks[empId][tracks[empId].length - 1];
                mapRef.current.flyTo([lat, lng], 17, { animate: true });
                return;
            }
        } else if (duty === 'off') {
            const outAtt = lastCheckoutByEmp[empId];
            if (outAtt && outAtt.lat_out && outAtt.long_out) {
                const marker = markerRefs.current[`off-${empId}`];
                const lat = parseFloat(outAtt.lat_out);
                const lng = parseFloat(outAtt.long_out);
                mapRef.current.flyTo([lat, lng], 17, { animate: true });
                marker?.openPopup();
                return;
            }
        } else {
            // not started -> fallthrough to last DB point fetch
        }

        // Fallback: fetch last tracking point from DB and focus
        fetch(`/api/tracking/last?employee_id=${empId}`)
            .then((r) => r.json())
            .then((data) => {
                const p = data?.point;
                if (p && typeof p.lat === 'number' && typeof p.lng === 'number') {
                    mapRef.current!.flyTo([p.lat, p.lng], 17, { animate: true });
                    // optionally store as last known for quick reuse
                    setLiveLocations((prev) => ({ ...prev, [empId]: { lat: p.lat, lng: p.lng, at: Date.now() } }));
                } else {
                    toast.info('Tidak ada titik lokasi terakhir untuk karyawan ini');
                }
            })
            .catch(() => toast.error('Gagal mengambil lokasi terakhir'));
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            date_from: dateRange.from,
            date_to: dateRange.to,
            department: departmentFilter,
            type: typeFilter,
            position: positionFilter,
        });
        window.location.href = `/employee-tracking/export?${params.toString()}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Tracker" />

            {/* Modern Header Bar */}
            <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center gap-4 px-6">
                    {/* Mobile Sidebar Toggle */}
                    <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setDrawerOpen(true)}>
                        <Menu className="h-4 w-4" />
                        <span className="ml-2">Karyawan ({filteredEmployees.length})</span>
                    </Button>

                    {/* Desktop Sidebar Toggle */}
                    <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => setSidebarMinimized(!sidebarMinimized)}>
                        {sidebarMinimized ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        {!sidebarMinimized && <span className="ml-2">Daftar Karyawan ({filteredEmployees.length})</span>}
                    </Button>

                    {/* Header Controls */}
                    <div className="flex flex-1 items-center justify-end gap-3">
                        {/* Date Range Selector */}
                        <div className="flex items-center gap-2">
                            {/* Desktop (sm+) */}
                            <div className="hidden items-center gap-1 sm:flex">
                                <label className="text-sm font-medium text-muted-foreground">Dari:</label>
                                <Input type="date" name="from" value={dateRange.from} onChange={handleDateChange} className="h-8 w-36 text-xs" />
                            </div>
                            <div className="hidden items-center gap-1 sm:flex">
                                <label className="text-sm font-medium text-muted-foreground">Sampai:</label>
                                <Input type="date" name="to" value={dateRange.to} onChange={handleDateChange} className="h-8 w-36 text-xs" />
                            </div>
                            <Button onClick={applyDateFilter} size="sm" className="hidden sm:flex">
                                <Filter />
                                Terapkan Filter
                            </Button>
                            {/* Mobile */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button size="sm" className="sm:hidden">
                                        <Filter className="h-4 w-4" />
                                        <span className="ml-2">Filter Tanggal</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="sm:hidden">
                                    <div className="space-y-4 p-4">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-medium text-muted-foreground">Dari:</label>
                                                <Input
                                                    type="date"
                                                    name="from"
                                                    value={dateRange.from}
                                                    onChange={handleDateChange}
                                                    className="h-8 w-full text-xs"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-medium text-muted-foreground">Sampai:</label>
                                                <Input
                                                    type="date"
                                                    name="to"
                                                    value={dateRange.to}
                                                    onChange={handleDateChange}
                                                    className="h-8 w-full text-xs"
                                                />
                                            </div>
                                        </div>
                                        <Button onClick={applyDateFilter} size="sm" className="w-full">
                                            <Filter className="mr-2 h-4 w-4" />
                                            Terapkan Filter
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button onClick={handleRefetch} variant="outline" size="sm">
                                <RefreshCw className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Refresh</span>
                            </Button>
                            <Button onClick={handleExport} variant="outline" size="sm">
                                <Download className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                            <Button onClick={fitToData} variant="outline" size="sm">
                                <LocateFixed className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Fit Data</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative flex h-[calc(100vh-128px)] overflow-hidden">
                {/* Desktop Sidebar */}
                <aside
                    className={cn(
                        'hidden border-r border-border bg-background transition-all duration-300 md:flex md:flex-col',
                        sidebarMinimized ? 'w-0 min-w-0' : 'w-80 min-w-80',
                    )}
                >
                    {!sidebarMinimized && (
                        <div className="flex h-full flex-col overflow-hidden">
                            <EmployeeSidebar
                                employees={filteredEmployees}
                                search={search}
                                setSearch={setSearch}
                                getEmployeeStatus={getEmployeeStatus}
                                activeEmployeeId={activeEmployeeId}
                                onEmployeeClick={handleEmployeeClick}
                                departmentFilter={departmentFilter}
                                setDepartmentFilter={setDepartmentFilter}
                                departmentOptions={departmentOptions}
                                typeFilter={typeFilter}
                                setTypeFilter={setTypeFilter}
                                typeOptions={typeOptions}
                                positionFilter={positionFilter}
                                setPositionFilter={setPositionFilter}
                                positionOptions={positionOptions}
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                                showFilter={showFilter}
                                setShowFilter={setShowFilter}
                            />
                        </div>
                    )}
                </aside>

                {/* Mobile Sidebar Drawer */}
                <div
                    className={cn(
                        'fixed inset-0 z-50 transition-all duration-300 md:hidden',
                        drawerOpen ? 'pointer-events-auto' : 'pointer-events-none',
                    )}
                >
                    <div
                        className={cn('absolute inset-0 bg-black/50 transition-opacity duration-300', drawerOpen ? 'opacity-100' : 'opacity-0')}
                        onClick={() => setDrawerOpen(false)}
                    />
                    <aside
                        className={cn(
                            'absolute top-0 left-0 flex h-full w-80 flex-col bg-background shadow-xl transition-transform duration-300',
                            drawerOpen ? 'translate-x-0' : '-translate-x-full',
                        )}
                    >
                        <div className="flex h-16 items-center justify-between border-b border-border px-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                <span className="font-semibold">Daftar Karyawan</span>
                                <Badge variant="secondary">{filteredEmployees.length}</Badge>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <EmployeeSidebar
                                employees={filteredEmployees}
                                search={search}
                                setSearch={setSearch}
                                getEmployeeStatus={getEmployeeStatus}
                                activeEmployeeId={activeEmployeeId}
                                onEmployeeClick={(id) => {
                                    setDrawerOpen(false);
                                    handleEmployeeClick(id);
                                }}
                                departmentFilter={departmentFilter}
                                setDepartmentFilter={setDepartmentFilter}
                                departmentOptions={departmentOptions}
                                typeFilter={typeFilter}
                                setTypeFilter={setTypeFilter}
                                typeOptions={typeOptions}
                                positionFilter={positionFilter}
                                setPositionFilter={setPositionFilter}
                                positionOptions={positionOptions}
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                            />
                        </div>
                    </aside>
                </div>

                {/* Map Container */}
                <div className="relative flex-1">
                    {/* Map Legend */}
                    <div className="absolute bottom-4 left-4 z-10">
                        <div className="flex items-center gap-6 p-3">
                            {/* Reusing showCheckin/showCheckout states as On/Off duty toggles for backward compatibility */}
                            <LegendToggleCard
                                id="legend-on-duty"
                                label="On Duty (Live)"
                                color="#22c55e" // hijau-500
                                selected={showCheckin}
                                onChange={(v) => setShowCheckin(!!v)}
                            />
                            <LegendToggleCard
                                id="legend-off-duty"
                                label="Off Duty (Last Out)"
                                color="#ef4444" // red-500
                                selected={showCheckout}
                                onChange={(v) => setShowCheckout(!!v)}
                            />
                        </div>
                    </div>

                    {/* Map */}
                    <MapContainer
                        center={center}
                        zoom={11}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom
                        zoomControl={false}
                        ref={mapRef}
                        className="z-0"
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

                        {/* On Duty (Live + Fallback) */}
                        {showCheckin &&
                            filteredEmployees
                                .filter(emp => getEmployeeStatus(emp.id) === 'on')
                                .map((employee) => {
                                    const id = employee.id;
                                    const track = tracks[id];
                                    const live = liveLocations[id];
                                    const fallback = fallbackLocations[id];
                                    const openCheckinAtt = openCheckinByEmp[id];
                                    
                                    // Use live location if available, otherwise use fallback
                                    const currentLocation = live || (fallback ? { lat: fallback.lat, lng: fallback.lng } : null);
                                    
                                    if (!currentLocation) return null;
                                    
                                    const isLiveData = !!live;
                                    
                                    return (
                                        <Fragment key={`on-${id}`}>
                                            {track && track.length >= 2 && (
                                                <Polyline
                                                    positions={track.map((p) => [p[0], p[1]])}
                                                    pathOptions={{
                                                        color: '#22c55e', // hijau-500
                                                        weight: 3,
                                                        opacity: isLiveData ? 0.8 : 0.5, // Dimmer for fallback
                                                    }}
                                                />
                                            )}
                                            <CircleMarker
                                                center={[currentLocation.lat, currentLocation.lng]}
                                                radius={8}
                                                pathOptions={{
                                                    color: isLiveData ? '#2563eb' : '#6b7280', // Gray border for fallback
                                                    fillColor: '#22c55e', // hijau-500
                                                    fillOpacity: isLiveData ? 0.8 : 0.6, // Less opacity for fallback
                                                    weight: 2,
                                                }}
                                                ref={(el) => {
                                                    if (el) markerRefs.current[`${isLiveData ? 'live' : 'fallback'}-${id}`] = el;
                                                    if (el && activeEmployeeId === id) setTimeout(() => el.openPopup(), 150);
                                                }}
                                            >
                                                {openCheckinAtt && (
                                                    <Popup minWidth={280} maxWidth={350}>
                                                        <EmployeePopupCard
                                                            employee={employee}
                                                            attendance={openCheckinAtt}
                                                            status={isLiveData ? "On Duty" : "On Duty (Last Known)"}
                                                            statusColor="#22c55e"
                                                            mapRef={mapRef}
                                                            markerLatLng={[currentLocation.lat, currentLocation.lng]}
                                                            copyToClipboard={copyToClipboard}
                                                        />
                                                    </Popup>
                                                )}
                                            </CircleMarker>
                                        </Fragment>
                                    );
                                })}

                        {/* Off Duty (Last Checkout) */}
                        {showCheckout &&
                            filteredEmployees
                                .filter(emp => getEmployeeStatus(emp.id) === 'off')
                                .map((employee) => {
                                    const id = employee.id;
                                    const outAtt = lastCheckoutByEmp[id];
                                    if (!outAtt?.lat_out || !outAtt.long_out) return null;
                                    const lat = parseFloat(outAtt.lat_out);
                                    const lng = parseFloat(outAtt.long_out);
                                    return (
                                        <CircleMarker
                                            key={`off-${id}`}
                                            center={[lat, lng]}
                                            radius={8}
                                            pathOptions={{
                                                color: '#ef4444',
                                                fillColor: '#ef4444',
                                                fillOpacity: 0.85,
                                                weight: 2,
                                            }}
                                            ref={(el) => {
                                                if (el) markerRefs.current[`off-${id}`] = el;
                                                if (el && activeEmployeeId === id) setTimeout(() => el.openPopup(), 150);
                                            }}
                                        >
                                            <Popup minWidth={280} maxWidth={350}>
                                                <EmployeePopupCard
                                                    employee={employee}
                                                    attendance={outAtt}
                                                    status="Off Duty"
                                                    statusColor="#ef4444"
                                                    mapRef={mapRef}
                                                    markerLatLng={[lat, lng]}
                                                    copyToClipboard={copyToClipboard}
                                                />
                                            </Popup>
                                        </CircleMarker>
                                    );
                                })}
                    </MapContainer>
                </div>
            </div>
        </AppLayout>
    );
}

function LegendToggleCard({
    id,
    label,
    color, // hex/color string, ex: "#22c55e"
    selected,
    onChange,
}: {
    id: string;
    label: string;
    color: string;
    selected: boolean;
    onChange: (next: boolean) => void;
}) {
    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={selected}
            aria-label={label}
            data-selected={selected}
            onClick={() => onChange(!selected)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange(!selected);
                }
            }}
            className={[
                'group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition',
                'bg-card/80 shadow-sm hover:bg-muted/60',
                'outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'data-[selected=true]:ring-2 data-[selected=true]:ring-primary data-[selected=true]:ring-offset-2',
                'data-[selected=true]:bg-background',
            ].join(' ')}
            style={{
                // Sedikit aksen warna saat aktif
                borderColor: selected ? color : undefined,
                boxShadow: selected ? `0 0 0 3px ${color}22 inset` : undefined,
            }}
        >
            <span className="inline-block h-3.5 w-3.5 rounded-full ring-2 ring-background" style={{ backgroundColor: color }} aria-hidden />
            <span className="font-medium">{label}</span>

            {/* indikator aktif halus */}
            <span
                className="ml-1 h-1.5 w-1.5 rounded-full opacity-0 transition-opacity group-data-[selected=true]:opacity-100"
                style={{ backgroundColor: color }}
                aria-hidden
            />
        </button>
    );
}

// EmployeeSidebar component
type EmployeeSidebarProps = {
    employees: PageProps['employees'];
    search: string;
    setSearch: (v: string) => void;
    getEmployeeStatus: (empId: number) => 'on' | 'off' | 'not';
    activeEmployeeId: number | null;
    onEmployeeClick: (id: number) => void;
    departmentFilter: string;
    setDepartmentFilter: (v: string) => void;
    departmentOptions: string[];
    typeFilter: string;
    setTypeFilter: (v: string) => void;
    typeOptions: string[];
    positionFilter: string;
    setPositionFilter: (v: string) => void;
    positionOptions: string[];
    statusFilter: string;
    setStatusFilter: (v: string) => void;
    showFilter?: boolean;
    setShowFilter?: (v: boolean) => void;
};

function EmployeeSidebar({
    employees,
    search,
    setSearch,
    getEmployeeStatus,
    activeEmployeeId,
    onEmployeeClick,
    departmentFilter,
    setDepartmentFilter,
    departmentOptions,
    typeFilter,
    setTypeFilter,
    typeOptions,
    positionFilter,
    setPositionFilter,
    positionOptions,
    statusFilter,
    setStatusFilter,
    showFilter,
    setShowFilter,
}: EmployeeSidebarProps) {
    return (
        <div className="flex h-full flex-col">
            {/* Search and filters */}
            <div className="flex-shrink-0 space-y-4 border-b border-border p-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        className="pl-9"
                        placeholder="Cari nama atau NIP..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                            {/* <Filter className="h-4 w-4" /> */}
                            Filter
                        </div>
                        <Button variant="outline" size="icon" onClick={() => setShowFilter && setShowFilter(!showFilter)}>
                            {showFilter ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </Button>
                    </div>
                    <AnimatePresence>
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: showFilter ? 'auto' : 0, opacity: showFilter ? 1 : 0 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2"
                        >
                            <Select
                                value={departmentFilter}
                                onValueChange={(value) => {
                                    if (value === 'null') value = '';
                                    setDepartmentFilter(value);
                                }}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Departemen" />
                                </SelectTrigger>
                                <SelectContent className="z-[1500]">
                                    <SelectItem value="null">Semua Departemen</SelectItem>
                                    {departmentOptions.map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={typeFilter}
                                onValueChange={(value) => {
                                    if (value === 'null') value = '';
                                    setTypeFilter(value);
                                }}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Tipe" />
                                </SelectTrigger>
                                <SelectContent className="z-[1500]">
                                    <SelectItem value="null">Semua Tipe</SelectItem>
                                    {typeOptions.map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={positionFilter}
                                onValueChange={(value) => {
                                    if (value === 'null') value = '';
                                    setPositionFilter(value);
                                }}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Posisi" />
                                </SelectTrigger>
                                <SelectContent className="z-[1500]">
                                    <SelectItem value="null">Semua Posisi</SelectItem>
                                    {positionOptions.map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* NEW: Status Filter */}
                            <Select
                                value={statusFilter}
                                onValueChange={(value) => {
                                    setStatusFilter(value);
                                }}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="z-[1500]">
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="on">On Duty</SelectItem>
                                    <SelectItem value="off">Off Duty</SelectItem>
                                    <SelectItem value="not">Not Started</SelectItem>
                                </SelectContent>
                            </Select>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Employee list */}
            <div className="flex-1 overflow-y-auto">
                {employees.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-center">
                        <div className="space-y-2">
                            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Tidak ada karyawan ditemukan</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
                        {employees.map((employee) => (
                            <EmployeeListItem
                                key={employee.id}
                                employee={employee}
                                status={getEmployeeStatus(employee.id)}
                                isActive={activeEmployeeId === employee.id}
                                onClick={() => onEmployeeClick(employee.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// EmployeeListItem component
type EmployeeListItemProps = {
    employee: PageProps['employees'][number];
    status: 'on' | 'off' | 'not' | undefined;
    isActive: boolean;
    onClick: () => void;
};

function EmployeeListItem({ employee, status, isActive, onClick }: EmployeeListItemProps) {
    const statusConfig: Record<string, { label: string; color: string; textColor: string; dotColor: string }> = {
        on: { label: 'On Duty', color: 'bg-green-600', textColor: 'text-white', dotColor: 'bg-green-600' },
        off: { label: 'Off Duty', color: 'bg-red-500', textColor: 'text-white', dotColor: 'bg-red-500' },
        not: { label: 'Not Started', color: 'bg-gray-500', textColor: 'text-white', dotColor: 'bg-gray-400' },
        // undefined: { label: 'Unknown', color: 'bg-gray-500', textColor: 'text-white', dotColor: 'bg-gray-400' },
        undefined: { label: 'Not Started', color: 'bg-gray-500', textColor: 'text-white', dotColor: 'bg-gray-400' },
    };

    const config = statusConfig[status ?? 'undefined'];
    const initials = employee.full_name
        .split(' ')
        .map((name) => name[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div
            className={cn(
                'relative cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:shadow-md',
                isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent bg-card hover:border-border hover:bg-accent/50',
            )}
            onClick={onClick}
        >
            {/* Active indicator */}
            {/* {isActive && <div className="absolute top-0 left-0 h-full w-1 rounded-r-full bg-primary" />} */}

            <div className="flex items-start gap-3">
                <div className="relative">
                    <Avatar className="h-10 w-10">
                        {/* <AvatarImage src={employee.photo_url || undefined} alt={employee.full_name} /> */}
                        <AvatarImage src={undefined} alt={employee.full_name} />
                        <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    {/* Status dot */}
                    <div className={cn('absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-background', config.dotColor)} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-semibold" title={employee.full_name}>
                                {employee.full_name}
                            </h4>
                            <p className="truncate text-xs text-muted-foreground" title={employee.position || 'No position'}>
                                {employee.position || 'No position'}
                            </p>
                        </div>
                        <Badge variant="secondary" className={cn('px-1.5 py-0.5 text-xs font-medium', config.color, config.textColor)}>
                            {config.label}
                        </Badge>
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="font-mono">{employee.employee_code}</span>
                        <span>•</span>
                        <span>{employee.type}</span>
                        {employee.department && (
                            <>
                                <span>•</span>
                                <span className="truncate" title={employee.department}>
                                    {employee.department}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// EmployeePopupCard component
type EmployeePopupCardProps = {
    employee: PageProps['employees'][number] | null;
    attendance: AttendanceMarker;
    status: 'Check In' | 'Check Out' | 'On Duty' | 'Off Duty' | 'On Duty (Last Known)';
    statusColor: string;
    mapRef: React.RefObject<L.Map | null>;
    markerLatLng: [number, number];
    copyToClipboard: (text: string) => void;
};

function EmployeePopupCard({ employee, attendance, status, statusColor, mapRef, markerLatLng, copyToClipboard }: EmployeePopupCardProps) {
    const name = employee?.full_name || attendance.employee_name || '-';
    const position = employee?.position || attendance.position || '-';
    const nip = employee?.employee_code || '-';
    const type = employee?.type || attendance.type || '-';
    const department = employee?.department || '-';
    const timestamp = new Date(attendance.date).toLocaleString('id-ID');

    const initials = name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const handleCenter = useCallback(() => {
        mapRef.current?.setView({ lat: markerLatLng[0], lng: markerLatLng[1] }, 16, { animate: true });
    }, [mapRef, markerLatLng]);

    const handleCopy = useCallback(() => {
        const val = nip !== '-' ? nip : name;
        copyToClipboard(val);
    }, [copyToClipboard, name, nip]);

    return (
        <TooltipProvider>
            <Card className="w-full max-w-sm border-0 shadow-none">
                <CardContent className="p-0">
                    {/* Header with gradient */}
                    <div
                        className="relative rounded-t-lg p-4 text-white"
                        style={{
                            background: `linear-gradient(135deg, ${statusColor}, ${statusColor}dd)`,
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-white/20">
                                <AvatarImage
                                    src={
                                        employee?.photo_url ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=ffffff&color=000000`
                                    }
                                    alt={name}
                                />
                                <AvatarFallback className="text-sm font-bold">{initials}</AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                                <h3 className="truncate text-sm font-bold" title={name}>
                                    {name}
                                </h3>
                                <p className="truncate text-xs opacity-90" title={position}>
                                    {position}
                                </p>
                                <div className="mt-1 flex items-center gap-1">
                                    <Badge variant="secondary" className="border-white/30 bg-white/20 px-2 py-0.5 text-xs text-white">
                                        {status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3 p-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className="mb-1 text-xs font-medium text-muted-foreground">NIP</div>
                                <div className="font-mono font-medium">{nip}</div>
                            </div>
                            <div>
                                <div className="mb-1 text-xs font-medium text-muted-foreground">Tipe</div>
                                <div className="font-medium">{type}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="mb-1 text-xs font-medium text-muted-foreground">Departemen</div>
                                <div className="truncate font-medium" title={department}>
                                    {department}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <div className="mb-1 text-xs font-medium text-muted-foreground">Waktu</div>
                                <div className="text-sm font-medium">{timestamp}</div>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-center gap-2 p-4 pt-0">
                    {employee && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild size="sm" variant="default">
                                    <Link href={`/employees/${employee.id}`} className="!text-primary-foreground">
                                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                        Detail
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Lihat detail karyawan</TooltipContent>
                        </Tooltip>
                    )}

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="secondary" size="sm" onClick={handleCenter}>
                                <LocateFixed className="mr-1.5 h-3.5 w-3.5" />
                                Center
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Fokus ke marker</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={handleCopy}>
                                <Copy className="mr-1.5 h-3.5 w-3.5" />
                                Copy
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Salin {nip !== '-' ? 'NIP' : 'nama'}</TooltipContent>
                    </Tooltip>
                </CardFooter>
            </Card>
        </TooltipProvider>
    );
}
