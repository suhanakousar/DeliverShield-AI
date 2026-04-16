import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';
import { HiLightningBolt, HiX, HiCurrencyRupee, HiCheckCircle } from 'react-icons/hi';

const PayoutPopup = ({ amount, disruptionType, onClose }) => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);

    // Stop confetti after 5s
    const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);

    // Auto-close after 8s
    const closeTimer = setTimeout(() => {
      onClose();
    }, 8000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(confettiTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  const typeLabel = {
    heavy_rain: 'Heavy Rain',
    extreme_heat: 'Extreme Heat',
    flood: 'Flood Alert',
    curfew: 'Curfew',
  }[disruptionType] || 'Disruption';

  return (
    <>
      {showConfetti && (
        <div className="fixed inset-0 z-[60] pointer-events-none">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            numberOfPieces={250}
            recycle={false}
            colors={['#F59E0B', '#10B981', '#FCD34D', '#059669', '#FDE68A']}
            gravity={0.2}
          />
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
          className="relative w-full max-w-sm bg-base-900 border border-success-500/30 rounded-3xl p-8 shadow-2xl shadow-success-500/10 overflow-hidden"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-success-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-base-800 hover:bg-base-700 text-base-400 hover:text-base-100 transition-colors z-10"
          >
            <HiX className="w-4 h-4" />
          </button>

          <div className="relative z-10">
            {/* Icon */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-success-500/30 rounded-full blur-xl scale-150 animate-pulse-slow" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-success-400 to-success-600 rounded-2xl flex items-center justify-center shadow-lg shadow-success-500/40 transform rotate-3">
                  <HiLightningBolt className="w-10 h-10 text-base-950" />
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="text-center mb-8">
              <p className="text-success-400 text-xs font-bold mb-2 tracking-widest uppercase">Automatic Payout</p>
              <h2 className="text-5xl font-extrabold font-sans tracking-tighter text-base-100 mb-2 flex items-center justify-center">
                ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h2>
              <p className="text-base-400 font-medium">credited to your wallet</p>
            </div>

            {/* Event Details */}
            <div className="bg-base-950/50 border border-base-800 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                  <HiCheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-base-500 uppercase tracking-wider mb-0.5">Triggered by</p>
                  <p className="text-sm font-bold text-base-100">{typeLabel} detected</p>
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full py-4 bg-success-500 hover:bg-success-400 text-base-950 font-bold rounded-xl transition-colors shadow-lg shadow-success-500/20"
            >
              Done
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default PayoutPopup;
