import React from 'react';
import { HiArrowUp, HiArrowDown } from 'react-icons/hi';

const StatsCard = ({ icon: Icon, label, value, change, changeLabel, color = 'primary', className = '' }) => {
  const colorMap = {
    primary: {
      iconBg: 'bg-primary-500/15',
      iconText: 'text-primary-400',
      border: 'border-primary-500/20',
    },
    accent: {
      iconBg: 'bg-accent-500/15',
      iconText: 'text-accent-400',
      border: 'border-accent-500/20',
    },
    amber: {
      iconBg: 'bg-amber-500/15',
      iconText: 'text-amber-400',
      border: 'border-amber-500/20',
    },
    red: {
      iconBg: 'bg-red-500/15',
      iconText: 'text-red-400',
      border: 'border-red-500/20',
    },
    blue: {
      iconBg: 'bg-blue-500/15',
      iconText: 'text-blue-400',
      border: 'border-blue-500/20',
    },
    purple: {
      iconBg: 'bg-purple-500/15',
      iconText: 'text-purple-400',
      border: 'border-purple-500/20',
    },
  };

  const colors = colorMap[color] || colorMap.primary;

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className={`card border ${colors.border} ${className}`}>
      <div className="flex items-start justify-between mb-3">
        {Icon && (
          <div className={`w-10 h-10 ${colors.iconBg} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${colors.iconText}`} />
          </div>
        )}
        {change !== undefined && change !== null && (
          <div className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-emerald-500/15 text-emerald-400' :
            isNegative ? 'bg-red-500/15 text-red-400' :
            'bg-slate-600/30 text-slate-400'
          }`}>
            {isPositive && <HiArrowUp className="w-3 h-3" />}
            {isNegative && <HiArrowDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
        {changeLabel && (
          <p className="text-xs text-slate-500 mt-1">{changeLabel}</p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
