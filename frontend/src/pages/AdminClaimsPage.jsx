import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  HiFilter, HiSearch, HiCheck, HiX, HiFlag, HiEye,
  HiChevronDown, HiChevronUp, HiRefresh,
} from 'react-icons/hi';
import { getAdminClaims } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const ZONES = [
  '', 'Kukatpally', 'Banjara Hills', 'LB Nagar', 'Jubilee Hills', 'Old City',
  'Gachibowli', 'Secunderabad', 'Madhapur', 'Ameerpet', 'Dilsukhnagar',
];

const DISRUPTION_TYPES = ['', 'heavy_rain', 'extreme_heat', 'flood', 'curfew'];
const STATUS_OPTIONS = ['', 'pending', 'approved', 'paid', 'rejected', 'flagged', 'processing'];

const DEMO_CLAIMS = [
  { id: 'CLM-001', worker_id: 'WKR-001', worker_name: 'Rajesh Kumar', zone: 'Kukatpally', disruption_type: 'heavy_rain', payout_amount: 340, income_loss: 400, disrupted_hours: 5, fraud_score: 0.12, status: 'paid', severity: 'high', gps_verified: true, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'CLM-002', worker_name: 'Priya Mehta', worker_id: 'WKR-002', zone: 'Banjara Hills', disruption_type: 'extreme_heat', payout_amount: 280, income_loss: 320, disrupted_hours: 4, fraud_score: 0.08, status: 'paid', severity: 'medium', gps_verified: true, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'CLM-003', worker_name: 'Suresh Babu', worker_id: 'WKR-003', zone: 'Old City', disruption_type: 'heavy_rain', payout_amount: 450, income_loss: 530, disrupted_hours: 6, fraud_score: 0.45, status: 'pending', severity: 'high', gps_verified: true, created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 'CLM-004', worker_name: 'Lakshmi Naidu', worker_id: 'WKR-004', zone: 'Gachibowli', disruption_type: 'flood', payout_amount: 620, income_loss: 700, disrupted_hours: 8, fraud_score: 0.82, status: 'flagged', severity: 'extreme', gps_verified: false, fraud_indicators: ['GPS mismatch', 'Unusual timing', 'High payout request'], created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: 'CLM-005', worker_name: 'Anil Reddy', worker_id: 'WKR-005', zone: 'Madhapur', disruption_type: 'heavy_rain', payout_amount: 310, income_loss: 350, disrupted_hours: 4, fraud_score: 0.05, status: 'approved', severity: 'medium', gps_verified: true, created_at: new Date(Date.now() - 18000000).toISOString() },
  { id: 'CLM-006', worker_name: 'Deepa Sharma', worker_id: 'WKR-006', zone: 'Secunderabad', disruption_type: 'extreme_heat', payout_amount: 220, income_loss: 260, disrupted_hours: 3, fraud_score: 0.15, status: 'paid', severity: 'medium', gps_verified: true, created_at: new Date(Date.now() - 21600000).toISOString() },
  { id: 'CLM-007', worker_name: 'Vikram Patel', worker_id: 'WKR-007', zone: 'Ameerpet', disruption_type: 'curfew', payout_amount: 530, income_loss: 640, disrupted_hours: 8, fraud_score: 0.68, status: 'pending', severity: 'high', gps_verified: true, fraud_indicators: ['Near threshold'], created_at: new Date(Date.now() - 25200000).toISOString() },
  { id: 'CLM-008', worker_name: 'Meera Rao', worker_id: 'WKR-008', zone: 'Dilsukhnagar', disruption_type: 'heavy_rain', payout_amount: 180, income_loss: 200, disrupted_hours: 2, fraud_score: 0.02, status: 'paid', severity: 'low', gps_verified: true, created_at: new Date(Date.now() - 28800000).toISOString() },
  { id: 'CLM-009', worker_name: 'Ravi Teja', worker_id: 'WKR-009', zone: 'LB Nagar', disruption_type: 'flood', payout_amount: 780, income_loss: 900, disrupted_hours: 10, fraud_score: 0.91, status: 'flagged', severity: 'extreme', gps_verified: false, fraud_indicators: ['GPS mismatch', 'Duplicate claim', 'Impossible timing'], created_at: new Date(Date.now() - 32400000).toISOString() },
  { id: 'CLM-010', worker_name: 'Kavita Desai', worker_id: 'WKR-010', zone: 'Jubilee Hills', disruption_type: 'heavy_rain', payout_amount: 290, income_loss: 340, disrupted_hours: 4, fraud_score: 0.10, status: 'approved', severity: 'medium', gps_verified: true, created_at: new Date(Date.now() - 36000000).toISOString() },
];

