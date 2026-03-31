import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { HiFilter, HiCurrencyRupee, HiClock, HiCheckCircle, HiShieldCheck } from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import { getClaims, getPayouts } from '../services/api';
import ClaimCard from '../components/ClaimCard';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const DISRUPTION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'heavy_rain', label: 'Heavy Rain' },
  { value: 'extreme_heat', label: 'Extreme Heat' },
  { value: 'flood', label: 'Flood' },
  { value: 'curfew', label: 'Curfew/Bandh' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'flagged', label: 'Flagged' },
];

const ClaimsPage = () => {
  const { workerId } = useParams();
  const { currentWorker } = useApp();
  const [claims, setClaims] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        getClaims(workerId),
        getPayouts(workerId),
      ]);

      if (results[0].status === 'fulfilled') {
        const claimsData = Array.isArray(results[0].value) ? results[0].value : results[0].value?.claims || [];
        setClaims(claimsData);
      }

      if (results[1].status === 'fulfilled') {
        const payoutsData = Array.isArray(results[1].value) ? results[1].value : results[1].value?.payouts || [];
        setPayouts(payoutsData);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed values
  const filteredClaims = claims.filter(claim => {
    const matchStatus = !filterStatus || (claim.status || '').toLowerCase() === filterStatus;
    const matchType = !filterType || (claim.disruption_type || claim.type || '').toLowerCase() === filterType;
    return matchStatus && matchType;
  }).sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));

  const totalClaims = claims.length;
  const totalPaid = claims
    .filter(c => (c.status || '').toLowerCase() === 'paid')
    .reduce((sum, c) => sum + (c.payout_amount || c.payout || 0), 0);
  const pendingClaims = claims.filter(c => (c.status || '').toLowerCase() === 'pending').length;
  const approvedAmount = claims
    .filter(c => ['paid', 'approved'].includes((c.status || '').toLowerCase()))
    .reduce((sum, c) => sum + (c.payout_amount || c.payout || 0), 0);

  if (loading) return <LoadingSpinner fullScreen text="Loading claims..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Claims History</h1>
        <p className="text-slate-400">Track all your disruption claims and payouts.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          icon={HiCheckCircle}
          label="Total Claims"
          value={totalClaims}
          color="primary"
        />
        <StatsCard
          icon={HiCurrencyRupee}
          label="Total Paid"
          value={`\u20B9${totalPaid.toLocaleString('en-IN')}`}
          color="accent"
        />
        <StatsCard
          icon={HiClock}
          label="Pending"
          value={pendingClaims}
          color="amber"
        />
        <StatsCard
          icon={HiCurrencyRupee}
          label="Approved Amount"
          value={`\u20B9${approvedAmount.toLocaleString('en-IN')}`}
          color="blue"
        />
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <HiFilter className="w-4 h-4" />
            <span>Filters:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select-field max-w-[180px]"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select-field max-w-[180px]"
          >
            {DISRUPTION_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {(filterStatus || filterType) && (
            <button
              onClick={() => { setFilterStatus(''); setFilterType(''); }}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              Clear filters
            </button>
          )}
          <span className="text-xs text-slate-500 ml-auto">
            {filteredClaims.length} of {totalClaims} claims
          </span>
        </div>
      </div>

      {/* Claims List */}
      {filteredClaims.length > 0 ? (
        <div className="space-y-4">
          {filteredClaims.map((claim, index) => (
            <ClaimCard key={claim.id || index} claim={claim} expandable={true} />
          ))}
        </div>
      ) : totalClaims > 0 ? (
        <EmptyState
          icon={HiFilter}
          title="No Matching Claims"
          message="Try adjusting your filters to see more claims."
          ctaText="Clear Filters"
          onCtaClick={() => { setFilterStatus(''); setFilterType(''); }}
        />
      ) : (
        <EmptyState
          icon={HiShieldCheck}
          title="No Disruptions Detected Yet"
          message="Your coverage is active and monitoring for disruptions. Claims will appear here automatically when qualifying events occur."
          ctaText="View Policy"
          ctaLink={`/policies/${workerId}`}
        />
      )}
    </div>
  );
};

export default ClaimsPage;
