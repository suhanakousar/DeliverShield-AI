import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCloud, HiOutlineSun, HiOutlineShieldExclamation, HiChevronDown } from 'react-icons/hi';

const disruptionConfig = {
  heavy_rain: { icon: HiOutlineCloud, label: 'Heavy Rain', color: 'text-info-400', bg: 'bg-info-500/10' },
  extreme_heat: { icon: HiOutlineSun, label: 'Extreme Heat', color: 'text-warning-400', bg: 'bg-warning-500/10' },
  flood: { icon: HiOutlineCloud, label: 'Flood', color: 'text-primary-400', bg: 'bg-primary-500/10' },
  curfew: { icon: HiOutlineShieldExclamation, label: 'Curfew/Bandh', color: 'text-danger-400', bg: 'bg-danger-500/10' },
};

const statusConfig = {
  pending: { label: 'Processing', bg: 'bg-warning-500/20', text: 'text-warning-400', border: 'border-warning-500/30' },
  approved: { label: 'Approved', bg: 'bg-info-500/20', text: 'text-info-400', border: 'border-info-500/30' },
  paid: { label: 'Paid Instantly', bg: 'bg-success-500/20', text: 'text-success-400', border: 'border-success-500/30' },
  rejected: { label: 'Rejected', bg: 'bg-base-800', text: 'text-base-400', border: 'border-base-700' },
  flagged: { label: 'Review Required', bg: 'bg-danger-500/20', text: 'text-danger-400', border: 'border-danger-500/30' },
};

const ClaimCard = ({ claim, expandable = true }) => {
  const [expanded, setExpanded] = useState(false);

  if (!claim) return null;

  const type = (claim.disruption_type || claim.type || 'heavy_rain').toLowerCase();
  const config = disruptionConfig[type] || { icon: HiOutlineShieldExclamation, label: type.replace(/_/g, ' '), color: 'text-base-400', bg: 'bg-base-800' };
  const status = statusConfig[(claim.status || 'pending').toLowerCase()] || statusConfig.pending;
  const fraudScore = claim.fraud_score ?? claim.fraud_risk_score ?? 0;
  const payout = claim.payout_amount || claim.payout || 0;
  const incomeLoss = claim.income_loss || claim.estimated_loss || 0;
  const hours = claim.disrupted_hours || claim.hours_affected || 0;
  const claimDate = claim.created_at || claim.date || claim.timestamp;

  const Icon = config.icon;

  return (
    <motion.div
      layout
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className={`card p-0 overflow-hidden border ${expandable ? 'cursor-pointer hover:border-base-600' : ''} transition-colors duration-300`}
      onClick={() => expandable && setExpanded(!expanded)}
    >
      <div className="p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
          <Icon className={`w-7 h-7 ${config.color}`} />
        </div>
        
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-bold text-lg text-base-100 truncate">{config.label} Disruption</h4>
            <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${status.bg} ${status.text} ${status.border}`}>
              {status.label}
            </span>
          </div>
          {claimDate && (
            <p className="text-sm font-medium text-base-500">
              {format(new Date(claimDate), 'MMM d, yyyy • h:mm a')}
            </p>
          )}
        </div>

        <div className="hidden md:flex items-center gap-6 pr-4">
          <div className="text-right">
            <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-1">Hours</p>
            <p className="font-bold text-base-100">{hours}h</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-1">Loss</p>
            <p className="font-bold text-base-100">₹{incomeLoss}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-1">Payout</p>
            <p className="text-xl font-bold text-success-400">₹{payout}</p>
          </div>
        </div>

        {expandable && (
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} className="text-base-500 hidden md:block shrink-0">
            <HiChevronDown className="w-5 h-5" />
          </motion.div>
        )}
      </div>

      {/* Mobile stats row */}
      <div className="md:hidden grid grid-cols-3 gap-1 px-5 pb-5">
        <div className="bg-base-950/50 rounded-lg p-2 text-center border border-base-800">
          <p className="text-[10px] font-bold text-base-500 uppercase tracking-wider">Hours</p>
          <p className="font-bold text-base-100">{hours}h</p>
        </div>
        <div className="bg-base-950/50 rounded-lg p-2 text-center border border-base-800">
          <p className="text-[10px] font-bold text-base-500 uppercase tracking-wider">Loss</p>
          <p className="font-bold text-base-100">₹{incomeLoss}</p>
        </div>
        <div className="bg-base-950/50 rounded-lg p-2 text-center border border-base-800">
          <p className="text-[10px] font-bold text-base-500 uppercase tracking-wider">Payout</p>
          <p className="font-bold text-success-400">₹{payout}</p>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-base-800/50 bg-base-950/30"
          >
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {claim.zone && (
                  <div className="flex justify-between border-b border-base-800 pb-2">
                    <span className="text-sm font-semibold text-base-500">Delivery Zone</span>
                    <span className="text-sm font-bold text-base-200">{claim.zone}</span>
                  </div>
                )}
                {claim.id && (
                  <div className="flex justify-between border-b border-base-800 pb-2">
                    <span className="text-sm font-semibold text-base-500">Claim ID</span>
                    <span className="text-sm font-mono text-base-200">{claim.id}</span>
                  </div>
                )}
                {claim.severity && (
                  <div className="flex justify-between border-b border-base-800 pb-2">
                    <span className="text-sm font-semibold text-base-500">Event Severity</span>
                    <span className="text-sm font-bold text-base-200 capitalize">{claim.severity}</span>
                  </div>
                )}
                {claim.gps_verified !== undefined && (
                  <div className="flex justify-between border-b border-base-800 pb-2">
                    <span className="text-sm font-semibold text-base-500">GPS Verified</span>
                    <span className={`text-sm font-bold ${claim.gps_verified ? 'text-success-400' : 'text-danger-400'}`}>
                      {claim.gps_verified ? 'Verified' : 'Failed'}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-base-900 rounded-xl p-4 border border-base-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-base-400 uppercase tracking-wider">Fraud Analysis Score</span>
                  <span className={`font-bold ${
                    fraudScore > 0.75 ? 'text-danger-400' : fraudScore > 0.3 ? 'text-warning-400' : 'text-success-400'
                  }`}>
                    {(fraudScore * 100).toFixed(0)}% Risk
                  </span>
                </div>
                <div className="w-full bg-base-950 rounded-full h-2 mb-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      fraudScore > 0.75 ? 'bg-danger-500' : fraudScore > 0.3 ? 'bg-warning-500' : 'bg-success-500'
                    }`}
                    style={{ width: `${Math.max(5, fraudScore * 100)}%` }}
                  />
                </div>
                
                {claim.fraud_indicators && claim.fraud_indicators.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {claim.fraud_indicators.map((indicator, i) => (
                      <span key={i} className="px-2.5 py-1 bg-danger-500/10 border border-danger-500/20 text-danger-400 rounded-md text-xs font-bold">
                        Flag: {indicator}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ClaimCard;
