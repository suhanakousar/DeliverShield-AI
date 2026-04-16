import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ icon: Icon, label, value, change, changeLabel, color = 'primary', className = '' }) => {
  const colorMap = {
    primary: {
      iconBg: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
      border: 'border-base-800 hover:border-primary-500/30',
    },
    accent: {
      iconBg: 'bg-success-500/10 text-success-400 border-success-500/20',
      border: 'border-base-800 hover:border-success-500/30',
    },
    amber: {
      iconBg: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
      border: 'border-base-800 hover:border-warning-500/30',
    },
    red: {
      iconBg: 'bg-danger-500/10 text-danger-400 border-danger-500/20',
      border: 'border-base-800 hover:border-danger-500/30',
    },
    blue: {
      iconBg: 'bg-info-500/10 text-info-400 border-info-500/20',
      border: 'border-base-800 hover:border-info-500/30',
    },
    purple: {
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      border: 'border-base-800 hover:border-purple-500/30',
    },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className={`card ${colors.border} flex flex-col justify-between transition-colors duration-300 ${className}`}
    >
      <div className="flex items-center gap-4 mb-4">
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colors.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-base-400 text-sm font-semibold">{label}</p>
          <p className="text-2xl font-bold font-sans tracking-tight text-base-100">{value}</p>
        </div>
      </div>
      
      {changeLabel && (
        <div className="mt-2 pt-3 border-t border-base-800/50">
          <p className="text-xs font-medium text-base-500 uppercase tracking-wide">{changeLabel}</p>
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;
