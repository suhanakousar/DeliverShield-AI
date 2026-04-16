import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineFilter, HiOutlineSearch } from 'react-icons/hi';
import { getClaims } from '../services/api';
import ClaimCard from '../components/ClaimCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const ClaimsPage = () => {
  const { workerId } = useParams();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const result = await getClaims(workerId);
      const claimsData = Array.isArray(result) ? result : result?.claims || [];
      setClaims(claimsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredClaims = claims.filter(c => {
    if (filter === 'all') return true;
    return (c.status || '').toLowerCase() === filter;
  }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const totalPaid = claims
    .filter(c => (c.status || '').toLowerCase() === 'paid')
    .reduce((sum, c) => sum + (c.payout_amount || c.payout || 0), 0);

  if (loading) return <LoadingSpinner fullScreen text="Loading Claims" />;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-sans tracking-tighter text-base-100 mb-2">
            Claims History
          </h1>
          <p className="text-base-400 font-medium">Review your automatic payouts and disruption records.</p>
        </div>
        
        <div className="card p-4 border-primary-500/30 bg-primary-900/10 min-w-[200px]">
          <p className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-1">Total Paid Out</p>
          <p className="text-3xl font-extrabold text-base-100">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center gap-2 text-base-500 mr-2 shrink-0">
          <HiOutlineFilter className="w-5 h-5" />
        </div>
        {['all', 'paid', 'pending', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              filter === status ? 'bg-base-100 text-base-950' : 'bg-base-900 text-base-400 hover:bg-base-800 hover:text-base-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {filteredClaims.length > 0 ? (
        <div className="space-y-4">
          {filteredClaims.map((claim, i) => (
            <ClaimCard key={claim.id || i} claim={claim} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={HiOutlineSearch}
          title="No claims found"
          message={filter === 'all' ? "You don't have any disruption claims yet." : `No claims found with status '${filter}'.`}
          ctaText={filter !== 'all' ? "Clear Filter" : null}
          onCtaClick={() => setFilter('all')}
        />
      )}
    </div>
  );
};

export default ClaimsPage;
