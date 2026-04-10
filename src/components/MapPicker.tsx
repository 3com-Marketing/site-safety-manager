import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapPickerProps {
  lat?: number | null;
  lng?: number | null;
  onSelect?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  className?: string;
  markers?: { lat: number; lng: number; label?: string; color?: string }[];
}

const SPAIN_CENTER = { lat: 40.4168, lng: -3.7038 };

export default function MapPicker({ lat, lng, onSelect, readOnly = false, className = '', markers }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = lat && lng ? { lat, lng } : SPAIN_CENTER;
    const zoom = lat && lng ? 15 : 6;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      scrollWheelZoom: !readOnly,
      dragging: true,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }

    if (markers) {
      markers.forEach(m => {
        const icon = m.color
          ? L.divIcon({
              className: 'custom-marker',
              html: `<div style="background:${m.color};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })
          : undefined;
        const marker = icon ? L.marker([m.lat, m.lng], { icon }).addTo(map) : L.marker([m.lat, m.lng]).addTo(map);
        if (m.label) marker.bindPopup(m.label);
      });
    }

    if (!readOnly && onSelect) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        } else {
          markerRef.current = L.marker([newLat, newLng]).addTo(map);
        }
        onSelect(newLat, newLng);
      });
    }

    mapRef.current = map;

    // Force resize after render
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position when lat/lng props change
  useEffect(() => {
    if (!mapRef.current) return;
    if (lat && lng) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
      }
      mapRef.current.setView([lat, lng], 15);
    }
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className={`rounded-xl border border-border overflow-hidden ${className}`}
      style={{ height: 250, minHeight: 200 }}
    />
  );
}
