import React from 'react';

const riskConfig = {
  low: {
    label: 'Low',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    pulse: false,
  },
  medium: {
    label: 'Medium',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-400',
    pulse: false,
  },
  high: {
    label: 'High',
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
    pulse: true,
  },
  extreme: {
    label: 'Extreme',
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
    pulse: true,
  },
};

const RiskBadge = ({ level = 'low', size = 'sm' }) => {
  const normalizedLevel = (level || 'low').toLowerCase();
  const config = riskConfig[normalizedLevel] || riskConfig.low;

  const sizeClasses = size === 'lg'
    ? 'px-3 py-1.5 text-sm'
    : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses} rounded-full font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      {config.label}
    </span>
  );
};

export default RiskBadge;
