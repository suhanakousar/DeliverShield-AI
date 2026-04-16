import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { HiLightningBolt, HiX, HiCurrencyRupee } from 'react-icons/hi';

const PayoutPopup = ({ amount, disruptionType, onClose }) => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showConfetti, setShowConfetti] = useState(true);
  const [animClass, setAnimClass] = useState('scale-0 opacity-0');

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      setTimeout(() => setAnimClass('scale-100 opacity-100'), 50);
    });

    // Stop confetti after 5s
    const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);

    // Auto-close after 8s
    const closeTimer = setTimeout(() => {
      setAnimClass('scale-95 opacity-0');
      setTimeout(onClose, 300);
    }, 8000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(confettiTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  const typeLabel = {
    heavy_rain: '🌧️ Heavy Rain',
    extreme_heat: '🌡️ Extreme Heat',
    flood: '🌊 Flood Alert',
    curfew: '🚫 Curfew',
  }[disruptionType] || '⚡ Disruption';

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={200}
          recycle={false}
          colors={['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']}
          gravity={0.3}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div
          className={`relative w-full max-w-sm bg-gradient-to-br from-slate-800 via-slate-800 to-emerald-900/40 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl shadow-emerald-500/20 transition-all duration-500 ${animClass}`}
          style={{ transform: animClass.includes('scale-100') ? 'scale(1)' : 'scale(0.8)' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <HiX className="w-4 h-4" />
          </button>

          {/* Lightning icon with glow */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl scale-150 animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <HiLightningBolt className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-6">
            <p className="text-emerald-400 text-sm font-semibold mb-1 tracking-wide uppercase">Automatic Payout</p>
            <h2 className="text-4xl font-extrabold text-white mb-1 flex items-center justify-center gap-1">
              <HiCurrencyRupee className="w-8 h-8 text-emerald-400" />
              {amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h2>
            <p className="text-slate-300 font-medium">credited to your wallet</p>
          </div>

          {/* Event type */}
          <div className="bg-slate-700/40 rounded-xl p-3 text-center mb-6">
            <p className="text-xs text-slate-400 mb-1">Triggered by</p>
            <p className="text-white font-semibold">{typeLabel} detected in your zone</p>
          </div>

          {/* Wallet credited indicator */}
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <HiCurrencyRupee className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 font-semibold text-sm">Wallet Updated</p>
              <p className="text-slate-400 text-xs">Balance credited instantly via UPI</p>
            </div>
            <div className="ml-auto">
              <span className="text-emerald-400 font-bold">✓</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-5 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 active:scale-95"
          >
            Awesome! 🎉
          </button>
        </div>
      </div>
    </>
  );
};

export default PayoutPopup;
