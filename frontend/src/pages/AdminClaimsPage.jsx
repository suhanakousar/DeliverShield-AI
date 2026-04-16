import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { HiOutlineCheck, HiOutlineX, HiOutlineFlag, HiOutlineCash, HiOutlineSearch } from 'react-icons/hi';
import { getAdminClaims, processManualAdminPayout, reviewAdminClaim } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

const AdminClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);

  const fetchClaims = useCallback(async () => {
    try {
      const result = await getAdminClaims();
      const data = Array.isArray(result) ? result : result?.claims || [];
      setTotal(result?.total ?? data.length);
      setClaims(data);
    } catch (e) {
      toast.error('Failed to load claims');
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const handleAction = async (id, action) => {
    setProcessingId(`${id}:${action}`);
    try {
      const result = await reviewAdminClaim(id, action);
      setClaims(prev => prev.map(c => c.id === id ? { ...c, status: result.status } : c));
      toast.success(result.message || `Claim ${action}d`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update claim');
    } finally {
      setProcessingId(null);
    }
  };

  const handleManualPayout = async (id) => {
    setProcessingId(`${id}:payout`);
    try {
      const result = await processManualAdminPayout(id);
      setClaims(prev => prev.map(c => c.id === id ? { ...c, status: 'paid' } : c));
      toast.success(result.message || 'Manual payout completed');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Manual payout failed');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = claims.filter(c =>
    filter === 'all' || (c.status || '').toLowerCase() === filter
  );

  if (loading) return <LoadingSpinner fullScreen text="Loading Records" />;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-sans tracking-tighter text-base-100 mb-2">Claim Records</h1>
        <p className="text-base-400 font-medium">
          {total > 0 ? `${total} total claim${total !== 1 ? 's' : ''} in the system.` : 'Review and manage disruption payouts.'}
        </p>
      </div>

      <div className="flex gap-2 border-b border-base-800 pb-4 overflow-x-auto scrollbar-hide">
        {['all', 'pending', 'flagged', 'approved', 'paid', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-5 py-2 rounded-xl text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-primary-500 text-base-950'
                : 'bg-base-900 text-base-400 hover:bg-base-800 hover:text-base-200'
            }`}
          >
            {status}
            {filter !== status && (
              <span className="ml-1.5 text-xs opacity-60">
                {claims.filter(c => status === 'all' || c.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={HiOutlineSearch}
          title={filter === 'all' ? 'No claims yet' : `No ${filter} claims`}
          message={
            filter === 'all'
              ? 'Claims appear automatically when disruptions are detected and workers are on shift. Use "Simulate Event" to trigger one.'
              : `There are no claims with status "${filter}" at the moment.`
          }
          ctaText={filter !== 'all' ? 'View all claims' : null}
          onCtaClick={() => setFilter('all')}
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-base-950/50 border-b border-base-800">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-base-500">Date</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-base-500">Worker</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-base-500">Details</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-base-500 text-right">Payout</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-base-500 text-center">Fraud Risk</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-base-500 text-center">Status</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-base-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-800">
                {filtered.map((claim, i) => {
                  const score = claim.fraud_score || 0;
                  const status = (claim.status || 'pending').toLowerCase();

                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      key={claim.id}
                      className="hover:bg-base-800/30 transition-colors"
                    >
                      <td className="p-4 text-sm text-base-400 whitespace-nowrap">
                        {format(new Date(claim.created_at || Date.now()), 'MMM d, HH:mm')}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-base-100">{claim.worker_name || '—'}</p>
                        <p className="text-xs text-base-500">{(claim.worker_zone || claim.zone || '').replace(/_/g, ' ')}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-base-200 capitalize">{(claim.disruption_type || '').replace(/_/g, ' ')}</p>
                        {claim.disrupted_hours && (
                          <p className="text-xs text-base-500">{claim.disrupted_hours}h disruption</p>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-bold text-success-400">
                          ₹{(claim.payout_amount || 0).toFixed(2)}
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                          score > 0.75 ? 'bg-danger-500/20 text-danger-400'
                            : score > 0.3 ? 'bg-warning-500/20 text-warning-400'
                            : 'bg-success-500/20 text-success-400'
                        }`}>
                          {(score * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          status === 'paid' || status === 'approved'
                            ? 'bg-success-500/10 border border-success-500/30 text-success-400'
                            : status === 'rejected'
                            ? 'bg-base-800 border border-base-700 text-base-400'
                            : status === 'flagged'
                            ? 'bg-danger-500/10 border border-danger-500/30 text-danger-400'
                            : 'bg-warning-500/10 border border-warning-500/30 text-warning-400'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {(status === 'pending' || status === 'flagged') ? (
                          <div className="flex items-center justify-end gap-2">
                            <button disabled={!!processingId} onClick={() => handleAction(claim.id, 'approve')}
                              title="Approve"
                              className="w-8 h-8 rounded-lg bg-success-500/10 hover:bg-success-500/20 text-success-500 flex items-center justify-center transition-colors disabled:opacity-50">
                              <HiOutlineCheck className="w-4 h-4" />
                            </button>
                            {status === 'pending' && (
                              <button disabled={!!processingId} onClick={() => handleAction(claim.id, 'flag')}
                                title="Flag for review"
                                className="w-8 h-8 rounded-lg bg-warning-500/10 hover:bg-warning-500/20 text-warning-500 flex items-center justify-center transition-colors disabled:opacity-50">
                                <HiOutlineFlag className="w-4 h-4" />
                              </button>
                            )}
                            <button disabled={!!processingId} onClick={() => handleAction(claim.id, 'reject')}
                              title="Reject"
                              className="w-8 h-8 rounded-lg bg-danger-500/10 hover:bg-danger-500/20 text-danger-500 flex items-center justify-center transition-colors disabled:opacity-50">
                              <HiOutlineX className="w-4 h-4" />
                            </button>
                            <button disabled={!!processingId} onClick={() => handleManualPayout(claim.id)}
                              title="Manual payout"
                              className="w-8 h-8 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 flex items-center justify-center transition-colors disabled:opacity-50">
                              <HiOutlineCash className="w-4 h-4" />
                            </button>
                          </div>
                        ) : status === 'approved' ? (
                          <button disabled={!!processingId} onClick={() => handleManualPayout(claim.id)}
                            title="Process payout"
                            className="w-8 h-8 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 flex items-center justify-center transition-colors disabled:opacity-50">
                            <HiOutlineCash className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-base-500 font-medium">Resolved</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClaimsPage;
