import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Edit, MapPin, Maximize, Target } from 'lucide-react';
import { useState, useRef } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

interface Checkpoint {
    id: number;
    name: string;
    sequence: number;
    active: boolean;
    latitude?: number;
    longitude?: number;
    radius_m?: number;
}
interface Props {
    project: { id: number; name: string };
    checkpoints: Checkpoint[];
}

const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function ClickHandler({ onSet, onEditSet, editMode, mapRef }: {
    onSet: (lat: number, lng: number) => void;
    onEditSet?: (lat: number, lng: number) => void;
    editMode?: boolean;
    mapRef?: React.MutableRefObject<L.Map | null>;
}) {
    const map = useMapEvents({
        click(e) {
            if (editMode && onEditSet) {
                onEditSet(e.latlng.lat, e.latlng.lng);
            } else {
                onSet(e.latlng.lat, e.latlng.lng);
            }
        },
    });

    // Set map reference
    if (mapRef && !mapRef.current) {
        mapRef.current = map;
    }

    return null;
}

// Helper function to safely format coordinates
const formatCoordinate = (coord: number | string | undefined): string => {
    if (!coord) return '0.000000';
    const num = typeof coord === 'number' ? coord : parseFloat(coord.toString());
    return isNaN(num) ? '0.000000' : num.toFixed(6);
};

