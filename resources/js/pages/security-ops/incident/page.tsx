import { DataTable, type DataTableColumn } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Eye, MessageSquare, Download } from 'lucide-react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { toast } from 'sonner';
import { Map as LeafletMap } from 'leaflet';
import { incidentService } from '@/services/incidentService';

type Incident = {
    id: number;
    lat: number;
    long: number;
    location?: string;
    incident_at?: string;
    severity?: string; // Tinggi | Sedang | Rendah
    priority?: string; // low | medium | high | critical
    status?: string; // reported | investigating | resolved | closed
    status_label?: string;
    priority_label?: string;
    description?: string;
    handling_steps?: string;
    related_name?: string;
    related_status?: string;
    category?: { id: number; name: string } | null;
    photo_url?: string;
    follow_up_actions?: Array<{
        id: string;
        description: string;
        created_by: string;
        created_at: string;
    }>;
    assigned_to?: { id: number; full_name: string } | null;
    reporter?: { id: number; full_name: string } | null;
    resolution_notes?: string;
    resolved_at?: string;
};

type Category = { id: number; name: string };
type Employee = { id: number; name: string };

type PageProps = {
    incidents: Incident[];
    categories: Category[];
    employees: Employee[];
    filters: { q?: string; category_id?: number | null; severity?: string; status?: string; priority?: string; from?: string; to?: string };
};

// Helper function to get default date range (covers typical incident data range)
const getDefaultDateRange = () => {
    // Set end date to current date
    const today = new Date();
    // Set start date to 60 days ago to ensure we cover typical incident data
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(today.getDate() - 60);

    return {
        from: sixtyDaysAgo.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
    };
};

const severityColor = (sev?: string) => {
    switch ((sev || '').toLowerCase()) {
        case 'tinggi':
            return 'red';
        case 'sedang':
            return 'orange';
        case 'rendah':
            return 'green';
        default:
            return 'blue';
    }
};

