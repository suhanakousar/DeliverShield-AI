import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiCurrencyRupee, HiExternalLink, HiX, HiCheckCircle,
  HiExclamationCircle, HiArrowRight, HiClipboardCopy,
} from 'react-icons/hi';
import { withdrawToUPI } from '../services/api';

const useCountUp = (target, duration = 1500) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target <= 0) { setCount(0); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
};

const STAGES = [
  { id: 'init',     label: 'Initiating transfer',       ms: 900  },
  { id: 'verify',   label: 'Verifying UPI address',      ms: 1200 },
  { id: 'transfer', label: 'Initiating fund transfer',   ms: 1400 },
  { id: 'credit',   label: 'Crediting to your account',  ms: 1000 },
];

const UPI_APPS = [
  { handle: '@paytm',      logo: '🔵', name: 'Paytm'     },
  { handle: '@ybl',        logo: '🟣', name: 'PhonePe'   },
  { handle: '@ibl',        logo: '🟣', name: 'PhonePe'   },
  { handle: '@axl',        logo: '🟣', name: 'PhonePe'   },
  { handle: '@okhdfcbank', logo: '🔵', name: 'GPay'      },
  { handle: '@okaxis',     logo: '🔵', name: 'GPay'      },
  { handle: '@oksbi',      logo: '🔵', name: 'GPay'      },
  { handle: '@okicici',    logo: '🔵', name: 'GPay'      },
  { handle: '@apl',        logo: '🟠', name: 'Amazon Pay'},
  { handle: '@upi',        logo: '🟢', name: 'BHIM'      },
];

function detectApp(upiId = '') {
  const lower = upiId.toLowerCase();
  for (const a of UPI_APPS) {
    if (lower.endsWith(a.handle)) return a;
  }
  return null;
}

function formatINR(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Row({ label, value, highlight, mono }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-base-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-success-400' : mono ? 'font-mono text-base-300 text-xs' : 'text-base-200'}`}>
        {value}
      </span>
    </div>
  );
}

