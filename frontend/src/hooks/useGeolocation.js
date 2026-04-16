import { useEffect, useRef, useState, useCallback } from 'react';
import { updateLocation } from '../services/api';

/**
 * useGeolocation
 * - Wraps navigator.geolocation.watchPosition
 * - Throttles uploads to the backend (default every 10s)
 * - Reports current coords / speed / accuracy / errors
 *
 * Returns: { coords, error, isWatching, start, stop }
 */
export default function useGeolocation({ workerId, enabled = false, intervalMs = 10000 } = {}) {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [isWatching, setIsWatching] = useState(false);

  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const handlePosition = useCallback((pos) => {
    const next = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      speed: pos.coords.speed != null ? Math.max(pos.coords.speed * 3.6, 0) : 0, // m/s → km/h
      heading: pos.coords.heading,
      timestamp: pos.timestamp,
    };
    setCoords(next);
    setError(null);

    if (!enabledRef.current || !workerId) return;

    const now = Date.now();
    if (now - lastSentRef.current < intervalMs) return;
    lastSentRef.current = now;

    updateLocation({
      worker_id: workerId,
      lat: next.lat,
      lng: next.lng,
      speed_kmh: next.speed,
      accuracy_m: next.accuracy,
      heading: next.heading,
      is_mock: false,
    }).catch(() => { /* swallow — UI will recover on next ping */ });
  }, [workerId, intervalMs]);

  const handleError = useCallback((err) => {
    setError({ code: err.code, message: err.message });
    setIsWatching(false);
  }, []);

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError({ code: -1, message: 'Geolocation not supported by this browser' });
      return false;
    }
    if (watchIdRef.current != null) return true;

    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });
    setIsWatching(true);
    return true;
  }, [handlePosition, handleError]);

  const stop = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  // Auto-start/stop with `enabled` prop
  useEffect(() => {
    if (enabled) start();
    else stop();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { coords, error, isWatching, start, stop };
}
