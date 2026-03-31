import React from 'react';
import { format } from 'date-fns';

const eventConfig = {
  heavy_rain: { emoji: '\uD83C\uDF27\uFE0F', color: 'bg-blue-500', ring: 'ring-blue-500/30' },
  extreme_heat: { emoji: '\uD83C\uDF21\uFE0F', color: 'bg-orange-500', ring: 'ring-orange-500/30' },
  flood: { emoji: '\uD83C\uDF0A', color: 'bg-cyan-500', ring: 'ring-cyan-500/30' },
  curfew: { emoji: '\uD83D\uDEA7', color: 'bg-red-500', ring: 'ring-red-500/30' },
  storm: { emoji: '\u26C8\uFE0F', color: 'bg-purple-500', ring: 'ring-purple-500/30' },
};

const DisruptionTimeline = ({ events = [] }) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No disruption events recorded
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-700" />

      <div className="space-y-6">
        {events.map((event, index) => {
          const type = (event.disruption_type || event.type || 'heavy_rain').toLowerCase();
          const config = eventConfig[type] || { emoji: '\u26A0\uFE0F', color: 'bg-slate-500', ring: 'ring-slate-500/30' };
          const isActive = event.status === 'active';
          const eventDate = event.created_at || event.timestamp || event.date;

          return (
            <div key={event.id || index} className="relative pl-14">
              {/* Timeline dot */}
              <div className={`absolute left-3 w-5 h-5 rounded-full ${config.color} ring-4 ${config.ring} flex items-center justify-center z-10`}>
                {isActive && (
                  <span className={`absolute w-5 h-5 rounded-full ${config.color} animate-ping opacity-50`} />
                )}
              </div>

              {/* Event card */}
              <div className={`card border ${isActive ? 'border-amber-500/30' : 'border-slate-700/50'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.emoji}</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm capitalize">
                        {type.replace(/_/g, ' ')}
                      </h4>
                      {eventDate && (
                        <p className="text-xs text-slate-500">
                          {format(new Date(eventDate), 'dd MMM yyyy, hh:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-600/30 text-slate-400 border border-slate-600/30'
                  }`}>
                    {isActive ? 'Active' : 'Resolved'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  {event.zone && (
                    <div>
                      <span className="text-slate-500">Zone</span>
                      <p className="text-slate-300 font-medium">{event.zone}</p>
                    </div>
                  )}
                  {event.severity && (
                    <div>
                      <span className="text-slate-500">Severity</span>
                      <p className="text-slate-300 font-medium capitalize">{event.severity}</p>
                    </div>
                  )}
                  {(event.workers_affected !== undefined) && (
                    <div>
                      <span className="text-slate-500">Workers</span>
                      <p className="text-slate-300 font-medium">{event.workers_affected}</p>
                    </div>
                  )}
                  {(event.total_payouts !== undefined) && (
                    <div>
                      <span className="text-slate-500">Total Payouts</span>
                      <p className="text-emerald-400 font-medium">{`\u20B9${event.total_payouts}`}</p>
                    </div>
                  )}
                  {(event.claims_count !== undefined) && (
                    <div>
                      <span className="text-slate-500">Claims</span>
                      <p className="text-slate-300 font-medium">{event.claims_count}</p>
                    </div>
                  )}
                  {event.duration_hours && (
                    <div>
                      <span className="text-slate-500">Duration</span>
                      <p className="text-slate-300 font-medium">{event.duration_hours}h</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DisruptionTimeline;
