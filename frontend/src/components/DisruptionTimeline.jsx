import React from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { HiOutlineCloud, HiOutlineSun, HiOutlineShieldExclamation } from 'react-icons/hi';

const eventConfig = {
  heavy_rain: { icon: HiOutlineCloud, color: 'text-info-400', bg: 'bg-info-500/20', border: 'border-info-500/30' },
  extreme_heat: { icon: HiOutlineSun, color: 'text-warning-400', bg: 'bg-warning-500/20', border: 'border-warning-500/30' },
  flood: { icon: HiOutlineCloud, color: 'text-primary-400', bg: 'bg-primary-500/20', border: 'border-primary-500/30' },
  curfew: { icon: HiOutlineShieldExclamation, color: 'text-danger-400', bg: 'bg-danger-500/20', border: 'border-danger-500/30' },
  storm: { icon: HiOutlineCloud, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
};

const DisruptionTimeline = ({ events = [] }) => {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-base-500 border border-dashed border-base-800 rounded-2xl bg-base-900/30">
        <HiOutlineShieldExclamation className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm font-medium">No disruption events recorded</p>
      </div>
    );
  }

  return (
    <div className="relative pt-4 pl-4 md:pl-8">
      {/* Vertical line */}
      <div className="absolute left-8 md:left-12 top-0 bottom-0 w-px bg-base-800" />

      <div className="space-y-8">
        {events.map((event, index) => {
          const type = (event.disruption_type || event.type || 'heavy_rain').toLowerCase();
          const config = eventConfig[type] || { icon: HiOutlineShieldExclamation, color: 'text-base-400', bg: 'bg-base-800', border: 'border-base-700' };
          const isActive = event.status === 'active';
          const eventDate = event.created_at || event.timestamp || event.date;
          const Icon = config.icon;

          return (
            <motion.div 
              key={event.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-10 md:pl-12"
            >
              {/* Timeline dot/icon */}
              <div className={`absolute left-[-24px] md:left-[-20px] top-4 w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center z-10`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
                {isActive && (
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success-500 animate-pulse`} />
                )}
              </div>

              {/* Event card */}
              <div className={`card ${isActive ? 'border-success-500/30 bg-success-500/5' : 'border-base-800 bg-base-900'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-base-100 text-lg capitalize tracking-tight">
                        {(type.replace(/_/g, ' '))}
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isActive ? 'bg-success-500/20 text-success-400 border-success-500/30' : 'bg-base-800 text-base-500 border-base-700'
                      }`}>
                        {isActive ? 'Active Now' : 'Resolved'}
                      </span>
                    </div>
                    {eventDate && (
                      <p className="text-xs font-medium text-base-500">
                        {format(new Date(eventDate), 'MMM d, yyyy • h:mm a')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {event.zone && (
                    <div className="bg-base-950/50 rounded-lg p-3 border border-base-800/50">
                      <span className="text-[10px] font-bold text-base-500 uppercase tracking-wider block mb-1">Zone</span>
                      <p className="text-sm font-bold text-base-200 truncate">{event.zone.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {event.severity && (
                    <div className="bg-base-950/50 rounded-lg p-3 border border-base-800/50">
                      <span className="text-[10px] font-bold text-base-500 uppercase tracking-wider block mb-1">Severity</span>
                      <p className="text-sm font-bold text-base-200 capitalize">{event.severity}</p>
                    </div>
                  )}
                  {(event.workers_affected !== undefined) && (
                    <div className="bg-base-950/50 rounded-lg p-3 border border-base-800/50">
                      <span className="text-[10px] font-bold text-base-500 uppercase tracking-wider block mb-1">Affected</span>
                      <p className="text-sm font-bold text-base-200">{event.workers_affected} workers</p>
                    </div>
                  )}
                  {(event.claims_count !== undefined) && (
                    <div className="bg-base-950/50 rounded-lg p-3 border border-base-800/50">
                      <span className="text-[10px] font-bold text-base-500 uppercase tracking-wider block mb-1">Claims</span>
                      <p className="text-sm font-bold text-base-200">{event.claims_count}</p>
                    </div>
                  )}
                  {(event.total_payouts !== undefined) && (
                    <div className="bg-base-950/50 rounded-lg p-3 border border-base-800/50 sm:col-span-2">
                      <span className="text-[10px] font-bold text-base-500 uppercase tracking-wider block mb-1">Total Payouts</span>
                      <p className="text-sm font-bold text-success-400">₹{event.total_payouts.toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DisruptionTimeline;