export default function WalletCard({ workerId, balance = 0, totalPayouts = 0, recentAmount = null, onWithdrawSuccess }) {
  const animatedBalance = useCountUp(balance);
  const animatedPayouts = useCountUp(totalPayouts);
  const [highlight, setHighlight] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [amountErr, setAmountErr] = useState('');
  const [upiErr, setUpiErr] = useState('');
  const [stage, setStage] = useState(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [apiErr, setApiErr] = useState('');
  const [copied, setCopied] = useState(false);
  const upiRef = useRef();

  useEffect(() => {
    if (recentAmount && recentAmount > 0) {
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 3000);
      return () => clearTimeout(t);
    }
  }, [recentAmount]);

  const openModal = () => {
    setShowModal(true);
    setStage(null);
    setUpiId('');
    setAmount(balance > 0 ? String(balance) : '');
    setAmountErr('');
    setUpiErr('');
    setApiErr('');
    setResult(null);
    setTimeout(() => upiRef.current?.focus(), 150);
  };

  const closeModal = () => {
    if (stage === 'processing') return;
    setShowModal(false);
  };

  const validateUpi = (v) => /^[\w.\-]+@[\w]+$/.test(v.trim());

  const handleAmountChange = (v) => {
    setAmount(v);
    const n = parseFloat(v);
    if (!v) { setAmountErr(''); return; }
    if (isNaN(n) || n <= 0) { setAmountErr('Enter a valid amount'); return; }
    if (n < 10) { setAmountErr('Minimum withdrawal is ₹10'); return; }
    if (n > balance) { setAmountErr(`Max available: ₹${formatINR(balance)}`); return; }
    setAmountErr('');
  };

  const quickAmounts = [100, 250, 500].filter(q => q <= balance);

  const runStages = async () => {
    setStage('processing');
    setStageIdx(0);
    for (let i = 0; i < STAGES.length; i++) {
      setStageIdx(i);
      await new Promise(r => setTimeout(r, STAGES[i].ms));
    }
  };

  const handleWithdraw = async () => {
    let valid = true;
    if (!validateUpi(upiId)) {
      setUpiErr('Invalid UPI ID. Try 9876543210@paytm');
      valid = false;
    } else {
      setUpiErr('');
    }
    const n = parseFloat(amount);
    if (!amount || isNaN(n) || n <= 0) {
      setAmountErr('Enter a valid amount');
      valid = false;
    } else if (n < 10) {
      setAmountErr('Minimum withdrawal is ₹10');
      valid = false;
    } else if (n > balance) {
      setAmountErr(`Max available: ₹${formatINR(balance)}`);
      valid = false;
    } else {
      setAmountErr('');
    }
    if (!valid) return;

    setApiErr('');
    const stagesPromise = runStages();
    try {
      const [data] = await Promise.all([
        withdrawToUPI(workerId, upiId.trim(), parseFloat(amount)),
        stagesPromise,
      ]);
      setResult(data);
      setStage('success');
      if (onWithdrawSuccess) onWithdrawSuccess(data.balance_after);
    } catch (err) {
      await stagesPromise.catch(() => {});
      const msg = err?.response?.data?.detail || 'Withdrawal failed. Please try again.';
      setApiErr(msg);
      setStage('error');
    }
  };

  const copyUTR = () => {
    navigator.clipboard.writeText(result?.utr_number || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const app = detectApp(upiId);

  return (
    <>
      <motion.div
        variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
        className={`relative overflow-hidden rounded-3xl p-8 border transition-all duration-700 h-full flex flex-col justify-between ${
          highlight
            ? 'bg-success-900/40 border-success-500/50 shadow-2xl shadow-success-500/20'
            : 'bg-gradient-to-br from-base-900 to-base-800 border-base-700 shadow-xl'
        }`}
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-success-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                <HiCurrencyRupee className="w-6 h-6" />
              </div>
              <span className="font-bold text-base-300 uppercase tracking-wider text-sm">Wallet Balance</span>
            </div>

            <AnimatePresence>
              {highlight && recentAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 bg-success-500 text-base-950 font-bold px-3 py-1 rounded-full shadow-lg shadow-success-500/30"
                >
                  <HiExternalLink className="w-4 h-4" />
                  <span>+₹{recentAmount.toLocaleString('en-IN')}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mb-6">
            <motion.p className={`text-5xl md:text-6xl font-extrabold font-sans tracking-tighter ${highlight ? 'text-success-400' : 'text-base-100'}`}>
              ₹{animatedBalance.toLocaleString('en-IN')}
            </motion.p>
            <p className="text-sm font-medium text-base-500 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success-500 inline-block animate-pulse" />
              Available for instant withdrawal
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-base-950/50 rounded-2xl p-4 border border-base-800">
              <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-1">Total Protected</p>
              <p className="text-lg font-bold text-base-100">₹{animatedPayouts.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-base-950/50 rounded-2xl p-4 border border-base-800">
              <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-1">Payout Method</p>
              <p className="text-lg font-bold text-base-100">Direct UPI</p>
            </div>
          </div>

          <button
            onClick={openModal}
            disabled={balance <= 0}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
              balance > 0
                ? 'bg-success-500 hover:bg-success-400 text-base-950 shadow-lg shadow-success-500/30 active:scale-95'
                : 'bg-base-800 text-base-500 cursor-not-allowed'
            }`}
          >
            <HiCurrencyRupee className="w-5 h-5" />
            {balance > 0 ? `Withdraw ₹${formatINR(balance)} to UPI` : 'No balance to withdraw'}
          </button>
        </div>
      </motion.div>

      {/* ── Withdrawal Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-950/80 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-md bg-base-900 border border-base-700 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-base-800">
                <div>
                  <h2 className="text-xl font-extrabold text-base-100 tracking-tight">Withdraw to UPI</h2>
                  <p className="text-xs text-base-500 mt-0.5">Instant transfer · Powered by NPCI</p>
                </div>
                {stage !== 'processing' && (
                  <button onClick={closeModal} className="text-base-500 hover:text-base-300 transition-colors">
                    <HiX className="w-6 h-6" />
                  </button>
                )}
              </div>

              <div className="p-6 space-y-5">

                {/* ── Input State ── */}
                {(stage === null || stage === 'error') && (
                  <>
                    <div className="flex items-center justify-between bg-base-950/60 rounded-2xl px-4 py-3 border border-base-800">
                      <span className="text-xs font-bold text-base-500 uppercase tracking-wider">Available Balance</span>
                      <span className="text-lg font-extrabold text-success-400">₹{formatINR(balance)}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-base-400 uppercase tracking-wider mb-2">UPI ID</label>
                      <div className="relative">
                        <input
                          ref={upiRef}
                          type="text"
                          value={upiId}
                          onChange={e => { setUpiId(e.target.value); setUpiErr(''); }}
                          placeholder="9876543210@paytm"
                          className={`w-full bg-base-950 border rounded-xl px-4 py-3 text-base-100 placeholder-base-600 text-sm focus:outline-none focus:ring-2 pr-10 ${
                            upiErr ? 'border-danger-500 focus:ring-danger-500/30' : 'border-base-700 focus:ring-primary-500/30 focus:border-primary-500'
                          }`}
                        />
                        {app && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">{app.logo}</span>
                        )}
                      </div>
                      {upiErr && <p className="text-xs text-danger-400 mt-1.5">{upiErr}</p>}
                      <p className="text-xs text-base-600 mt-1.5">Supports Paytm, PhonePe, Google Pay, BHIM, Amazon Pay</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-base-400 uppercase tracking-wider mb-2">Amount (₹)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={e => handleAmountChange(e.target.value)}
                        placeholder="Enter amount"
                        min="10"
                        max={balance}
                        className={`w-full bg-base-950 border rounded-xl px-4 py-3 text-base-100 placeholder-base-600 text-sm focus:outline-none focus:ring-2 ${
                          amountErr ? 'border-danger-500 focus:ring-danger-500/30' : 'border-base-700 focus:ring-primary-500/30 focus:border-primary-500'
                        }`}
                      />
                      {amountErr && <p className="text-xs text-danger-400 mt-1.5">{amountErr}</p>}
                      {quickAmounts.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {quickAmounts.map(q => (
                            <button key={q} onClick={() => handleAmountChange(String(q))}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-base-800 hover:bg-primary-500/20 hover:text-primary-300 text-base-400 border border-base-700 transition-colors">
                              ₹{q}
                            </button>
                          ))}
                          <button onClick={() => handleAmountChange(String(balance))}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-base-800 hover:bg-success-500/20 hover:text-success-300 text-base-400 border border-base-700 transition-colors">
                            All (₹{formatINR(balance)})
                          </button>
                        </div>
                      )}
                    </div>

                    {apiErr && (
                      <div className="flex items-start gap-2 bg-danger-900/20 border border-danger-500/30 rounded-xl p-3">
                        <HiExclamationCircle className="w-4 h-4 text-danger-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-danger-300">{apiErr}</p>
                      </div>
                    )}

                    <p className="text-xs text-base-600 text-center">
                      No withdrawal fees · Funds credited in 2–4 minutes via NPCI
                    </p>

                    <button
                      onClick={handleWithdraw}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-success-500 hover:bg-success-400 text-base-950 font-bold text-sm transition-all active:scale-95 shadow-lg shadow-success-500/20"
                    >
                      Withdraw Now <HiArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* ── Processing State ── */}
                {stage === 'processing' && (
                  <div className="py-4 space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/10 border border-primary-500/30 flex items-center justify-center">
                        <svg className="w-8 h-8 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      </div>
                      <p className="font-bold text-base-100 text-lg">Processing withdrawal</p>
                      <p className="text-sm text-base-500 mt-1">
                        ₹{formatINR(parseFloat(amount))} → {upiId}
                        {app && <span className="ml-2">{app.logo}</span>}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {STAGES.map((s, i) => (
                        <div key={s.id} className={`flex items-center gap-3 transition-all duration-300 ${i <= stageIdx ? 'opacity-100' : 'opacity-30'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all duration-300 ${
                            i < stageIdx
                              ? 'bg-success-500 text-base-950'
                              : i === stageIdx
                              ? 'bg-primary-500 text-white animate-pulse'
                              : 'bg-base-800 text-base-500'
                          }`}>
                            {i < stageIdx ? '✓' : i + 1}
                          </div>
                          <span className={`text-sm font-medium ${i <= stageIdx ? 'text-base-200' : 'text-base-600'}`}>{s.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-base-950/60 rounded-xl p-3 border border-base-800">
                      <p className="text-xs text-base-500 text-center">
                        Routed via <span className="text-primary-400 font-bold">NPCI UPI Rails</span> · Encrypted & secure
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Success State ── */}
                {stage === 'success' && result && (
                  <div className="py-4 space-y-5">
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        className="w-20 h-20 mx-auto mb-4 rounded-full bg-success-500/20 border-2 border-success-500/50 flex items-center justify-center"
                      >
                        <HiCheckCircle className="w-10 h-10 text-success-400" />
                      </motion.div>
                      <h3 className="text-2xl font-extrabold text-success-400">₹{formatINR(result.amount)}</h3>
                      <p className="text-base-300 font-medium mt-1">Transfer Successful</p>
                    </div>

                    <div className="bg-base-950/70 rounded-2xl border border-base-800 overflow-hidden">
                      <div className="px-4 py-2 bg-base-800/50 border-b border-base-800">
                        <p className="text-xs font-bold text-base-400 uppercase tracking-wider">Payment Receipt</p>
                      </div>
                      <div className="p-4 space-y-3">
                        <Row label="Amount Sent"  value={`₹${formatINR(result.amount)}`} highlight />
                        <Row label="To UPI ID"    value={result.upi_id} />
                        <Row label="Via"          value={result.bank_name} />
                        <Row label="Ref ID"       value={result.reference_id} mono />
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-base-500 uppercase tracking-wider">UTR Number</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-primary-300">{result.utr_number}</span>
                            <button onClick={copyUTR} className="text-base-500 hover:text-primary-400 transition-colors">
                              {copied
                                ? <HiCheckCircle className="w-4 h-4 text-success-400" />
                                : <HiClipboardCopy className="w-4 h-4" />
                              }
                            </button>
                          </div>
                        </div>
                        <Row label="New Balance"  value={`₹${formatINR(result.balance_after)}`} />
                      </div>
                    </div>

                    <p className="text-xs text-base-500 text-center">{result.settlement_note}</p>

                    <button
                      onClick={() => setShowModal(false)}
                      className="w-full py-3 rounded-2xl bg-base-800 hover:bg-base-700 text-base-200 font-bold text-sm transition-all"
                    >
                      Done
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
