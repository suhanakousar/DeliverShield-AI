import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineExclamation, HiOutlineCloudRain, HiOutlineFire, HiOutlineSparkles } from 'react-icons/hi';

const ICONS = {
  heavy_rain: HiOutlineCloudRain,
  extreme_heat: HiOutlineFire,
  flood: HiOutlineCloudRain,
  severe_pollution: HiOutlineSparkles,
};

const COLORS = {
  heavy_rain: 'border-info-500/50 bg-info-500/10 text-info-500',
  extreme_heat: 'border-danger-500/50 bg-danger-500/10 text-danger-400',
  flood: 'border-info-500/50 bg-info-500/10 text-info-500',
  severe_pollution: 'border-warning-500/50 bg-warning-500/10 text-warning-500',
  default: 'border-warning-500/50 bg-warning-500/10 text-warning-500',
};

export default function AlertsBanner({ alert }) {
  // alert: { event_type, zone, severity, message } | null
  if (!alert) return null;

  const Icon = ICONS[alert.event_type] || HiOutlineExclamation;
  const tone = COLORS[alert.event_type] || COLORS.default;
  const title = alert.event_type
    ? alert.event_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Disruption';
  const zone = alert.zone ? alert.zone.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'your area';

  return (
    <AnimatePresence>
      <motion.div
        key={`${alert.event_type}-${alert.zone}`}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={`card border ${tone} flex items-center gap-4 p-4`}
      >
        <div className="w-12 h-12 rounded-xl bg-base-950/40 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold opacity-90">
            <span>⚠ Active Disruption</span>
            {alert.severity && (
              <span className="px-1.5 py-0.5 rounded bg-base-950/40 text-[10px]">{alert.severity}</span>
            )}
          </div>
          <div className="text-base-100 font-bold text-base mt-0.5 truncate">
            {title} detected in {zone}
          </div>
          {alert.message && <div className="text-sm text-base-400 truncate">{alert.message}</div>}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