export default function PatroliCheckpoints({ project, checkpoints }: Props) {
    const { data, setData, post, processing, reset } = useForm({ name: '', sequence: 1, latitude: '', longitude: '', radius_m: 25 });
    const { data: editData, setData: setEditData, put, processing: editProcessing, reset: resetEdit } = useForm({
        name: '', sequence: 1, latitude: '', longitude: '', radius_m: 25
    });

    const [preview, setPreview] = useState<{ lat: number; lng: number } | null>(null);
    const [editingCheckpoint, setEditingCheckpoint] = useState<number | null>(null);
    const [editPreview, setEditPreview] = useState<{ lat: number; lng: number } | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/security-ops/projects/${project.id}/patroli-checkpoints`, {
            onSuccess: () => {
                reset();
                setPreview(null);
            },
        });
    };
    const deleteCheckpoint = (id: number) => {
        router.delete(`/security-ops/patroli-checkpoints/${id}`, {
            preserveScroll: true,
        });
    };

    const startEdit = (checkpoint: Checkpoint) => {
        setEditingCheckpoint(checkpoint.id);
        setEditData({
            name: checkpoint.name,
            sequence: checkpoint.sequence,
            latitude: checkpoint.latitude?.toString() || '',
            longitude: checkpoint.longitude?.toString() || '',
            radius_m: checkpoint.radius_m || 25,
        });
        if (checkpoint.latitude && checkpoint.longitude) {
            setEditPreview({ lat: checkpoint.latitude, lng: checkpoint.longitude });
            // Auto focus on the checkpoint being edited
            setTimeout(() => focusOnCheckpoint(checkpoint), 100);
        }
    };

    const cancelEdit = () => {
        setEditingCheckpoint(null);
        resetEdit();
        setEditPreview(null);
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCheckpoint) return;

        put(`/security-ops/patroli-checkpoints/${editingCheckpoint}`, {
            onSuccess: () => {
                cancelEdit();
            },
        });
    };

    // Map control functions
    const fitMapToCheckpoints = () => {
        if (!mapRef.current || checkpoints.length === 0) return;

        const bounds = new L.LatLngBounds([]);
        checkpoints.forEach(c => {
            if (c.latitude && c.longitude) {
                bounds.extend([c.latitude, c.longitude]);
            }
        });

        if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds, { padding: [20, 20] });
        }
    };

    const focusOnCheckpoint = (checkpoint: Checkpoint) => {
        if (!mapRef.current || !checkpoint.latitude || !checkpoint.longitude) return;
        mapRef.current.setView([checkpoint.latitude, checkpoint.longitude], 17);
    };

    const resetMapView = () => {
        if (!mapRef.current) return;
        if (checkpoints.length > 0) {
            fitMapToCheckpoints();
        } else {
            mapRef.current.setView([-6.2, 106.8166], 10);
        }
    };
    const center: [number, number] = editPreview
        ? [editPreview.lat, editPreview.lng]
        : preview
        ? [preview.lat, preview.lng]
        : editingCheckpoint
        ? (() => {
            const editingCP = checkpoints.find(c => c.id === editingCheckpoint);
            return editingCP?.latitude && editingCP?.longitude
                ? [Number(editingCP.latitude), Number(editingCP.longitude)]
                : [-6.2, 106.8166];
          })()
        : checkpoints[0]?.latitude
          ? [Number(checkpoints[0].latitude!), Number(checkpoints[0].longitude!)]
          : [-6.2, 106.8166];
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Security Ops', href: '/security-ops' },
                { title: 'Patroli', href: '/security-ops/patroli' },
                { title: 'Projek', href: '/security-ops/projects' },
                { title: `Checkpoint - ${project.name}`, href: '#' },
            ]}
        >
            <Head title={`Checkpoints - ${project.name}`} />
            <div className="mx-auto w-full px-4 py-4 pb-24">
                {/* Project Header */}
                <div className="mb-6 rounded-lg border bg-gradient-to-r from-primary/5 to-background p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                                <MapPin className="h-6 w-6 text-secondary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
                                <p className="mt-1 text-sm text-muted-foreground">Konfigurasi checkpoint dan rute patroli untuk proyek ini</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => router.visit('/security-ops/patroli')}>
                                Lihat Data Patroli
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => router.visit('/security-ops/projects')}>
                                Kembali ke Projek
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                        <MapPin className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Peta Checkpoint</h3>
                                        <p className="text-sm text-muted-foreground">{project.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-4 text-sm mr-4">
                                        <div className="flex items-center gap-1">
                                            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                                            <span className="text-xs">Baru</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                            <span className="text-xs">Tersimpan</span>
                                        </div>
                                    </div>

                                    {/* Map Control Buttons */}
                                    <div className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={fitMapToCheckpoints}
                                            disabled={checkpoints.length === 0}
                                            className="text-xs h-8"
                                            title="Lihat semua checkpoint"
                                        >
                                            <Maximize className="h-3 w-3 mr-1" />
                                            Fit Map
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={resetMapView}
                                            className="text-xs h-8"
                                            title="Reset tampilan peta"
                                        >
                                            <Target className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Klik pada peta untuk menentukan lokasi checkpoint baru • Total: {checkpoints.length} checkpoint
                            </p>
                        </CardHeader>
                        <CardContent className="relative h-[520px] p-0">
                            {/* Map Instructions Overlay */}
                            {checkpoints.length === 0 && (
                                <div className="absolute top-4 right-4 left-4 z-[1000] rounded-lg border bg-white/90 p-3 shadow-sm backdrop-blur-sm">
                                    <div className="text-sm font-medium text-blue-600">🎯 Panduan Membuat Checkpoint</div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        1. Klik lokasi pada peta untuk menentukan posisi
                                        <br />
                                        2. Isi nama dan pengaturan di panel kanan
                                        <br />
                                        3. Klik "Simpan Checkpoint" untuk menyimpan
                                    </div>
                                </div>
                            )}

                            <MapContainer
                                center={center}
                                zoom={15}
                                style={{ height: '100%', width: '100%', zIndex: 10 }}
                                scrollWheelZoom
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                                <ClickHandler
                                    editMode={!!editingCheckpoint}
                                    mapRef={mapRef}
                                    onSet={(lat, lng) => {
                                        setData('latitude', lat.toFixed(6));
                                        setData('longitude', lng.toFixed(6));
                                        setPreview({ lat, lng });
                                    }}
                                    onEditSet={(lat, lng) => {
                                        setEditData('latitude', lat.toFixed(6));
                                        setEditData('longitude', lng.toFixed(6));
                                        setEditPreview({ lat, lng });
                                    }}
                                />

                                {/* Preview Marker (New Checkpoint) */}
                                {preview && !editingCheckpoint && (
                                    <>
                                        <Marker position={[preview.lat, preview.lng]} icon={defaultIcon} />
                                        {data.radius_m && (
                                            <Circle
                                                center={[preview.lat, preview.lng]}
                                                radius={Number(data.radius_m)}
                                                pathOptions={{
                                                    color: 'blue',
                                                    fillColor: 'blue',
                                                    fillOpacity: 0.1,
                                                    weight: 2,
                                                    dashArray: '5, 5',
                                                }}
                                            />
                                        )}
                                    </>
                                )}

                                {/* Edit Preview Marker */}
                                {editPreview && editingCheckpoint && (
                                    <>
                                        <Marker position={[editPreview.lat, editPreview.lng]} icon={defaultIcon} />
                                        {editData.radius_m && (
                                            <Circle
                                                center={[editPreview.lat, editPreview.lng]}
                                                radius={Number(editData.radius_m)}
                                                pathOptions={{
                                                    color: 'orange',
                                                    fillColor: 'orange',
                                                    fillOpacity: 0.1,
                                                    weight: 2,
                                                    dashArray: '5, 5',
                                                }}
                                            />
                                        )}
                                    </>
                                )}

                                {/* Existing Checkpoints */}
                                {checkpoints.map(
                                    (c, index) =>
                                        c.latitude &&
                                        c.longitude && (
                                            <div key={c.id}>
                                                <Marker
                                                    position={[c.latitude, c.longitude]}
                                                    icon={
                                                        new L.DivIcon({
                                                            html: `<div style="background: ${editingCheckpoint === c.id ? '#f97316' : 'green'}; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); ${editingCheckpoint === c.id ? 'animation: pulse 1.5s infinite;' : ''}">${c.sequence || index + 1}</div>`,
                                                            iconSize: [24, 24],
                                                            className: `custom-checkpoint-marker ${editingCheckpoint === c.id ? 'editing' : ''}`,
                                                        })
                                                    }
                                                />
                                                {c.radius_m && (
                                                    <Circle
                                                        center={[c.latitude, c.longitude]}
                                                        radius={c.radius_m}
                                                        pathOptions={{
                                                            color: editingCheckpoint === c.id ? '#f97316' : 'green',
                                                            fillColor: editingCheckpoint === c.id ? '#f97316' : 'green',
                                                            fillOpacity: editingCheckpoint === c.id ? 0.15 : 0.1,
                                                            weight: editingCheckpoint === c.id ? 3 : 2,
                                                            dashArray: editingCheckpoint === c.id ? '10, 5' : undefined,
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        ),
                                )}
                            </MapContainer>

                            {/* Map Controls */}
                            {preview && !editingCheckpoint && (
                                <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border bg-white p-2 shadow-sm">
                                    <div className="text-xs font-medium text-blue-600">📍 Lokasi Dipilih</div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatCoordinate(preview.lat)}, {formatCoordinate(preview.lng)}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-1 h-6 text-xs"
                                        onClick={() => {
                                            setPreview(null);
                                            setData('latitude', '');
                                            setData('longitude', '');
                                        }}
                                    >
                                        ❌ Batal
                                    </Button>
                                </div>
                            )}

                            {/* Edit Map Controls */}
                            {editPreview && editingCheckpoint && (
                                <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border bg-orange-50 p-3 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs font-medium text-orange-600">🎯 Mode Edit</div>
                                        <div className="text-xs text-orange-600">#{editingCheckpoint}</div>
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-2">
                                        📍 {formatCoordinate(editPreview.lat)}, {formatCoordinate(editPreview.lng)}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 text-xs border-orange-200 hover:bg-orange-100"
                                            onClick={() => {
                                                setEditPreview(null);
                                                // Reset to original coordinates if available
                                                const original = checkpoints.find(c => c.id === editingCheckpoint);
                                                if (original) {
                                                    setEditData('latitude', original.latitude?.toString() || '');
                                                    setEditData('longitude', original.longitude?.toString() || '');
                                                }
                                            }}
                                        >
                                            ↶ Reset
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 text-xs border-orange-200 hover:bg-orange-100"
                                            onClick={() => {
                                                const original = checkpoints.find(c => c.id === editingCheckpoint);
                                                if (original) {
                                                    focusOnCheckpoint(original);
                                                }
                                            }}
                                        >
                                            🎯 Focus
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                                    <MapPin className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Tambah Checkpoint</h3>
                                    <p className="text-sm text-muted-foreground">Konfigurasi checkpoint baru</p>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <form onSubmit={submit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Nama Checkpoint</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Contoh: Gate A, Security Post 1, dll"
                                        required
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-sm font-medium text-muted-foreground">Koordinat Lokasi</Label>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-gray-400">Latitude</Label>
                                            <Input
                                                value={data.latitude}
                                                onChange={(e) => setData('latitude', e.target.value)}
                                                placeholder="Klik peta untuk mengisi"
                                                className={!data.latitude ? 'border-dashed border-gray-300' : ''}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-gray-400">Longitude</Label>
                                            <Input
                                                value={data.longitude}
                                                onChange={(e) => setData('longitude', e.target.value)}
                                                placeholder="Klik peta untuk mengisi"
                                                className={!data.longitude ? 'border-dashed border-gray-300' : ''}
                                            />
                                        </div>
                                    </div>
                                    {!data.latitude && !data.longitude && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-600">
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="h-4 w-4" />
                                                <strong>Tips:</strong> Klik pada peta untuk otomatis mengisi koordinat
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Radius Area (meter)</Label>
                                        <Input
                                            type="number"
                                            value={data.radius_m}
                                            onChange={(e) => setData('radius_m', Number(e.target.value))}
                                            min={5}
                                            max={500}
                                            placeholder="25"
                                        />
                                        <p className="text-xs text-gray-400">Radius deteksi: 5-500 meter</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Urutan Checkpoint</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={data.sequence}
                                            onChange={(e) => setData('sequence', Number(e.target.value))}
                                            placeholder="1"
                                        />
                                        <p className="text-xs text-gray-400">Urutan dalam rute patroli</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <Button type="submit" disabled={processing || !data.latitude || !data.longitude || !data.name} className="w-full">
                                        {processing ? 'Menyimpan...' : 'Simpan Checkpoint'}
                                    </Button>
                                    {(!data.latitude || !data.longitude || !data.name) && (
                                        <p className="mt-2 text-center text-xs text-amber-600">Pastikan nama dan koordinat sudah diisi</p>
                                    )}
                                </div>
                            </form>
                            <div className="space-y-4 border-t pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                                            <MapPin className="h-3 w-3 text-foreground" />
                                        </div>
                                        <h4 className="text-sm font-medium text-foreground">Daftar Checkpoint ({checkpoints.length})</h4>
                                    </div>
                                    {checkpoints.length > 0 && (
                                        <Button size="sm" variant="outline" className="text-xs">
                                            Lihat Rute
                                        </Button>
                                    )}
                                </div>

                                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                                    {checkpoints.length === 0 ? (
                                        <div className="py-12 text-center text-foreground">
                                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                                <MapPin className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <div className="text-sm font-medium">Belum ada checkpoint</div>
                                            <div className="mt-1 text-xs text-muted-foreground">Klik pada peta untuk menambah checkpoint pertama</div>
                                        </div>
                                    ) : (
                                        checkpoints
                                            .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
                                            .map((c, idx) => (
                                                <div
                                                    key={c.id}
                                                    className="space-y-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm"
                                                >
                                                    {editingCheckpoint === c.id ? (
                                                        // Edit Form
                                                        <form onSubmit={submitEdit} className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-100">
                                                                        <Edit className="h-3 w-3 text-orange-600" />
                                                                    </div>
                                                                    <h5 className="text-sm font-medium">Edit Checkpoint</h5>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={cancelEdit}
                                                                    className="text-xs"
                                                                >
                                                                    Batal
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-medium text-muted-foreground">Nama</Label>
                                                                    <Input
                                                                        value={editData.name}
                                                                        onChange={(e) => setEditData('name', e.target.value)}
                                                                        placeholder="Nama checkpoint"
                                                                        className="text-sm"
                                                                    />
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs font-medium text-muted-foreground">Urutan</Label>
                                                                        <Input
                                                                            type="number"
                                                                            min={1}
                                                                            value={editData.sequence}
                                                                            onChange={(e) => setEditData('sequence', Number(e.target.value))}
                                                                            className="text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs font-medium text-muted-foreground">Radius (m)</Label>
                                                                        <Input
                                                                            type="number"
                                                                            min={5}
                                                                            max={500}
                                                                            value={editData.radius_m}
                                                                            onChange={(e) => setEditData('radius_m', Number(e.target.value))}
                                                                            className="text-sm"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs font-medium text-muted-foreground">Latitude</Label>
                                                                        <Input
                                                                            value={editData.latitude}
                                                                            onChange={(e) => setEditData('latitude', e.target.value)}
                                                                            placeholder="Klik peta"
                                                                            className="text-xs font-mono"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs font-medium text-muted-foreground">Longitude</Label>
                                                                        <Input
                                                                            value={editData.longitude}
                                                                            onChange={(e) => setEditData('longitude', e.target.value)}
                                                                            placeholder="Klik peta"
                                                                            className="text-xs font-mono"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                                                                    <MapPin className="h-3 w-3 inline mr-1" />
                                                                    Klik peta untuk update koordinat
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2 pt-2 border-t">
                                                                <Button
                                                                    type="submit"
                                                                    size="sm"
                                                                    disabled={editProcessing || !editData.name || !editData.latitude || !editData.longitude}
                                                                    className="flex-1 text-xs"
                                                                >
                                                                    {editProcessing ? 'Menyimpan...' : 'Simpan'}
                                                                </Button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        // View Mode
                                                        <div className="flex items-start justify-between">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="mb-2 flex items-center space-x-3">
                                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-semibold text-white">
                                                                        {c.sequence || idx + 1}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <h5 className="truncate text-sm font-medium text-foreground">{c.name}</h5>
                                                                        <div
                                                                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                                                                        >
                                                                            {c.active ? 'Aktif' : 'Nonaktif'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1 text-xs text-muted-foreground">
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="font-medium">Radius:</span>
                                                                        <span>{c.radius_m}m</span>
                                                                    </div>
                                                                    {c.latitude && c.longitude && (
                                                                        <div className="flex items-center space-x-2 font-mono">
                                                                            <span className="font-medium">GPS:</span>
                                                                            <span>
                                                                                {formatCoordinate(c.latitude)}, {formatCoordinate(c.longitude)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => focusOnCheckpoint(c)}
                                                                    className="text-xs"
                                                                    title="Focus pada peta"
                                                                >
                                                                    <Target className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => startEdit(c)}
                                                                    className="text-xs"
                                                                >
                                                                    <Edit className="h-3 w-3 mr-1" />
                                                                    Edit
                                                                </Button>
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <Button variant="destructive" size="sm" className="text-xs">
                                                                            Hapus
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Hapus Checkpoint?</DialogTitle>
                                                                            <DialogDescription>
                                                                                Yakin ingin menghapus checkpoint "<strong>{c.name}</strong>"? Tindakan ini
                                                                                tidak dapat dibatalkan dan akan mempengaruhi rute patroli.
                                                                            </DialogDescription>
                                                                        </DialogHeader>
                                                                        <DialogFooter>
                                                                            <DialogClose asChild>
                                                                                <Button variant="outline">Batal</Button>
                                                                            </DialogClose>
                                                                            <Button variant="destructive" onClick={() => deleteCheckpoint(c.id)}>
                                                                                Hapus Checkpoint
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                    )}
                                </div>

                                {checkpoints.length > 0 && (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-600">
                                        <div className="flex items-center space-x-2">
                                            <MapPin className="h-4 w-4" />
                                            <span>
                                                <strong>Tips:</strong> Checkpoint akan dikunjungi sesuai urutan sequence saat patroli berlangsung
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
