import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineLightningBolt, HiOutlineCloud, HiOutlineSun,
  HiOutlineShieldExclamation, HiOutlineCheckCircle, HiOutlineUsers,
  HiOutlineCurrencyRupee, HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { simulateDisruption } from '../services/api';
import toast from 'react-hot-toast';

const ZONES = [
  'Kukatpally', 'Banjara Hills', 'LB Nagar', 'Jubilee Hills',
  'Old City', 'Gachibowli', 'Madhapur', 'Secunderabad', 'Ameerpet', 'Dilsukhnagar',
];

const DISRUPTION_TYPES = [
  { value: 'heavy_rain',    label: 'Heavy Rain',    icon: HiOutlineCloud,           desc: '>15mm/hr rainfall' },
  { value: 'extreme_heat',  label: 'Extreme Heat',  icon: HiOutlineSun,             desc: '>42°C temperature' },
  { value: 'flood',         label: 'Flood',         icon: HiOutlineCloud,           desc: '>15cm waterlogging' },
  { value: 'curfew',        label: 'Curfew',        icon: HiOutlineShieldExclamation, desc: 'Zone inaccessible' },
];

const STAGE_LABELS = [
  'Creating disruption event',
  'Finding affected workers',
  'Running fraud detection',
  'Processing payouts',
];

export default function SimulateDisruptionPage() {
  const [formData, setFormData] = useState({
    event_type: 'heavy_rain',
    zone: 'Kukatpally',
    severity: 'high',
    disrupted_hours: 4,
  });
  const [loading, setLoading] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runStages = async () => {
    for (let i = 0; i < STAGE_LABELS.length; i++) {
      setStageIdx(i);
      await new Promise(r => setTimeout(r, 700));
    }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError('');
    setStageIdx(0);

    const stagesPromise = runStages();
    try {
      const [data] = await Promise.all([
        simulateDisruption({
          event_type: formData.event_type,
          zone: formData.zone,
          severity: formData.severity,
          disrupted_hours: formData.disrupted_hours,
        }),
        stagesPromise,
      ]);
      setResult(data);
      toast.success(`Disruption triggered in ${formData.zone}`);
    } catch (err) {
      await stagesPromise.catch(() => {});
      const msg = err?.response?.data?.detail || 'Simulation failed. Ensure workers have active policies in this zone.';
      setError(msg);
      toast.error('Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-center justify-center text-primary-500 mx-auto mb-6">
          <HiOutlineLightningBolt className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-sans tracking-tighter text-base-100 mb-2">Simulate Event</h1>
        <p className="text-base-400 font-medium">
          Trigger a real disruption end-to-end — finds affected workers, runs fraud detection, and processes payouts.
        </p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSimulate} className="space-y-8">

          <div>
            <label className="label mb-4">Event Type</label>
            <div className="grid grid-cols-2 gap-4">
              {DISRUPTION_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, event_type: type.value }))}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${
                    formData.event_type === type.value
                      ? 'bg-primary-500/10 border-primary-500 text-primary-400'
                      : 'bg-base-950 border-base-800 text-base-400 hover:border-base-700'
                  }`}
                >
                  <type.icon className="w-7 h-7" />
                  <span className="font-bold text-sm">{type.label}</span>
                  <span className="text-xs opacity-60">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Zone</label>
              <select
                value={formData.zone}
                onChange={e => setFormData(prev => ({ ...prev, zone: e.target.value }))}
                className="select-field"
              >
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Severity</label>
              <select
                value={formData.severity}
                onChange={e => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                className="select-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="extreme">Extreme</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Disrupted Hours: {formData.disrupted_hours}h</label>
            <input
              type="range" min="1" max="12"
              value={formData.disrupted_hours}
              onChange={e => setFormData(prev => ({ ...prev, disrupted_hours: Number(e.target.value) }))}
              className="w-full h-2 bg-base-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-base-600 mt-1">
              <span>1h</span><span>12h</span>
            </div>
          </div>

          {/* Processing stages */}
          {loading && (
            <div className="bg-base-950/60 rounded-2xl p-5 border border-base-800 space-y-3">
              {STAGE_LABELS.map((label, i) => (
                <div key={i} className={`flex items-center gap-3 transition-all ${i <= stageIdx ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i < stageIdx ? 'bg-success-500 text-base-950'
                      : i === stageIdx ? 'bg-primary-500 text-white animate-pulse'
                      : 'bg-base-800 text-base-500'
                  }`}>
                    {i < stageIdx ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm ${i <= stageIdx ? 'text-base-200' : 'text-base-600'}`}>{label}</span>
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-3 bg-danger-900/20 border border-danger-500/30 rounded-xl p-4">
              <HiOutlineExclamationCircle className="w-5 h-5 text-danger-400 mt-0.5 shrink-0" />
              <p className="text-sm text-danger-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-lg shadow-xl shadow-primary-500/20 gap-2 disabled:opacity-60"
          >
            <HiOutlineLightningBolt className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'Processing...' : 'Trigger Disruption Simulation'}
          </button>
        </form>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card p-8 border-success-500/30 bg-success-900/10 space-y-6"
          >
            <div className="flex items-center gap-3">
              <HiOutlineCheckCircle className="w-8 h-8 text-success-400" />
              <div>
                <h3 className="text-xl font-bold text-base-100">Simulation Complete</h3>
                <p className="text-sm text-base-400">
                  {formData.event_type.replace(/_/g, ' ')} in {formData.zone} · {formData.severity} severity
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Workers Found',   value: result.summary?.workers_affected ?? 0, icon: HiOutlineUsers, color: 'text-primary-400' },
                { label: 'Claims Created',  value: result.processing?.total_workers_affected ?? 0, icon: HiOutlineLightningBolt, color: 'text-warning-400' },
                { label: 'Claims Approved', value: result.summary?.claims_approved ?? 0, icon: HiOutlineCheckCircle, color: 'text-success-400' },
                { label: 'Total Payout',    value: `₹${(result.summary?.total_payout ?? 0).toFixed(2)}`, icon: HiOutlineCurrencyRupee, color: 'text-success-400' },
              ].map((item, i) => (
                <div key={i} className="bg-base-950/60 rounded-2xl p-4 border border-base-800 text-center">
                  <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
                  <p className={`text-2xl font-extrabold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-base-500 font-bold uppercase tracking-wider mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            {(result.summary?.claims_flagged ?? 0) > 0 && (
              <div className="flex items-center gap-2 text-sm text-warning-400 bg-warning-900/20 border border-warning-500/20 rounded-xl px-4 py-3">
                <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
                {result.summary.claims_flagged} claim{result.summary.claims_flagged !== 1 ? 's were' : ' was'} flagged for fraud review.
              </div>
            )}

            {result.processing?.claims?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-3">Affected Workers</p>
                <div className="space-y-2">
                  {result.processing.claims.slice(0, 8).map((w, i) => (
                    <div key={i} className="flex items-center justify-between bg-base-950/40 rounded-xl px-4 py-2.5 border border-base-800">
                      <span className="text-sm font-medium text-base-200">{w.worker_name || `Worker ${i + 1}`}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-md font-bold ${
                          w.status === 'approved' ? 'bg-success-500/20 text-success-400'
                            : w.status === 'flagged' ? 'bg-warning-500/20 text-warning-400'
                            : w.status === 'rejected' ? 'bg-danger-500/20 text-danger-400'
                            : 'bg-base-800 text-base-400'
                        }`}>{w.status || 'processed'}</span>
                        {w.payout_amount > 0 && (
                          <span className="text-success-400 font-bold">₹{w.payout_amount.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
