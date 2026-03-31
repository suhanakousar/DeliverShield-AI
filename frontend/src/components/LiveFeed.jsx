import React, { useState, useEffect, useRef } from 'react';
import { connectToRealtimeEvents, getNotifications } from '../services/api';

const EVENT_ICONS = {
  weather_update: '🌤️',
  disruption_detected: '🚨',
  claims_created: '📋',
  payout_processed: '💰',
  monitor_check: '🔍',
  connected: '🟢',
  error: '❌',
};

const EVENT_COLORS = {
  weather_update: 'border-blue-500/30 bg-blue-500/5',
  disruption_detected: 'border-red-500/30 bg-red-500/5',
  claims_created: 'border-amber-500/30 bg-amber-500/5',
  payout_processed: 'border-emerald-500/30 bg-emerald-500/5',
  monitor_check: 'border-slate-500/30 bg-slate-500/5',
  connected: 'border-green-500/30 bg-green-500/5',
  error: 'border-red-500/30 bg-red-500/5',
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
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <h3 className="text-sm font-semibold text-white">Live Activity Feed</h3>
        </div>
        <span className="text-xs text-slate-400">{events.length} events</span>
      </div>

      <div ref={feedRef} className={`overflow-y-auto ${compact ? 'max-h-64' : 'max-h-96'} p-2 space-y-1.5`}>
        {events.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            <div className="text-2xl mb-2">📡</div>
            Waiting for real-time events...
          </div>
        ) : (
          events.map((event, index) => {
            const eventType = event.type || event.data?.type || 'unknown';
            const message = event.data?.message || event.message || eventType;
            const icon = EVENT_ICONS[eventType] || '📌';
            const colorClass = EVENT_COLORS[eventType] || 'border-slate-500/30 bg-slate-500/5';
            const isNew = index === events.length - 1;

            return (
              <div
                key={event.id || index}
                className={`flex items-start gap-2 p-2 rounded-lg border ${colorClass} transition-all duration-500 ${
                  isNew ? 'animate-slideIn' : ''
                }`}
              >
                <span className="text-base mt-0.5 flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 leading-relaxed">{message}</p>
                  {event.data?.zone && (
                    <span className="text-[10px] text-slate-400 mt-0.5 inline-block">
                      {event.data.zone.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 flex-shrink-0 mt-0.5">
                  {formatTime(event.timestamp || event.data?.timestamp)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
