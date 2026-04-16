import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { connectToRealtimeEvents, getNotifications } from '../services/api';
import { 
  HiOutlineCloud, HiOutlineExclamation, HiOutlineClipboardList, 
  HiOutlineCurrencyRupee, HiOutlineSearch, HiOutlineStatusOnline, HiOutlineXCircle 
} from 'react-icons/hi';

const EVENT_ICONS = {
  weather_update: HiOutlineCloud,
  disruption_detected: HiOutlineExclamation,
  claims_created: HiOutlineClipboardList,
  payout_processed: HiOutlineCurrencyRupee,
  monitor_check: HiOutlineSearch,
  connected: HiOutlineStatusOnline,
  error: HiOutlineXCircle,
};

const EVENT_COLORS = {
  weather_update: 'border-info-500/30 bg-info-500/10 text-info-400',
  disruption_detected: 'border-danger-500/30 bg-danger-500/10 text-danger-400',
  claims_created: 'border-warning-500/30 bg-warning-500/10 text-warning-400',
  payout_processed: 'border-success-500/30 bg-success-500/10 text-success-400',
  monitor_check: 'border-base-700 bg-base-800 text-base-400',
  connected: 'border-success-500/30 bg-success-500/10 text-success-400',
  error: 'border-danger-500/30 bg-danger-500/10 text-danger-400',
};

const LiveFeed = ({ maxEvents = 20, showWeatherUpdates = false, compact = false }) => {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const feedRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    // Load recent notifications first
    const loadRecent = async () => {
      try {
        const data = await getNotifications(maxEvents);
        if (data.notifications) {
          setEvents(data.notifications.reverse());
        }
      } catch (e) {
        console.log('Could not load recent notifications');
      }
    };
    loadRecent();

    // Connect to SSE
    const es = connectToRealtimeEvents(
      (event) => {
        if (event.type === 'connected') {
          setConnected(true);
          return;
        }
        if (!showWeatherUpdates && event.type === 'weather_update') return;
        if (event.type === 'monitor_check') return; // Skip routine checks

        setEvents(prev => {
          const updated = [...prev, event];
          return updated.slice(-maxEvents);
        });
      },
      () => setConnected(false)
    );
    eventSourceRef.current = es;

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [maxEvents, showWeatherUpdates]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="card overflow-hidden flex flex-col p-0 h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-base-800 bg-base-950/30">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            {connected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-danger-500"></span>
            )}
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-base-100">Live Feed</h3>
        </div>
        <span className="text-xs font-bold text-base-500">{events.length} events</span>
      </div>

      <div ref={feedRef} className={`overflow-y-auto ${compact ? 'max-h-64' : 'max-h-96'} p-4 space-y-3 flex-1 bg-base-950/10`}>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-base-500 text-sm font-medium">
            <HiOutlineStatusOnline className="w-8 h-8 mb-2 opacity-50 animate-pulse" />
            Waiting for live events...
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((event, index) => {
              const eventType = event.type || event.data?.type || 'unknown';
              const message = event.data?.message || event.message || eventType;
              const Icon = EVENT_ICONS[eventType] || HiOutlineExclamation;
              const colorClass = EVENT_COLORS[eventType] || 'border-base-700 bg-base-800 text-base-400';
              
              return (
                <motion.div
                  key={event.id || `${event.timestamp}-${index}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  layout
                  className={`flex items-start gap-3 p-3 rounded-xl border ${colorClass}`}
                >
                  <div className="mt-0.5 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-100 leading-snug">{message}</p>
                    {event.data?.zone && (
                      <span className="text-xs font-bold uppercase tracking-wider opacity-70 mt-1 inline-block">
                        {event.data.zone.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold tracking-wider opacity-50 shrink-0 whitespace-nowrap mt-1">
                    {formatTime(event.timestamp || event.data?.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
