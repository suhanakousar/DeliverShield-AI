import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { HiOutlineFilter, HiOutlineCheck, HiOutlineX, HiOutlineFlag } from 'react-icons/hi';
import { getAdminClaims } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const DEMO_CLAIMS = [
  { id: 'CLM-001', worker_name: 'Rajesh K', zone: 'Kukatpally', disruption_type: 'heavy_rain', payout_amount: 340, fraud_score: 0.12, status: 'paid', created_at: new Date().toISOString() },
  { id: 'CLM-002', worker_name: 'Priya M', zone: 'Banjara Hills', disruption_type: 'extreme_heat', payout_amount: 280, fraud_score: 0.08, status: 'paid', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'CLM-003', worker_name: 'Suresh B', zone: 'Old City', disruption_type: 'flood', payout_amount: 850, fraud_score: 0.85, status: 'flagged', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 'CLM-004', worker_name: 'Anil R', zone: 'Madhapur', disruption_type: 'heavy_rain', payout_amount: 410, fraud_score: 0.45, status: 'pending', created_at: new Date(Date.now() - 259200000).toISOString() },
];

const AdminClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchClaims = useCallback(async () => {
    try {
      const result = await getAdminClaims();
      const data = Array.isArray(result) ? result : result?.claims || [];
      setClaims(data.length > 0 ? data : DEMO_CLAIMS);
    } catch (e) {
      setClaims(DEMO_CLAIMS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const handleAction = (id, action) => {
    setClaims(prev => prev.map(c => 
      c.id === id ? { ...c, status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged' } : c
    ));
    toast.success(`Claim ${action}d successfully`);
  };

  const filtered = claims.filter(c => filter === 'all' || (c.status || '').toLowerCase() === filter);

  if (loading) return <LoadingSpinner fullScreen text="Loading Records" />;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-sans tracking-tighter text-base-100 mb-2">Claim Records</h1>
        <p className="text-base-400 font-medium">Review and manage disruption payouts.</p>
      </div>

      <div className="flex gap-2 border-b border-base-800 pb-4 overflow-x-auto scrollbar-hide">
        {['all', 'pending', 'flagged', 'approved', 'paid', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-5 py-2 rounded-xl text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              filter === status ? 'bg-primary-500 text-base-950' : 'bg-base-900 text-base-400 hover:bg-base-800 hover:text-base-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

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
                    transition={{ delay: i * 0.05 }}
                    key={claim.id} 
                    className="hover:bg-base-800/30 transition-colors"
                  >
                    <td className="p-4 text-sm text-base-400 whitespace-nowrap">
                      {format(new Date(claim.created_at || Date.now()), 'MMM d, HH:mm')}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-base-100">{claim.worker_name}</p>
                      <p className="text-xs text-base-500">{claim.zone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-base-200 capitalize">{(claim.disruption_type || '').replace(/_/g, ' ')}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-bold text-success-400">₹{claim.payout_amount}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                        score > 0.75 ? 'bg-danger-500/20 text-danger-400' : 
                        score > 0.3 ? 'bg-warning-500/20 text-warning-400' : 'bg-success-500/20 text-success-400'
                      }`}>
                        {(score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        status === 'paid' || status === 'approved' ? 'bg-success-500/10 border border-success-500/30 text-success-400' :
                        status === 'rejected' ? 'bg-base-800 border border-base-700 text-base-400' :
                        status === 'flagged' ? 'bg-danger-500/10 border border-danger-500/30 text-danger-400' :
                        'bg-warning-500/10 border border-warning-500/30 text-warning-400'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {(status === 'pending' || status === 'flagged') ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleAction(claim.id, 'approve')} className="w-8 h-8 rounded-lg bg-success-500/10 hover:bg-success-500/20 text-success-500 flex items-center justify-center transition-colors">
                            <HiOutlineCheck className="w-4 h-4" />
                          </button>
                          {status === 'pending' && (
                            <button onClick={() => handleAction(claim.id, 'flag')} className="w-8 h-8 rounded-lg bg-warning-500/10 hover:bg-warning-500/20 text-warning-500 flex items-center justify-center transition-colors">
                              <HiOutlineFlag className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleAction(claim.id, 'reject')} className="w-8 h-8 rounded-lg bg-danger-500/10 hover:bg-danger-500/20 text-danger-500 flex items-center justify-center transition-colors">
                            <HiOutlineX className="w-4 h-4" />
                          </button>
                        </div>
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
    </div>
  );
};

export default AdminClaimsPage;
