import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiInbox } from 'react-icons/hi';

const EmptyState = ({ icon: Icon = HiInbox, title, message, ctaText, ctaLink, onCtaClick }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center card border-dashed border-2 border-base-700 bg-base-900/50"
    >
      <div className="w-24 h-24 bg-base-950 rounded-3xl flex items-center justify-center mb-6 border border-base-800 shadow-inner">
        <Icon className="w-12 h-12 text-base-500" />
      </div>
      <h3 className="text-2xl font-bold font-sans text-base-100 mb-3">{title}</h3>
      {message && <p className="text-base text-base-400 max-w-md mb-8 leading-relaxed">{message}</p>}
      
      {ctaText && ctaLink && (
        <Link to={ctaLink} className="btn-primary shadow-lg shadow-primary-500/20">
          {ctaText}
        </Link>
      )}
      {ctaText && onCtaClick && (
        <button onClick={onCtaClick} className="btn-primary shadow-lg shadow-primary-500/20">
          {ctaText}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
