import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, ImageIcon, ArrowLeft, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface PatroliFile { id: number; file_path: string; }
interface Patroli {
  id: number;
  start_time: string | null;
  end_time: string | null;
  note?: string | null;
  status: string;
  project?: { id: number; name: string } | null;
  checkpoint?: { id: number; name: string } | null;
  files: PatroliFile[];
  latitude?: number | string | null;
  longitude?: number | string | null;
}
interface GeofenceInfo { distance_m: number; radius_m: number; inside: boolean; remaining_m: number; }
interface Props { patroli: Patroli; geofence?: GeofenceInfo | null; }

interface WindowWithZiggy extends Window { Ziggy?: { routes?: Record<string, unknown> } }

function statusVariant(status: string) {
  switch (status) {
    case 'in_progress': return 'default';
    case 'completed': return 'secondary';
    case 'missed': return 'destructive';
    default: return 'outline';
  }
}

function humanStatus(status: string) {
  switch (status) {
    case 'in_progress': return 'Sedang Berlangsung';
    case 'completed': return 'Selesai';
    case 'missed': return 'Terlewat';
    default: return status;
  }
}

function isImage(path: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(path);
}

function fileName(path: string) {
  return path.split('/').pop() || path;
}

function computeDuration(start?: string | null, end?: string | null) {
  if (!start) return '-';
  const timeOnlyRegex = /^\d{2}:\d{2}(?::\d{2})?$/; // HH:MM or HH:MM:SS
  let diffMinutes: number | null = null;

  if (timeOnlyRegex.test(start) && (!end || timeOnlyRegex.test(end))) {
    const [sh, sm, ss = '0'] = start.split(':');
    const startMin = parseInt(sh, 10) * 60 + parseInt(sm, 10) + parseInt(ss, 10) / 60;
    const endStr = end ? end : new Date();
    let endMin: number;
    if (typeof endStr === 'string') {
      const [eh, em, es = '0'] = endStr.split(':');
      endMin = parseInt(eh, 10) * 60 + parseInt(em, 10) + parseInt(es, 10) / 60;
    } else {
      endMin = endStr.getHours() * 60 + endStr.getMinutes() + endStr.getSeconds() / 60;
    }
    // handle possible cross-midnight
    if (endMin < startMin) endMin += 24 * 60;
    diffMinutes = Math.max(0, Math.floor(endMin - startMin));
  } else {
    // Fallback: attempt full Date parsing
    try {
      const s = new Date(start);
      const e = end ? new Date(end) : new Date();
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const ms = e.getTime() - s.getTime();
        if (ms >= 0) diffMinutes = Math.floor(ms / 60000);
      }
    } catch {/* ignore */}
  }
  if (diffMinutes === null) return '-';
  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;
  return h > 0 ? `${h}j ${m}m` : `${m}m`;
}

function MapLink({ lat, lng }: { lat?: number | string | null; lng?: number | string | null }) {
  if (!lat || !lng) return <span className="text-muted-foreground text-xs">Koordinat tidak tersedia</span>;
  const href = `https://www.google.com/maps?q=${lat},${lng}`;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
      <ExternalLink className="h-3 w-3" /> Google Maps
    </a>
  );
}

