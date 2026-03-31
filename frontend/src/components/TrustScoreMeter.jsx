import React from 'react';

const getTrustConfig = (score) => {
  if (score >= 80) return { band: 'Trusted', color: '#10B981', bgColor: 'bg-emerald-500/15', textColor: 'text-emerald-400' };
  if (score >= 55) return { band: 'Standard', color: '#F59E0B', bgColor: 'bg-amber-500/15', textColor: 'text-amber-400' };
  if (score >= 30) return { band: 'Elevated Risk', color: '#F97316', bgColor: 'bg-orange-500/15', textColor: 'text-orange-400' };
  return { band: 'Flagged', color: '#EF4444', bgColor: 'bg-red-500/15', textColor: 'text-red-400' };
};

const TrustScoreMeter = ({ score = 0, size = 'md', showLabel = true }) => {
  const safeScore = Math.max(0, Math.min(100, score));
  const config = getTrustConfig(safeScore);

  const sizeConfig = {
    sm: { width: 120, height: 70, strokeWidth: 8, fontSize: 20, labelSize: 'text-xs' },
    md: { width: 180, height: 100, strokeWidth: 10, fontSize: 28, labelSize: 'text-sm' },
    lg: { width: 240, height: 130, strokeWidth: 12, fontSize: 36, labelSize: 'text-base' },
  };

  const s = sizeConfig[size] || sizeConfig.md;

  // Semicircular gauge SVG
  const centerX = s.width / 2;
  const centerY = s.height - 10;
  const radius = s.width / 2 - s.strokeWidth - 5;

  // Arc from 180 degrees to 0 degrees (left to right, semicircle)
  const startAngle = Math.PI;
  const endAngle = 0;
  const scoreAngle = startAngle - (safeScore / 100) * Math.PI;

  const bgArcEnd = {
    x: centerX + radius * Math.cos(endAngle),
    y: centerY - radius * Math.sin(endAngle),
  };
  const bgArcStart = {
    x: centerX + radius * Math.cos(startAngle),
    y: centerY - radius * Math.sin(startAngle),
  };

  const scoreArcEnd = {
    x: centerX + radius * Math.cos(scoreAngle),
    y: centerY - radius * Math.sin(scoreAngle),
  };

  const bgPath = `M ${bgArcStart.x} ${bgArcStart.y} A ${radius} ${radius} 0 0 1 ${bgArcEnd.x} ${bgArcEnd.y}`;
  const scorePath = `M ${bgArcStart.x} ${bgArcStart.y} A ${radius} ${radius} 0 0 1 ${scoreArcEnd.x} ${scoreArcEnd.y}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={s.width} height={s.height} viewBox={`0 0 ${s.width} ${s.height}`}>
        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="#334155"
          strokeWidth={s.strokeWidth}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={scorePath}
          fill="none"
          stroke={config.color}
          strokeWidth={s.strokeWidth}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${config.color}40)`,
          }}
        />
        {/* Score text */}
        <text
          x={centerX}
          y={centerY - 15}
          textAnchor="middle"
          fill="white"
          fontSize={s.fontSize}
          fontWeight="bold"
          fontFamily="Inter, sans-serif"
        >
          {safeScore}
        </text>
      </svg>
      {showLabel && (
        <div className={`mt-1 px-3 py-0.5 rounded-full ${config.bgColor}`}>
          <span className={`${s.labelSize} font-medium ${config.textColor}`}>
            {config.band}
          </span>
        </div>
      )}
    </div>
  );
};

export default TrustScoreMeter;