const getStatusColor = (status?: string) => {
    switch (status) {
        case 'reported':
            return 'bg-yellow-100 text-yellow-800';
        case 'investigating':
            return 'bg-blue-100 text-blue-800';
        case 'resolved':
            return 'bg-green-100 text-green-800';
        case 'closed':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getPriorityColor = (priority?: string) => {
    switch (priority) {
        case 'critical':
            return 'bg-red-100 text-red-800';
        case 'high':
            return 'bg-orange-100 text-orange-800';
        case 'medium':
            return 'bg-yellow-100 text-yellow-800';
        case 'low':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function IncidentPage() {
    const page = usePage<PageProps>();
    const incidents: Incident[] = useMemo(() => page.props.incidents ?? [], [page.props.incidents]);
    const categories: Category[] = useMemo(() => page.props.categories ?? [], [page.props.categories]);
    // const employees: Employee[] = useMemo(() => page.props.employees ?? [], [page.props.employees]);
    const filters = useMemo(() => (page.props.filters ?? {}) as PageProps['filters'], [page.props.filters]);

    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [newFollowUp, setNewFollowUp] = useState('');
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const mapRef = useRef<LeafletMap | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2, 106.8166]);
    const [mapZoom, setMapZoom] = useState(10);

    const defaultRange = getDefaultDateRange();

    const [local, setLocal] = useState({
        q: filters.q || '',
        category_id: filters.category_id ? String(filters.category_id) : 'all',
        severity: filters.severity || 'all',
        status: filters.status || 'all',
        priority: filters.priority || 'all',
        from: filters.from || defaultRange.from,
        to: filters.to || defaultRange.to,
    });

    // Fix z-index issues by adding custom styles
    useEffect(() => {
        // Add custom CSS for leaflet and dialog z-index management
        const style = document.createElement('style');
        style.textContent = `
            .leaflet-container {
                z-index: 1 !important;
            }
            .leaflet-control-container {
                z-index: 2 !important;
            }
            .leaflet-popup {
                z-index: 3 !important;
            }
            .leaflet-tooltip {
                z-index: 3 !important;
            }
            [data-radix-popper-content-wrapper] {
                z-index: 9999 !important;
            }
            [data-state="open"][data-radix-dialog-overlay] {
                z-index: 9998 !important;
            }
            [data-state="open"][data-radix-dialog-content] {
                z-index: 9999 !important;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Auto update map center when incidents change
    useEffect(() => {
        if (incidents.length > 0) {
            setMapCenter([incidents[0].lat, incidents[0].long]);
        }
    }, [incidents]);

    // Auto load with default range if no filters are set
    useEffect(() => {
        // Only auto-load if no date filters are present from server
        if (!filters.from && !filters.to) {
            // Set default range and trigger search
            const defaultRange = getDefaultDateRange();
            setLocal(prev => ({
                ...prev,
                from: defaultRange.from,
                to: defaultRange.to
            }));

            // Auto submit with default range
            setTimeout(() => {
                const query: Record<string, string> = {
                    from: defaultRange.from,
                    to: defaultRange.to
                };
                router.get('/security-ops/incident', query, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true
                });
            }, 100);
        }
    }, [filters.from, filters.to]);

    const validateDateRange = () => {
        if (!local.from || !local.to) {
            toast.error('Rentang waktu harus diisi!');
            return false;
        }

        const fromDate = new Date(local.from);
        const toDate = new Date(local.to);

        // Check if from date is after to date
        if (fromDate > toDate) {
            toast.error('Tanggal mulai tidak boleh lebih besar dari tanggal selesai!');
            return false;
        }

        // Check max range (90 days)
        const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 90) {
            toast.error('Rentang waktu maksimal adalah 90 hari!');
            return false;
        }

        return true;
    };

    const submit = () => {
        // Validate date range first
        if (!validateDateRange()) {
            return;
        }

        const query: Record<string, string> = {};
        if (local.q) query.q = local.q;
        if (local.category_id !== 'all') query.category_id = String(local.category_id);
        if (local.severity !== 'all') query.severity = String(local.severity);
        if (local.status !== 'all') query.status = String(local.status);
        if (local.priority !== 'all') query.priority = String(local.priority);

        // Always include date range (now required)
        query.from = local.from;
        query.to = local.to;

        router.get('/security-ops/incident', query, { preserveState: true, preserveScroll: true });
    };

    const viewIncident = (incident: Incident) => {
        setSelectedIncident(incident);
        setShowModal(true);

        // Auto zoom to incident location
        setMapCenter([incident.lat, incident.long]);
        setMapZoom(16); // Zoom in closer for specific incident
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedIncident(null);
        setNewFollowUp('');
        // Reset map to show all incidents
        setMapZoom(10);
        if (incidents.length > 0) {
            setMapCenter([incidents[0].lat, incidents[0].long]);
        }
    };

    const updateIncidentStatus = async (incidentId: number, status: string) => {
        setLoading(true);
        try {
            await incidentService.updateStatus(incidentId, { status });
            toast.success('Status berhasil diupdate');
        } catch (error) {
            console.error('Update status error:', error);
            toast.error('Gagal mengupdate status');
        } finally {
            setLoading(false);
        }
    };

    const updateIncidentPriority = async (incidentId: number, priority: string) => {
        setLoading(true);
        try {
            await incidentService.updatePriority(incidentId, { priority });
            toast.success('Prioritas berhasil diupdate');
        } catch (error) {
            console.error('Update priority error:', error);
            toast.error('Gagal mengupdate prioritas');
        } finally {
            setLoading(false);
        }
    };

    const addFollowUpAction = async (incidentId: number) => {
        if (!newFollowUp.trim()) return;

        setLoading(true);
        try {
            const response = await incidentService.addFollowUp(incidentId, {
                description: newFollowUp,
                created_by: 'Admin', // This should be the actual user name
            });

            // Update selected incident with new data
            if (response.data) {
                setSelectedIncident(response.data as Incident);
            }

            setNewFollowUp('');
            toast.success('Tindak lanjut berhasil ditambahkan');
        } catch (error) {
            console.error('Add follow up error:', error);
            toast.error('Gagal menambahkan tindak lanjut');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const exportParams = {
                q: local.q || undefined,
                category_id: local.category_id !== 'all' ? local.category_id : undefined,
                severity: local.severity !== 'all' ? local.severity : undefined,
                status: local.status !== 'all' ? local.status : undefined,
                priority: local.priority !== 'all' ? local.priority : undefined,
                from: local.from || undefined,
                to: local.to || undefined,
            };

            await incidentService.exportIncidents(exportParams);
            toast.success('Export berhasil diunduh');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Gagal mengexport data');
        } finally {
            setExporting(false);
        }
    };

    const columns: DataTableColumn<Incident>[] = [
        {
            key: 'kategori',
            header: 'Kategori / Lokasi',
            cell: (i) => (
                <div className="flex flex-col">
                    <span className="font-medium">{i.category?.name ?? 'Insiden'}</span>
                    <span className="text-xs text-muted-foreground">{i.location || '-'}</span>
                </div>
            ),
        },
        {
            key: 'waktu',
            header: 'Waktu',
            cell: (i) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">
                        {i.incident_at ? new Date(i.incident_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        }) : '-'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {i.incident_at ? new Date(i.incident_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : ''}
                    </span>
                </div>
            )
        },
        {
            key: 'severity',
            header: 'Severity',
            cell: (i) => (
                <span style={{ color: severityColor(i.severity) }} className="font-medium">
                    {i.severity ?? '-'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (i) => <Badge className={getStatusColor(i.status)}>{i.status_label ?? i.status ?? '-'}</Badge>,
        },
        {
            key: 'priority',
            header: 'Prioritas',
            cell: (i) => <Badge className={getPriorityColor(i.priority)}>{i.priority_label ?? i.priority ?? '-'}</Badge>,
        },
        {
            key: 'assigned',
            header: 'Petugas',
            cell: (i) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">
                        {i.assigned_to?.full_name ?? 'Belum ditugaskan'}
                    </span>
                    {i.reporter?.full_name && (
                        <span className="text-xs text-muted-foreground">
                            Pelapor: {i.reporter.full_name}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'deskripsi',
            header: 'Deskripsi',
            cell: (i) => (
                <div className="max-w-xs">
                    <p className="line-clamp-2 text-sm">{i.description ?? '-'}</p>
                    {i.related_name && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            Pihak terkait: {i.related_name}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'photo_url',
            header: 'Foto',
            cell: (i) =>
                i.photo_url ? (
                    <a href={i.photo_url} target="_blank" rel="noreferrer" className="inline-block">
                        <img src={i.photo_url} alt="Foto insiden" loading="lazy" className="h-12 w-16 rounded border object-cover" />
                    </a>
                ) : (
                    <span className="text-muted-foreground">-</span>
                ),
        },
        {
            key: 'actions',
            header: 'Aksi',
            cell: (i) => (
                <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => viewIncident(i)} className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Security Ops', href: '/security-ops/patroli' },
                { title: 'Laporan Kejadian', href: '/security-ops/incident' },
            ]}
        >
            <Head title="Laporan Kejadian" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Page Header */}
                <div className="flex flex-col items-start gap-2">
                    <h1 className="text-2xl font-semibold">Laporan Kejadian</h1>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        Visualisasi insiden pada peta serta daftar detail dengan filter kategori, tingkat keparahan dan rentang tanggal.
                    </p>
                </div>

                {/* Map */}
                <div className="h-[420px] w-full overflow-hidden rounded-md border relative z-10">
                    <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        style={{ height: '100%', width: '100%', zIndex: 1 }}
                        scrollWheelZoom
                        ref={mapRef}
                        key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`} // Force re-render when center/zoom changes
                        zoomControl={true}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                        {incidents.map((i: Incident) => (
                            <CircleMarker
                                key={i.id}
                                center={[i.lat, i.long]}
                                radius={selectedIncident?.id === i.id ? 12 : 8} // Larger radius for selected incident
                                pathOptions={{
                                    color: selectedIncident?.id === i.id ? '#000' : severityColor(i.severity),
                                    fillOpacity: selectedIncident?.id === i.id ? 1 : 0.8,
                                    weight: selectedIncident?.id === i.id ? 3 : 2
                                }}
                                eventHandlers={{
                                    click: () => viewIncident(i)
                                }}
                            >
                                <Popup>
                                    <div className="space-y-1">
                                        <div className="font-medium">{i.category?.name ?? 'Insiden'}</div>
                                        {i.location && <div className="text-xs">{i.location}</div>}
                                        {i.incident_at && (
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(i.incident_at).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        )}
                                        {i.severity && (
                                            <div className="text-xs">
                                                Severity: <span className="font-medium">{i.severity}</span>
                                            </div>
                                        )}
                                        {i.priority && (
                                            <div className="text-xs">
                                                Prioritas: <span className="font-medium">{i.priority_label || i.priority}</span>
                                            </div>
                                        )}
                                        {i.status && (
                                            <div className="text-xs">
                                                Status: <span className="font-medium">{i.status_label || i.status}</span>
                                            </div>
                                        )}
                                        {i.related_name && <div className="text-xs">Pihak terkait: {i.related_name}</div>}
                                        {i.description && <div className="pt-1 text-xs">{i.description}</div>}
                                        <div className="pt-1">
                                            <button
                                                onClick={() => viewIncident(i)}
                                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                            >
                                                Lihat Detail
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        ))}
                    </MapContainer>
                </div>

                {/* Filters */}
                <div className="bg-background border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                            🔍 Filter Data Insiden
                        </h3>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>Menampilkan</span>
                            <Badge variant="secondary" className="text-xs">
                                {incidents.length} insiden
                            </Badge>
                            {local.from && local.to && (
                                <span className="text-xs">
                                    periode {new Date(local.from).toLocaleDateString('id-ID')} - {new Date(local.to).toLocaleDateString('id-ID')}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Search Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <Label className="text-sm font-medium">Pencarian</Label>
                            <Input
                                value={local.q}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                placeholder="Cari berdasarkan lokasi, deskripsi, atau pihak terkait..."
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Kategori</Label>
                            <Select value={local.category_id} onValueChange={(v) => setLocal((s) => ({ ...s, category_id: v }))}>
                                <SelectTrigger className="mt-1 relative z-50">
                                    <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                                <SelectContent className="z-[10000]" position="popper" sideOffset={5}>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {categories.map((c: Category) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Filter Options Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <Label className="text-sm font-medium">Severity</Label>
                            <Select value={local.severity} onValueChange={(v) => setLocal((s) => ({ ...s, severity: v }))}>
                                <SelectTrigger className="mt-1 relative z-50">
                                    <SelectValue placeholder="Severity" />
                                </SelectTrigger>
                                <SelectContent className="z-[10000]" position="popper" sideOffset={5}>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="Tinggi">🔴 Tinggi</SelectItem>
                                    <SelectItem value="Sedang">🟡 Sedang</SelectItem>
                                    <SelectItem value="Rendah">🟢 Rendah</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Status</Label>
                            <Select value={local.status} onValueChange={(v) => setLocal((s) => ({ ...s, status: v }))}>
                                <SelectTrigger className="mt-1 relative z-50">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="z-[10000]" position="popper" sideOffset={5}>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="reported">📝 Dilaporkan</SelectItem>
                                    <SelectItem value="investigating">🔍 Investigasi</SelectItem>
                                    <SelectItem value="resolved">✅ Terselesaikan</SelectItem>
                                    <SelectItem value="closed">🔒 Ditutup</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Prioritas</Label>
                            <Select value={local.priority} onValueChange={(v) => setLocal((s) => ({ ...s, priority: v }))}>
                                <SelectTrigger className="mt-1 relative z-50">
                                    <SelectValue placeholder="Prioritas" />
                                </SelectTrigger>
                                <SelectContent className="z-[10000]" position="popper" sideOffset={5}>
                                    <SelectItem value="all">Semua Prioritas</SelectItem>
                                    <SelectItem value="critical">🚨 Kritis</SelectItem>
                                    <SelectItem value="high">⚡ Tinggi</SelectItem>
                                    <SelectItem value="medium">📋 Sedang</SelectItem>
                                    <SelectItem value="low">📝 Rendah</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col">
                            <Label className="text-sm font-medium mb-1">Quick Preset</Label>
                            <div className="grid grid-cols-3 gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => {
                                        const today = new Date();
                                        const sevenDaysAgo = new Date();
                                        sevenDaysAgo.setDate(today.getDate() - 7);
                                        setLocal(s => ({
                                            ...s,
                                            from: sevenDaysAgo.toISOString().split('T')[0],
                                            to: today.toISOString().split('T')[0]
                                        }));
                                    }}
                                >
                                    7H
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => {
                                        const today = new Date();
                                        const thirtyDaysAgo = new Date();
                                        thirtyDaysAgo.setDate(today.getDate() - 30);
                                        setLocal(s => ({
                                            ...s,
                                            from: thirtyDaysAgo.toISOString().split('T')[0],
                                            to: today.toISOString().split('T')[0]
                                        }));
                                    }}
                                >
                                    30H
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => {
                                        const today = new Date();
                                        const sixtyDaysAgo = new Date();
                                        sixtyDaysAgo.setDate(today.getDate() - 60);
                                        setLocal(s => ({
                                            ...s,
                                            from: sixtyDaysAgo.toISOString().split('T')[0],
                                            to: today.toISOString().split('T')[0]
                                        }));
                                    }}
                                >
                                    60H
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Date Range Row */}
                    <div className="bg-muted/30 rounded-md p-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium">
                                    📅 Rentang Waktu <span className="text-red-500">*</span>
                                </Label>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Wajib diisi, maksimal 90 hari per pencarian
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                                <div>Default: 60 hari terakhir</div>
                                <div>Preset: 7H, 30H, 60H</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Tanggal Mulai</Label>
                                <Input
                                    type="date"
                                    value={local.from}
                                    onChange={(e) => setLocal((s) => ({ ...s, from: e.target.value }))}
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Tanggal Selesai</Label>
                                <Input
                                    type="date"
                                    value={local.to}
                                    onChange={(e) => setLocal((s) => ({ ...s, to: e.target.value }))}
                                    required
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2 border-t">
                        <div className="flex gap-2">
                            <Button onClick={submit} className="min-w-24">
                                🔍 Terapkan Filter
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const defaultRange = getDefaultDateRange();
                                    setLocal({
                                        q: '',
                                        category_id: 'all',
                                        severity: 'all',
                                        status: 'all',
                                        priority: 'all',
                                        from: defaultRange.from,
                                        to: defaultRange.to,
                                    });
                                }}
                            >
                                🔄 Reset
                            </Button>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={exporting || incidents.length === 0}
                            className="min-w-24"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {exporting ? 'Mengexport...' : `📊 Export${incidents.length > 0 ? ` (${incidents.length})` : ''}`}
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex flex-col gap-2">
                    <h2 className="text-base font-medium">
                        Riwayat Insiden <span className="font-normal text-muted-foreground">({incidents.length})</span>
                    </h2>
                    <DataTable
                        data={incidents}
                        columns={columns}
                        emptyIcon={AlertTriangle}
                        emptyTitle="Belum ada insiden"
                        emptyDescription="Ubah filter atau tambahkan insiden baru untuk melihat daftar."
                    />
                </div>

                {/* Incident Detail Modal */}
                <Dialog open={showModal} onOpenChange={(open) => {
                    setShowModal(open);
                    if (!open) {
                        closeModal();
                    }
                }}>
                    <DialogContent className="z-[9999] max-h-[90vh] !max-w-6xl overflow-y-auto fixed">
                        <DialogHeader className="border-b pb-4">
                            <DialogTitle className="flex items-center justify-between">
                                <div className="flex flex-col gap-2">
                                    <span className="flex items-center">
                                        <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                                        Detail Insiden #{selectedIncident?.id}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Badge className={getStatusColor(selectedIncident?.status)}>
                                            {selectedIncident?.status_label ?? selectedIncident?.status ?? '-'}
                                        </Badge>
                                        <Badge className={getPriorityColor(selectedIncident?.priority)}>
                                            {selectedIncident?.priority_label ?? selectedIncident?.priority ?? '-'}
                                        </Badge>
                                        {selectedIncident?.category && (
                                            <Badge variant="outline" className="text-xs">
                                                {selectedIncident.category?.name}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // Reset map to show all incidents
                                        setMapZoom(10);
                                        if (incidents.length > 0) {
                                            setMapCenter([incidents[0].lat, incidents[0].long]);
                                        }
                                    }}
                                >
                                    Lihat Semua
                                </Button>
                            </DialogTitle>
                        </DialogHeader>

                        {selectedIncident && (
                            <div className="space-y-6">
                                {/* Photo Section - Full Width at Top */}
                                {selectedIncident.photo_url && (
                                    <div className="w-full">
                                        <a href={selectedIncident.photo_url} target="_blank" rel="noreferrer">
                                            <img
                                                src={selectedIncident.photo_url}
                                                alt="Foto insiden"
                                                className="w-full h-64 rounded-lg border object-contain shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                            />
                                        </a>
                                    </div>
                                )}

                                {/* Information Grid */}
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {/* Left Column - Basic Info */}
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium">Kategori</Label>
                                            <p className="mt-1 text-sm">{selectedIncident.category?.name || '-'}</p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Lokasi</Label>
                                            <p className="mt-1 text-sm">{selectedIncident.location || '-'}</p>
                                            {selectedIncident.lat && selectedIncident.long && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    GPS: {selectedIncident.lat.toFixed(6)}, {selectedIncident.long.toFixed(6)}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Waktu Kejadian</Label>
                                            <p className="mt-1 text-sm">
                                                {selectedIncident.incident_at ?
                                                    new Date(selectedIncident.incident_at).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : '-'
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Severity</Label>
                                            <p className="mt-1 text-sm" style={{ color: severityColor(selectedIncident.severity) }}>
                                                {selectedIncident.severity || '-'}
                                            </p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Status</Label>
                                            <div className="mt-1">
                                                <Select
                                                    value={selectedIncident.status || 'reported'}
                                                    onValueChange={(value) => {
                                                        updateIncidentStatus(selectedIncident.id, value);
                                                        setSelectedIncident({ ...selectedIncident, status: value });
                                                    }}
                                                    disabled={loading}
                                                >
                                                    <SelectTrigger className="w-full relative z-50">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className='z-[10000]' position="popper" sideOffset={5}>
                                                        <SelectItem value="reported">Dilaporkan</SelectItem>
                                                        <SelectItem value="investigating">Investigasi</SelectItem>
                                                        <SelectItem value="resolved">Terselesaikan</SelectItem>
                                                        <SelectItem value="closed">Ditutup</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Prioritas</Label>
                                            <div className="mt-1">
                                                <Select
                                                    value={selectedIncident.priority || 'low'}
                                                    onValueChange={(value) => {
                                                        updateIncidentPriority(selectedIncident.id, value);
                                                        setSelectedIncident({ ...selectedIncident, priority: value });
                                                    }}
                                                    disabled={loading}
                                                >
                                                    <SelectTrigger className="w-full relative z-50">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className='z-[10000]' position="popper" sideOffset={5}>
                                                        <SelectItem value="low">Rendah</SelectItem>
                                                        <SelectItem value="medium">Sedang</SelectItem>
                                                        <SelectItem value="high">Tinggi</SelectItem>
                                                        <SelectItem value="critical">Kritis</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Details */}
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium">Pelapor</Label>
                                            <p className="mt-1 text-sm">{selectedIncident.reporter?.full_name || '-'}</p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Petugas Ditugaskan</Label>
                                            <p className="mt-1 text-sm">{selectedIncident.assigned_to?.full_name || 'Belum ditugaskan'}</p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Deskripsi</Label>
                                            <p className="mt-1 text-sm whitespace-pre-wrap">{selectedIncident.description || '-'}</p>
                                        </div>

                                        {(selectedIncident.related_name || selectedIncident.related_status) && (
                                            <div>
                                                <Label className="text-sm font-medium">Pihak Terkait</Label>
                                                <div className="mt-1 space-y-1">
                                                    {selectedIncident.related_name && (
                                                        <p className="text-sm">{selectedIncident.related_name}</p>
                                                    )}
                                                    {selectedIncident.related_status && (
                                                        <p className="text-xs text-muted-foreground">Status: {selectedIncident.related_status}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <Label className="text-sm font-medium">Tindakan Yang Diambil</Label>
                                            <p className="mt-1 text-sm whitespace-pre-wrap">{selectedIncident.handling_steps || '-'}</p>
                                        </div>

                                        {(selectedIncident.resolution_notes || selectedIncident.resolved_at) && (
                                            <div>
                                                <Label className="text-sm font-medium">Catatan Penyelesaian</Label>
                                                <div className="mt-1 space-y-1">
                                                    {selectedIncident.resolution_notes && (
                                                        <p className="text-sm whitespace-pre-wrap">{selectedIncident.resolution_notes}</p>
                                                    )}
                                                    {selectedIncident.resolved_at && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Diselesaikan: {new Date(selectedIncident.resolved_at).toLocaleDateString('id-ID', {
                                                                day: '2-digit',
                                                                month: 'long',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Follow-up Actions Section */}
                        {selectedIncident && (
                            <div className="mt-6 border-t pt-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="flex items-center text-lg font-medium">
                                        <MessageSquare className="mr-2 h-5 w-5" />
                                        Tindak Lanjut
                                    </h4>
                                </div>

                                {/* Existing Follow-ups */}
                                <div className="mb-4 space-y-3 max-h-64 overflow-y-auto">
                                    {selectedIncident.follow_up_actions && selectedIncident.follow_up_actions.length > 0 ? (
                                        selectedIncident.follow_up_actions.map((action, index) => (
                                            <div key={index} className="rounded-lg border bg-background p-3 shadow-sm">
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className="font-medium text-sm">{action.created_by || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(action.created_at).toLocaleDateString('id-ID', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{action.description}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-muted-foreground italic">Belum ada tindak lanjut</p>
                                        </div>
                                    )}
                                </div>

                                {/* Add New Follow-up */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium text-muted-foreground">Tambah Tindak Lanjut</Label>
                                    <Textarea
                                        value={newFollowUp}
                                        onChange={(e) => setNewFollowUp(e.target.value)}
                                        placeholder="Masukkan tindak lanjut..."
                                        className="w-full"
                                        rows={3}
                                    />
                                    <Button
                                        onClick={() => addFollowUpAction(selectedIncident.id)}
                                        disabled={!newFollowUp.trim() || loading}
                                        className="w-full"
                                    >
                                        {loading ? 'Menambahkan...' : 'Tambah Tindak Lanjut'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
