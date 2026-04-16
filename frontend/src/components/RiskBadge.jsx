import React from 'react';

const riskConfig = {
  low: {
    label: 'Low Risk',
    bg: 'bg-success-500/15',
    text: 'text-success-400',
    border: 'border-success-500/30',
    dot: 'bg-success-400',
    pulse: false,
  },
  medium: {
    label: 'Medium Risk',
    bg: 'bg-warning-500/15',
    text: 'text-warning-400',
    border: 'border-warning-500/30',
    dot: 'bg-warning-400',
    pulse: false,
  },
  high: {
    label: 'High Risk',
    bg: 'bg-danger-500/20',
    text: 'text-danger-400',
    border: 'border-danger-500/40',
    dot: 'bg-danger-400',
    pulse: true,
  },
  extreme: {
    label: 'Extreme Risk',
    bg: 'bg-danger-600/30',
    text: 'text-danger-300',
    border: 'border-danger-500/50',
    dot: 'bg-danger-400',
    pulse: true,
  },
};

const RiskBadge = ({ level = 'low', size = 'sm' }) => {
  const normalizedLevel = (level || 'low').toLowerCase();
  const config = riskConfig[normalizedLevel] || riskConfig.low;

  const sizeClasses = size === 'lg'
    ? 'px-4 py-2 text-sm'
    : 'px-3 py-1 text-xs';

  return (
    <div
      className={`inline-flex items-center gap-2 ${sizeClasses} rounded-full font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      {config.label}
    </div>
  );
};

export default RiskBadge;
