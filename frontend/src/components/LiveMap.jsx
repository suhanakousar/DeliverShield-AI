import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const RISK_COLOR = {
  low:     '#10B981',
  medium:  '#F59E0B',
  high:    '#EF4444',
  extreme: '#B91C1C',
};

export default function LiveMap({ coords, zones = [], activeZoneKey, currentZoneKey }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const workerMarker = useRef(null);
  const zoneCircles = useRef([]);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    import('leaflet').then((L) => {
      const Lx = L.default || L;

      delete Lx.Icon.Default.prototype._getIconUrl;
      Lx.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const center = coords
        ? [coords.lat, coords.lng]
        : [17.4239, 78.4738];

      const map = Lx.map(mapRef.current, {
        center,
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
      });

      Lx.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMap.current = map;
      leafletMap.current._Lx = Lx;

      drawZones(Lx, map, zones, activeZoneKey, currentZoneKey);

      if (coords) {
        const icon = makeWorkerIcon(Lx);
        workerMarker.current = Lx.marker([coords.lat, coords.lng], { icon })
          .addTo(map)
          .bindPopup('<b>Your Location</b>');
        map.setView([coords.lat, coords.lng], 13);
      }
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!leafletMap.current) return;
    const Lx = leafletMap.current._Lx;
    if (!Lx) return;

    zoneCircles.current.forEach(c => c.remove());
    zoneCircles.current = [];
    drawZones(Lx, leafletMap.current, zones, activeZoneKey, currentZoneKey);
  }, [zones, activeZoneKey, currentZoneKey]);

  useEffect(() => {
    if (!leafletMap.current) return;
    const Lx = leafletMap.current._Lx;
    if (!Lx) return;

    if (coords) {
      if (workerMarker.current) {
        workerMarker.current.setLatLng([coords.lat, coords.lng]);
      } else {
        const icon = makeWorkerIcon(Lx);
        workerMarker.current = Lx.marker([coords.lat, coords.lng], { icon })
          .addTo(leafletMap.current)
          .bindPopup('<b>Your Location</b>');
      }
      leafletMap.current.setView([coords.lat, coords.lng], 13, { animate: true });
    }
  }, [coords]);

  function drawZones(Lx, map, zones, activeZoneKey, currentZoneKey) {
    zones.forEach((z) => {
      const color = RISK_COLOR[z.risk] || RISK_COLOR.low;
      const radius = activeZoneKey === z.key ? 2800 : 2000;
      const circle = Lx.circle([z.lat, z.lon], {
        color,
        fillColor: color,
        fillOpacity: 0.12,
        weight: activeZoneKey === z.key ? 2.5 : 1.5,
        radius,
      })
        .addTo(map)
        .bindPopup(`<b>${z.label}</b><br>Risk: ${z.risk || 'low'}`);

      const labelIcon = Lx.divIcon({
        className: '',
        html: `<div style="
          background: rgba(7,10,17,0.85);
          border: 1px solid ${color}55;
          color: ${currentZoneKey === z.key ? '#FBBF24' : '#9CA6B9'};
          font-size: 10px;
          font-weight: ${currentZoneKey === z.key ? 700 : 500};
          padding: 2px 6px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
        ">${z.label}</div>`,
        iconAnchor: [0, 0],
      });

      const labelMarker = Lx.marker([z.lat, z.lon], { icon: labelIcon, interactive: false }).addTo(map);

      zoneCircles.current.push(circle, labelMarker);
    });
  }

  function makeWorkerIcon(Lx) {
    return Lx.divIcon({
      className: '',
      html: `<div style="
        width: 20px; height: 20px;
        background: #FBBF24;
        border: 3px solid #070A11;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(251,191,36,0.3), 0 0 12px rgba(251,191,36,0.5);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-base-500 uppercase tracking-wider text-xs">Live Map</h3>
        <Legend />
      </div>
      <div className="relative flex-1 min-h-[300px] rounded-xl overflow-hidden border border-base-800">
        <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 300 }} />
        {!coords && (
          <div className="absolute bottom-3 left-3 bg-base-950/90 text-xs text-base-400 px-3 py-1.5 rounded-lg border border-base-800 z-[400] pointer-events-none">
            Enable GPS to see your live position
          </div>
        )}
      </div>
    </div>
  );
}

const Legend = () => (
  <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-base-500">
    {[['#10B981','Low'],['#F59E0B','Med'],['#EF4444','High'],['#B91C1C','Extreme']].map(([c,l]) => (
      <span key={l} className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full" style={{ background: c }} />
        {l}
      </span>
    ))}
  </div>
);
