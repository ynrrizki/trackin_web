import { useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import L from 'leaflet';

// Fix for default markers in React Leaflet
import 'leaflet/dist/leaflet.css';

// Import default marker images
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix the default icon
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapLocationPickerProps {
    latitude?: number;
    longitude?: number;
    radius?: number;
    onLocationChange?: (lat: number, lng: number) => void;
    onRadiusChange?: (radius: number) => void;
    className?: string;
}

export default function MapLocationPicker({
    latitude = -6.2088,
    longitude = 106.8456,
    radius = 100,
    onLocationChange,
    onRadiusChange,
    className = "h-96 w-full rounded-lg",
}: MapLocationPickerProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const circleRef = useRef<L.Circle | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize map
        const map = L.map(containerRef.current, {
            center: [latitude, longitude],
            zoom: 16,
            zoomControl: true,
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapRef.current = map;

        // Add marker
        const marker = L.marker([latitude, longitude], {
            draggable: true
        }).addTo(map);

        markerRef.current = marker;

        // Add circle for radius
        const circle = L.circle([latitude, longitude], {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            radius: radius
        }).addTo(map);

        circleRef.current = circle;

        // Handle marker drag
        marker.on('dragend', () => {
            const position = marker.getLatLng();
            circle.setLatLng(position);
            onLocationChange?.(position.lat, position.lng);
        });

        // Handle map click
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            circle.setLatLng([lat, lng]);
            onLocationChange?.(lat, lng);
        });

        // Cleanup function
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); // Empty dependency array to run only once

    // Update marker and circle when props change
    useEffect(() => {
        if (markerRef.current && circleRef.current) {
            const newLatLng = L.latLng(latitude, longitude);
            markerRef.current.setLatLng(newLatLng);
            circleRef.current.setLatLng(newLatLng);

            if (mapRef.current) {
                mapRef.current.setView(newLatLng, mapRef.current.getZoom());
            }
        }
    }, [latitude, longitude]);

    // Update circle radius when radius prop changes
    useEffect(() => {
        if (circleRef.current) {
            circleRef.current.setRadius(radius);
        }
    }, [radius]);

    return (
        <div className="space-y-4">
            <div ref={containerRef} className={className} />

            {/* Radius Control */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">
                    Radius Absensi: {radius} meter
                </Label>
                <Slider
                    value={[radius]}
                    onValueChange={(value) => onRadiusChange?.(value[0])}
                    max={1000}
                    min={10}
                    step={10}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10m</span>
                    <span>1000m</span>
                </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>📍 Klik atau drag marker untuk mengatur lokasi</span>
                <span>🎯 Radius: {radius}m</span>
            </div>
        </div>
    );
}
