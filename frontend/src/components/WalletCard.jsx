import React, { useEffect, useState } from 'react';
import { HiCurrencyRupee, HiTrendingUp, HiArrowUp } from 'react-icons/hi';

const useCountUp = (target, duration = 1200) => {
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

const WalletCard = ({ balance = 0, totalPayouts = 0, recentAmount = null }) => {
  const animatedBalance = useCountUp(balance);
  const animatedPayouts = useCountUp(totalPayouts);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    if (recentAmount && recentAmount > 0) {
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 3000);
      return () => clearTimeout(t);
    }
  }, [recentAmount]);

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-700 ${
      highlight
        ? 'bg-gradient-to-br from-emerald-900/60 via-slate-800 to-slate-800 border border-emerald-500/60 shadow-lg shadow-emerald-500/20'
        : 'bg-gradient-to-br from-slate-800 via-slate-800 to-primary-900/20 border border-slate-700/50'
    }`}>
      {/* Background glow */}
      <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl transition-all duration-700 ${
        highlight ? 'bg-emerald-500/20' : 'bg-primary-500/10'
      }`} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-700 ${
              highlight ? 'bg-emerald-500/20' : 'bg-primary-500/15'
            }`}>
              <HiCurrencyRupee className={`w-5 h-5 transition-colors duration-700 ${highlight ? 'text-emerald-400' : 'text-primary-400'}`} />
            </div>
            <span className="font-semibold text-slate-300 text-sm">Wallet Balance</span>
          </div>
          {highlight && recentAmount > 0 && (
            <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              <HiArrowUp className="w-3 h-3" />
              +₹{recentAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>

        {/* Balance */}
        <div className="mb-5">
          <p className={`text-4xl font-extrabold transition-colors duration-700 ${highlight ? 'text-emerald-400' : 'text-white'}`}>
            ₹{animatedBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Available for withdrawal</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <HiTrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-slate-400">Total Received</span>
            </div>
            <p className="font-bold text-white text-sm">
              ₹{animatedPayouts.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-slate-700/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-slate-400">Payout Method</span>
            </div>
            <p className="font-bold text-white text-sm flex items-center gap-1">
              <span className="w-4 h-4 bg-orange-500 rounded-sm text-white text-[9px] font-black flex items-center justify-center">U</span>
              UPI / Wallet
            </p>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-xs text-slate-500 mt-3 text-center">
          Payouts credited automatically within 60 seconds
        </p>
      </div>
    </div>
  );
};

export default WalletCard;