export default function PatroliShow({ patroli, geofence }: Props) {
  // Normalisasi koordinat ke number
  const lat = patroli.latitude !== null && patroli.latitude !== undefined ? Number(patroli.latitude) : null;
  const lng = patroli.longitude !== null && patroli.longitude !== undefined ? Number(patroli.longitude) : null;
  const hasCoord = lat !== null && !Number.isNaN(lat) && lng !== null && !Number.isNaN(lng);

  // Icon default Leaflet perlu di-set ulang path resource dalam bundler Vite
  const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  // Set default icon secara global tanpa any
  (L.Marker.prototype as unknown as { options: { icon: L.Icon } }).options.icon = defaultIcon;
  return (
    <AppLayout breadcrumbs={[{ title: 'Patroli', href: '/security-ops/patroli' }, { title: `#${patroli.id}`, href: '#' }]}>
      <Head title={`Patroli #${patroli.id}`} />
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/security-ops/patroli">
            <Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4"/> Kembali</Button>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Patroli #{patroli.id}</h1>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              Detail Patroli
              <Badge variant={statusVariant(patroli.status)} className="text-xs">{humanStatus(patroli.status)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            <section>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
                <InfoItem label="Mulai" value={patroli.start_time || '-'} />
                <InfoItem label="Selesai" value={patroli.end_time || (patroli.status === 'in_progress' ? '—' : '-')} />
                <InfoItem label="Project" value={patroli.project?.name || '-'} />
                <InfoItem label="Checkpoint" value={patroli.checkpoint?.name || '-'} />
                <InfoItem label="Latitude" value={patroli.latitude ? String(patroli.latitude) : '-'} />
                <InfoItem label="Longitude" value={patroli.longitude ? String(patroli.longitude) : '-'} />
                <InfoItem label="Durasi" value={computeDuration(patroli.start_time, patroli.end_time)} />
                {geofence ? (
                  <>
                    <InfoItem label="Jarak ke Checkpoint" value={`${geofence.distance_m.toFixed(1)} m (radius ${geofence.radius_m} m)`} />
                    <InfoItem label="Status Geofence" value={geofence.inside ? 'Dalam radius' : `Di luar (sisa ${geofence.remaining_m.toFixed(1)} m)`} />
                  </>
                ) : (
                  <InfoItem label="Status Geofence" value="Belum ada perhitungan (checkpoint / koordinat belum lengkap)" />
                )}
              </div>
            </section>
            {geofence && (
              <section className="space-y-2 -mt-4">
                <div className={`text-xs rounded border px-3 py-2 ${geofence.inside ? 'bg-green-50 border-green-300 text-green-700' : 'bg-amber-50 border-amber-300 text-amber-700'}`}>
                  {geofence.inside ? 'Posisi patroli sudah berada di dalam radius checkpoint.' : `Posisi masih di luar radius. Sisa jarak ${geofence.remaining_m.toFixed(1)} m untuk masuk.`}
                </div>
              </section>
            )}
            <section className="space-y-2">
              <h3 className="font-semibold text-sm">Catatan</h3>
              <p className="text-xs sm:text-sm leading-relaxed bg-muted/30 rounded border p-3 min-h-[48px] whitespace-pre-wrap">
                {(patroli.note && patroli.note.trim()) ? patroli.note : '— Tidak ada catatan —'}
              </p>
            </section>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Lampiran ({patroli.files.length})</h3>
                {patroli.files.length > 0 && (
                  (() => {
                    const w = window as WindowWithZiggy;
                    const ziggyHas = !!w.Ziggy?.routes && Object.prototype.hasOwnProperty.call(w.Ziggy.routes, 'security-ops.patroli.download');
                    const href = ziggyHas ? route('security-ops.patroli.download', { patroli: patroli.id }) : `/security-ops/patroli/${patroli.id}/download`;
                    return (
                      <a href={href}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Download className="h-3 w-3"/> Unduh Semua
                    </Button>
                      </a>
                    );
                  })()
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {patroli.files.map(f => {
                  const href = `/storage/${f.file_path}`;
                  const img = isImage(f.file_path);
                  return (
                    <a key={f.id} href={href} target="_blank" rel="noreferrer" className="group relative border rounded-md p-2 flex flex-col gap-2 hover:border-primary transition text-xs">
                      <div className="aspect-video w-full overflow-hidden rounded bg-muted flex items-center justify-center">
                        {img ? (
                          <img src={href} alt={fileName(f.file_path)} className="object-cover w-full h-full group-hover:scale-105 transition" />
                        ) : (
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <span className="truncate" title={fileName(f.file_path)}>{fileName(f.file_path)}</span>
                      {img && <ImageIcon className="absolute top-1 right-1 h-4 w-4 text-white drop-shadow" />}
                    </a>
                  );
                })}
                {patroli.files.length === 0 && <div className="text-muted-foreground text-xs col-span-full">Tidak ada file</div>}
              </div>
            </section>
            <section className="space-y-2">
              <h3 className="font-semibold text-sm">Lokasi</h3>
              <div className="text-xs sm:text-sm flex flex-wrap gap-4 mb-2">
                <MapLink lat={patroli.latitude} lng={patroli.longitude} />
              </div>
              <div className="w-full h-72 rounded-md overflow-hidden border">
                {hasCoord ? (
                  <MapContainer center={[lat!, lng!]} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} className="leaflet-container">
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                    />
                    <Marker position={[lat!, lng!]}>
                      <Popup>
                        Posisi patroli<br/>Lat: {lat!.toFixed(5)}<br/>Lng: {lng!.toFixed(5)}
                      </Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Koordinat tidak tersedia</div>
                )}
              </div>
            </section>
            <div className="flex justify-end">
              <Link href="/security-ops/patroli"><Button variant="outline" size="sm">Kembali</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      <div className="font-medium break-words">{value || '-'}</div>
    </div>
  );
}
