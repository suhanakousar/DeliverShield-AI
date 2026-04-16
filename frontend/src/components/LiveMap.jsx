import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * LiveMap — pure-SVG map of Hyderabad zones with risk colouring
 * + worker pulse marker. No external map tiles needed.
 *
 * Props:
 *   coords        : { lat, lng } | null
 *   zones         : [{ key, label, lat, lon, risk: 'low'|'medium'|'high'|'extreme' }]
 *   activeZoneKey : highlight zone (current disruption)
 */

const HYD_BOUNDS = {
  // Roughly covers the configured Hyderabad zone bounding box
  minLat: 17.30, maxLat: 17.55,
  minLng: 78.30, maxLng: 78.60,
};

const SVG_W = 600;
const SVG_H = 380;

const RISK_FILL = {
  low: '#10B98122',       // success
  medium: '#F59E0B22',    // primary
  high: '#EF444433',      // danger
  extreme: '#B91C1C55',
};
const RISK_STROKE = {
  low: '#10B98166',
  medium: '#F59E0B88',
  high: '#EF4444AA',
  extreme: '#B91C1CFF',
};

function project(lat, lng) {
  const x = ((lng - HYD_BOUNDS.minLng) / (HYD_BOUNDS.maxLng - HYD_BOUNDS.minLng)) * SVG_W;
  const y = SVG_H - ((lat - HYD_BOUNDS.minLat) / (HYD_BOUNDS.maxLat - HYD_BOUNDS.minLat)) * SVG_H;
  return { x, y };
}

export default function LiveMap({ coords, zones = [], activeZoneKey, currentZoneKey }) {
  const projectedZones = useMemo(
    () => zones.map((z) => ({ ...z, ...project(z.lat, z.lon) })),
    [zones]
  );

  const me = coords ? project(coords.lat, coords.lng) : null;
  const inBounds = me && me.x >= 0 && me.x <= SVG_W && me.y >= 0 && me.y <= SVG_H;

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-base-500 uppercase tracking-wider text-xs">Live Map</h3>
        <Legend />
      </div>

      <div className="relative flex-1 min-h-[300px] rounded-xl overflow-hidden bg-base-950 border border-base-800">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Soft grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141A26" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={SVG_W} height={SVG_H} fill="url(#grid)" />

          {/* Zone bubbles */}
          {projectedZones.map((z) => {
            const isActive = z.key === activeZoneKey;
            const isCurrent = z.key === currentZoneKey;
            const r = isActive ? 60 : 42;
            return (
              <g key={z.key}>
                <circle
                  cx={z.x} cy={z.y}
                  r={r}
                  fill={RISK_FILL[z.risk] || RISK_FILL.low}
                  stroke={RISK_STROKE[z.risk] || RISK_STROKE.low}
                  strokeWidth={isActive ? 3 : 1.5}
                />
                {isActive && (
                  <circle cx={z.x} cy={z.y} r={r} fill="none" stroke={RISK_STROKE[z.risk] || RISK_STROKE.high} strokeWidth="2">
                    <animate attributeName="r" from={r} to={r + 30} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <text
                  x={z.x} y={z.y - r - 6}
                  fontSize="11"
                  fill={isCurrent ? '#FBBF24' : '#9CA6B9'}
                  fontWeight={isCurrent ? 700 : 500}
                  textAnchor="middle"
                >
                  {z.label}
                </text>
              </g>
            );
          })}

          {/* Worker marker */}
          {inBounds && (
            <g>
              <circle cx={me.x} cy={me.y} r="14" fill="#F59E0B33" stroke="#F59E0B" strokeWidth="2">
                <animate attributeName="r" from="14" to="28" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx={me.x} cy={me.y} r="6" fill="#FBBF24" stroke="#070A11" strokeWidth="2" />
            </g>
          )}
        </svg>

        {!coords && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-base-500">
            Enable GPS to see your live position
          </div>
        )}
      </div>
    </div>
  );
}

const Legend = () => (
  <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-base-500">
    <Swatch color="#10B981" label="Low" />
    <Swatch color="#F59E0B" label="Med" />
    <Swatch color="#EF4444" label="High" />
    <Swatch color="#B91C1C" label="Extreme" />
  </div>
);

const Swatch = ({ color, label }) => (
  <span className="inline-flex items-center gap-1">
    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
    {label}
  </span>
);
