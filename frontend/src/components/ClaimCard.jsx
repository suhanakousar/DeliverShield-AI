import React, { useState } from 'react';
import { format } from 'date-fns';

const disruptionConfig = {
  heavy_rain: { emoji: '\uD83C\uDF27\uFE0F', label: 'Heavy Rain', color: 'text-blue-400' },
  extreme_heat: { emoji: '\uD83C\uDF21\uFE0F', label: 'Extreme Heat', color: 'text-orange-400' },
  flood: { emoji: '\uD83C\uDF0A', label: 'Flood', color: 'text-cyan-400' },
  curfew: { emoji: '\uD83D\uDEA7', label: 'Curfew/Bandh', color: 'text-red-400' },
  storm: { emoji: '\u26C8\uFE0F', label: 'Storm', color: 'text-purple-400' },
};

const statusConfig = {
  pending: { label: 'Pending', bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  approved: { label: 'Approved', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  paid: { label: 'Paid', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  rejected: { label: 'Rejected', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  flagged: { label: 'Flagged', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  processing: { label: 'Processing', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
};

const ClaimCard = ({ claim, expandable = true }) => {
  const [expanded, setExpanded] = useState(false);

  if (!claim) return null;

  const type = (claim.disruption_type || claim.type || 'heavy_rain').toLowerCase();
  const disruption = disruptionConfig[type] || { emoji: '\u26A0\uFE0F', label: type.replace(/_/g, ' '), color: 'text-slate-400' };
  const status = statusConfig[(claim.status || 'pending').toLowerCase()] || statusConfig.pending;
  const fraudScore = claim.fraud_score ?? claim.fraud_risk_score ?? 0;
  const payout = claim.payout_amount || claim.payout || 0;
  const incomeLoss = claim.income_loss || claim.estimated_loss || 0;
  const hours = claim.disrupted_hours || claim.hours_affected || 0;
  const claimDate = claim.created_at || claim.date || claim.timestamp;

  return (
    <div
      className={`card border border-slate-700/50 ${expandable ? 'cursor-pointer hover:border-slate-600' : ''} transition-all duration-200`}
      onClick={() => expandable && setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{disruption.emoji}</span>
          <div>
            <h4 className={`font-semibold ${disruption.color}`}>{disruption.label}</h4>
            {claimDate && (
              <p className="text-xs text-slate-500">
                {format(new Date(claimDate), 'dd MMM yyyy, hh:mm a')}
              </p>
            )}
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="bg-slate-700/30 rounded-lg p-2 text-center">
          <p className="text-xs text-slate-500">Hours</p>
          <p className="text-sm font-bold text-white">{hours}h</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-2 text-center">
          <p className="text-xs text-slate-500">Loss</p>
          <p className="text-sm font-bold text-red-400">{`\u20B9${incomeLoss}`}</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-2 text-center">
          <p className="text-xs text-slate-500">Payout</p>
          <p className="text-sm font-bold text-emerald-400">{`\u20B9${payout}`}</p>
        </div>
      </div>

      {fraudScore > 0 && (
        <div className={`flex items-center gap-2 mt-2 px-2 py-1 rounded text-xs ${
          fraudScore > 0.75 ? 'bg-red-500/10 text-red-400' :
          fraudScore > 0.3 ? 'bg-amber-500/10 text-amber-400' :
          'bg-slate-700/30 text-slate-400'
        }`}>
          <span>Fraud Score:</span>
          <span className="font-bold">{(fraudScore * 100).toFixed(0)}%</span>
          <div className="flex-1 bg-slate-700/50 rounded-full h-1.5 ml-1">
            <div
              className={`h-1.5 rounded-full ${
                fraudScore > 0.75 ? 'bg-red-500' :
                fraudScore > 0.3 ? 'bg-amber-500' :
                'bg-emerald-500'
              }`}
              style={{ width: `${fraudScore * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-700/50 animate-fade-in">
          <div className="space-y-2 text-sm">
            {claim.zone && (
              <div className="flex justify-between">
                <span className="text-slate-500">Zone</span>
                <span className="text-slate-300">{claim.zone}</span>
              </div>
            )}
            {claim.worker_id && (
              <div className="flex justify-between">
                <span className="text-slate-500">Worker ID</span>
                <span className="text-slate-300 font-mono text-xs">{claim.worker_id}</span>
              </div>
            )}
            {claim.event_id && (
              <div className="flex justify-between">
                <span className="text-slate-500">Event ID</span>
                <span className="text-slate-300 font-mono text-xs">{claim.event_id}</span>
              </div>
            )}
            {claim.severity && (
              <div className="flex justify-between">
                <span className="text-slate-500">Severity</span>
                <span className="text-slate-300 capitalize">{claim.severity}</span>
              </div>
            )}
            {claim.gps_verified !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">GPS Verified</span>
                <span className={claim.gps_verified ? 'text-emerald-400' : 'text-red-400'}>
                  {claim.gps_verified ? 'Yes' : 'No'}
                </span>
              </div>
            )}
            {claim.fraud_indicators && claim.fraud_indicators.length > 0 && (
              <div>
                <span className="text-slate-500 block mb-1">Fraud Indicators</span>
                <div className="flex flex-wrap gap-1">
                  {claim.fraud_indicators.map((indicator, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {expandable && (
        <p className="text-xs text-slate-600 text-center mt-2">
          {expanded ? 'Click to collapse' : 'Click for details'}
        </p>
      )}
    </div>
  );
};

export default ClaimCard;