const statusConfig = {
  pending: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  approved: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  paid: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  rejected: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  flagged: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  processing: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
};

const AdminClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [filters, setFilters] = useState({
    status: '',
    disruption_type: '',
    zone: '',
  });

  const fetchClaims = useCallback(async () => {
    try {
      const result = await getAdminClaims(filters);
      const claimsData = Array.isArray(result) ? result : result?.claims || [];
      setClaims(claimsData.length > 0 ? claimsData : DEMO_CLAIMS);
    } catch (error) {
      console.error('Error fetching admin claims:', error);
      setClaims(DEMO_CLAIMS);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleAction = (claimId, action) => {
    // In a real app, this would call the API
    toast.success(`Claim ${claimId} ${action} successfully`);
    setClaims(prev => prev.map(c =>
      c.id === claimId ? { ...c, status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged' } : c
    ));
  };

  // Filter and sort
  const filtered = claims.filter(claim => {
    if (filters.status && (claim.status || '').toLowerCase() !== filters.status) return false;
    if (filters.disruption_type && (claim.disruption_type || '').toLowerCase() !== filters.disruption_type) return false;
    if (filters.zone && claim.zone !== filters.zone) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'created_at') {
      aVal = new Date(aVal || 0).getTime();
      bVal = new Date(bVal || 0).getTime();
    }
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <HiChevronDown className="w-3 h-3 text-slate-600" />;
    return sortDir === 'asc'
      ? <HiChevronUp className="w-3 h-3 text-primary-400" />
      : <HiChevronDown className="w-3 h-3 text-primary-400" />;
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading claims..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Claims Management</h1>
          <p className="text-slate-400 text-sm mt-1">Review, approve, and manage all claims</p>
        </div>
        <button onClick={fetchClaims} className="btn-outline flex items-center gap-2 text-sm">
          <HiRefresh className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <HiFilter className="w-4 h-4" />
            <span>Filters:</span>
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="select-field max-w-[160px] text-sm"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Status'}</option>
            ))}
          </select>
          <select
            value={filters.disruption_type}
            onChange={(e) => setFilters(prev => ({ ...prev, disruption_type: e.target.value }))}
            className="select-field max-w-[160px] text-sm"
          >
            {DISRUPTION_TYPES.map(t => (
              <option key={t} value={t}>{t ? t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Types'}</option>
            ))}
          </select>
          <select
            value={filters.zone}
            onChange={(e) => setFilters(prev => ({ ...prev, zone: e.target.value }))}
            className="select-field max-w-[160px] text-sm"
          >
            {ZONES.map(z => (
              <option key={z} value={z}>{z || 'All Zones'}</option>
            ))}
          </select>
          {(filters.status || filters.disruption_type || filters.zone) && (
            <button
              onClick={() => setFilters({ status: '', disruption_type: '', zone: '' })}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              Clear all
            </button>
          )}
          <span className="text-xs text-slate-500 ml-auto">{sorted.length} claims</span>
        </div>
      </div>

      {/* Claims Table */}
      {sorted.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700/50">
                  <th onClick={() => handleSort('worker_name')} className="text-left py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white select-none">
                    <span className="flex items-center gap-1">Worker <SortIcon field="worker_name" /></span>
                  </th>
                  <th onClick={() => handleSort('zone')} className="text-left py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white select-none">
                    <span className="flex items-center gap-1">Zone <SortIcon field="zone" /></span>
                  </th>
                  <th onClick={() => handleSort('disruption_type')} className="text-left py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white select-none">
                    <span className="flex items-center gap-1">Type <SortIcon field="disruption_type" /></span>
                  </th>
                  <th onClick={() => handleSort('payout_amount')} className="text-right py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white select-none">
                    <span className="flex items-center justify-end gap-1">Amount <SortIcon field="payout_amount" /></span>
                  </th>
                  <th onClick={() => handleSort('fraud_score')} className="text-center py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white select-none">
                    <span className="flex items-center justify-center gap-1">Fraud <SortIcon field="fraud_score" /></span>
                  </th>
                  <th onClick={() => handleSort('status')} className="text-center py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white select-none">
                    <span className="flex items-center justify-center gap-1">Status <SortIcon field="status" /></span>
                  </th>
                  <th onClick={() => handleSort('created_at')} className="text-left py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white select-none">
                    <span className="flex items-center gap-1">Date <SortIcon field="created_at" /></span>
                  </th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((claim) => {
                  const score = claim.fraud_score || 0;
                  const status = statusConfig[(claim.status || 'pending').toLowerCase()] || statusConfig.pending;
                  const isExpanded = expandedRow === claim.id;

                  return (
                    <React.Fragment key={claim.id}>
                      <tr
                        className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-700/20' : ''}`}
                        onClick={() => setExpandedRow(isExpanded ? null : claim.id)}
                      >
                        <td className="py-3 px-4 text-white font-medium">{claim.worker_name || claim.worker_id}</td>
                        <td className="py-3 px-4 text-slate-400">{claim.zone}</td>
                        <td className="py-3 px-4 text-slate-300 capitalize">{(claim.disruption_type || '').replace(/_/g, ' ')}</td>
                        <td className="py-3 px-4 text-right text-white font-medium">{`\u20B9${(claim.payout_amount || 0).toLocaleString('en-IN')}`}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            score > 0.75 ? 'bg-red-500/15 text-red-400' :
                            score > 0.3 ? 'bg-amber-500/15 text-amber-400' :
                            'bg-emerald-500/15 text-emerald-400'
                          }`}>
                            {(score * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                            {(claim.status || 'pending').charAt(0).toUpperCase() + (claim.status || 'pending').slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
                          {claim.created_at ? format(new Date(claim.created_at), 'dd MMM, hh:mm a') : '--'}
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {(claim.status === 'pending' || claim.status === 'flagged') && (
                              <>
                                <button
                                  onClick={() => handleAction(claim.id, 'approve')}
                                  className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                  title="Approve"
                                >
                                  <HiCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleAction(claim.id, 'reject')}
                                  className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                                  title="Reject"
                                >
                                  <HiX className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {claim.status === 'pending' && (
                              <button
                                onClick={() => handleAction(claim.id, 'flag')}
                                className="p-1 rounded hover:bg-orange-500/20 text-orange-400 transition-colors"
                                title="Flag for review"
                              >
                                <HiFlag className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr className="bg-slate-800/50">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm animate-fade-in">
                              <div>
                                <span className="text-slate-500 text-xs">Worker ID</span>
                                <p className="text-slate-300 font-mono text-xs">{claim.worker_id}</p>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs">Claim ID</span>
                                <p className="text-slate-300 font-mono text-xs">{claim.id}</p>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs">Income Loss</span>
                                <p className="text-red-400 font-medium">{`\u20B9${claim.income_loss || 0}`}</p>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs">Disrupted Hours</span>
                                <p className="text-slate-300">{claim.disrupted_hours || 0}h</p>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs">Severity</span>
                                <p className="text-slate-300 capitalize">{claim.severity || '--'}</p>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs">GPS Verified</span>
                                <p className={claim.gps_verified ? 'text-emerald-400' : 'text-red-400'}>
                                  {claim.gps_verified ? 'Yes' : 'No'}
                                </p>
                              </div>
                              {claim.fraud_indicators && claim.fraud_indicators.length > 0 && (
                                <div className="col-span-2">
                                  <span className="text-slate-500 text-xs block mb-1">Fraud Indicators</span>
                                  <div className="flex flex-wrap gap-1">
                                    {claim.fraud_indicators.map((ind, j) => (
                                      <span key={j} className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">{ind}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={HiSearch}
          title="No Claims Found"
          message="Adjust your filters or wait for new claims to be generated."
          ctaText="Clear Filters"
          onCtaClick={() => setFilters({ status: '', disruption_type: '', zone: '' })}
        />
      )}
    </div>
  );
};

export default AdminClaimsPage;
