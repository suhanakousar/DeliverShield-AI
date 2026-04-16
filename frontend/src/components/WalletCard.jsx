import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCurrencyRupee, HiExternalLink } from 'react-icons/hi';

const useCountUp = (target, duration = 1500) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target <= 0) { setCount(0); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease out
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
    <motion.div 
      variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
      className={`relative overflow-hidden rounded-3xl p-8 border transition-all duration-700 h-full flex flex-col justify-between ${
        highlight 
          ? 'bg-success-900/40 border-success-500/50 shadow-2xl shadow-success-500/20' 
          : 'bg-gradient-to-br from-base-900 to-base-800 border-base-700 shadow-xl'
      }`}
    >
      {/* Background decorations */}
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

        <div className="mb-10">
          <motion.p 
            className={`text-5xl md:text-6xl font-extrabold font-sans tracking-tighter ${highlight ? 'text-success-400' : 'text-base-100'}`}
          >
            ₹{animatedBalance.toLocaleString('en-IN')}
          </motion.p>
          <p className="text-sm font-medium text-base-500 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success-500 inline-block animate-pulse"></span>
            Available for instant withdrawal
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="bg-base-950/50 rounded-2xl p-4 border border-base-800">
            <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-1">Total Protected</p>
            <p className="text-lg font-bold text-base-100">₹{animatedPayouts.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-base-950/50 rounded-2xl p-4 border border-base-800">
            <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-1">Payout Method</p>
            <p className="text-lg font-bold text-base-100">Direct UPI</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WalletCard;
