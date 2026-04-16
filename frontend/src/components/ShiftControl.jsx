import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineLocationMarker, HiPlay, HiStop, HiOutlineLightningBolt } from 'react-icons/hi';
import {
  startShift,
  endShift,
  getActiveShift,
  startDelivery,
  endDelivery,
  getActiveDelivery,
} from '../services/api';
import useGeolocation from '../hooks/useGeolocation';

const StatusDot = ({ active }) => (
  <span className="relative inline-flex h-3 w-3">
    {active && (
      <span className="absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75 animate-ping" />
    )}
    <span className={`relative inline-flex rounded-full h-3 w-3 ${active ? 'bg-success-500' : 'bg-base-600'}`} />
  </span>
);

export default function ShiftControl({ workerId, onShiftChange }) {
  const [shift, setShift] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [busy, setBusy] = useState(false);

  const { coords, error: geoError, isWatching } = useGeolocation({
    workerId,
    enabled: !!shift,
    intervalMs: 10000,
  });

  const refresh = useCallback(async () => {
    if (!workerId) return;
    try {
      const [s, d] = await Promise.all([getActiveShift(workerId), getActiveDelivery(workerId)]);
      setShift(s.active ? s.shift : null);
      setDelivery(d.active ? d.delivery : null);
      onShiftChange && onShiftChange({
        shiftActive: s.active,
        deliveryActive: d.active,
      });
    } catch (e) {
      // silent
    }
  }, [workerId, onShiftChange]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 12000);
    return () => clearInterval(id);
  }, [refresh]);

  const handleStartShift = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const lat = coords?.lat;
      const lng = coords?.lng;
      const res = await startShift(workerId, lat, lng);
      setShift(res);
      toast.success('Shift started — GPS tracking on');
      onShiftChange && onShiftChange({ shiftActive: true, deliveryActive: !!delivery });
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Could not start shift');
    } finally {
      setBusy(false);
    }
  };

  const handleEndShift = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await endShift(workerId);
      setShift(null);
      setDelivery(null);
      toast.success(`Shift ended (${res.duration_minutes?.toFixed?.(0) || 0} min, ${res.total_distance_km?.toFixed?.(1) || 0} km)`);
      onShiftChange && onShiftChange({ shiftActive: false, deliveryActive: false });
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Could not end shift');
    } finally {
      setBusy(false);
    }
  };

  const handleStartDelivery = async () => {
    if (!shift) {
      toast.error('Start a shift first');
      return;
    }
    setBusy(true);
    try {
      const opts = coords ? { pickup_lat: coords.lat, pickup_lng: coords.lng } : {};
      const res = await startDelivery(workerId, opts);
      setDelivery(res);
      toast.success('Delivery started');
      onShiftChange && onShiftChange({ shiftActive: true, deliveryActive: true });
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Could not start delivery');
    } finally {
      setBusy(false);
    }
  };

  const handleEndDelivery = async () => {
    setBusy(true);
    try {
      const res = await endDelivery(workerId);
      setDelivery(null);
      toast.success(`Delivery completed (+₹${res.earnings?.toFixed?.(0) || 0})`);
      onShiftChange && onShiftChange({ shiftActive: !!shift, deliveryActive: false });
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Could not end delivery');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 space-y-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-500">
            <StatusDot active={!!shift} />
            <span>{shift ? 'On Shift' : 'Off Shift'}</span>
            {delivery && (
              <span className="ml-2 px-2 py-0.5 rounded-md bg-primary-500/15 text-primary-400 text-[10px]">
                Delivering
              </span>
            )}
          </div>
          <h3 className="text-2xl font-extrabold font-sans tracking-tight mt-1">
            {shift ? 'You are protected' : 'You are NOT protected'}
          </h3>
          <p className="text-sm text-base-400 mt-1">
            {shift
              ? 'Live tracking is on. Auto-payouts trigger only when you are on shift, delivering, and in a disrupted zone.'
              : 'Start a shift to enable parametric income protection.'}
          </p>
        </div>

        {shift ? (
          <button onClick={handleEndShift} disabled={busy} className="btn-danger whitespace-nowrap">
            <HiStop className="w-5 h-5 mr-2" /> End Shift
          </button>
        ) : (
          <button onClick={handleStartShift} disabled={busy} className="btn-primary whitespace-nowrap shadow-lg shadow-primary-500/30">
            <HiPlay className="w-5 h-5 mr-2" /> Start Shift
          </button>
        )}
      </div>

      {shift && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat label="Distance" value={`${(shift.total_distance_km || 0).toFixed(1)} km`} />
          <Stat label="Deliveries" value={shift.deliveries_completed || 0} />
          <Stat label="Zone" value={(shift.last_zone || shift.start_zone || '—').replace(/_/g, ' ')} />
          <Stat label="GPS" value={isWatching ? 'Live' : (geoError ? 'Blocked' : 'Idle')} accent={isWatching ? 'success' : 'danger'} />
        </div>
      )}

      {shift && (
        <div className="flex items-center gap-3 pt-2 border-t border-base-800">
          {delivery ? (
            <button onClick={handleEndDelivery} disabled={busy} className="btn-secondary flex-1">
              Complete Delivery
            </button>
          ) : (
            <button onClick={handleStartDelivery} disabled={busy} className="btn-outline flex-1">
              <HiOutlineLightningBolt className="w-5 h-5 mr-2" /> Start Delivery
            </button>
          )}
        </div>
      )}

      {coords && (
        <div className="text-xs text-base-500 flex items-center gap-2">
          <HiOutlineLocationMarker className="w-4 h-4" />
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} · {coords.accuracy?.toFixed?.(0)} m accuracy
        </div>
      )}
      {geoError && (
        <div className="text-xs text-danger-400">
          GPS error: {geoError.message}. Allow location access in your browser to enable protection.
        </div>
      )}
    </motion.div>
  );
}

const Stat = ({ label, value, accent }) => (
  <div className="bg-base-800/60 rounded-xl px-3 py-2">
    <div className="text-[10px] uppercase tracking-wider text-base-500 font-bold">{label}</div>
    <div className={`font-bold text-base-100 mt-1 ${accent === 'success' ? 'text-success-400' : ''} ${accent === 'danger' ? 'text-danger-400' : ''}`}>
      {value}
    </div>
  </div>
);
