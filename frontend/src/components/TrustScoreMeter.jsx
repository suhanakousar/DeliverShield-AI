import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const getTrustConfig = (score) => {
  if (score >= 80) return { band: 'Elite Partner', color: '#10B981', bgColor: 'bg-success-500/20', textColor: 'text-success-400' };
  if (score >= 55) return { band: 'Standard Partner', color: '#F59E0B', bgColor: 'bg-warning-500/20', textColor: 'text-warning-400' };
  if (score >= 30) return { band: 'At Risk', color: '#F97316', bgColor: 'bg-danger-400/20', textColor: 'text-danger-400' };
  return { band: 'Flagged', color: '#EF4444', bgColor: 'bg-danger-600/20', textColor: 'text-danger-300' };
};

const TrustScoreMeter = ({ score = 0, size = 'md', showLabel = true }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const safeScore = Math.max(0, Math.min(100, score));
  const config = getTrustConfig(safeScore);

  useEffect(() => {
    // Simple count up effect
    const duration = 1000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.floor(eased * safeScore));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [safeScore]);

  const sizeConfig = {
    sm: { width: 140, height: 80, strokeWidth: 10, fontSize: 24, labelSize: 'text-xs' },
    md: { width: 200, height: 110, strokeWidth: 14, fontSize: 36, labelSize: 'text-sm' },
    lg: { width: 280, height: 150, strokeWidth: 18, fontSize: 48, labelSize: 'text-base' },
  };

  const s = sizeConfig[size] || sizeConfig.md;

  // Semicircular gauge SVG
  const centerX = s.width / 2;
  const centerY = s.height - 10;
  const radius = s.width / 2 - s.strokeWidth - 10;

  // SVG calculations
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: s.width, height: s.height }}>
        <svg width={s.width} height={s.height} viewBox={`0 0 ${s.width} ${s.height}`} className="overflow-visible">
          {/* Background arc */}
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke="#202836" // base-700
            strokeWidth={s.strokeWidth}
            strokeLinecap="round"
          />
          {/* Score arc with animation */}
          <motion.path
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke={config.color}
            strokeWidth={s.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{
              filter: `drop-shadow(0 0 8px ${config.color}60)`,
            }}
          />
        </svg>
        
        {/* Score text absolute centered */}
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <span 
            className="font-bold font-sans tracking-tighter" 
            style={{ fontSize: s.fontSize, color: '#E4E8F1', lineHeight: 1 }}
          >
            {animatedScore}
          </span>
        </div>
      </div>
      
      {showLabel && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`mt-4 px-4 py-1.5 rounded-full border border-current ${config.bgColor}`}
        >
          <span className={`${s.labelSize} font-bold uppercase tracking-wider ${config.textColor}`}>
            {config.band}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default TrustScoreMeter;
