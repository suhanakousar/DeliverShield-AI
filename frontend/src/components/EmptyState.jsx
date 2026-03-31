import React from 'react';
import { Link } from 'react-router-dom';
import { HiInbox } from 'react-icons/hi';

const EmptyState = ({ icon: Icon = HiInbox, title, message, ctaText, ctaLink, onCtaClick }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
        <Icon className="w-10 h-10 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
      {message && <p className="text-sm text-slate-500 max-w-sm mb-6">{message}</p>}
      {ctaText && ctaLink && (
        <Link to={ctaLink} className="btn-primary">
          {ctaText}
        </Link>
      )}
      {ctaText && onCtaClick && (
        <button onClick={onCtaClick} className="btn-primary">
          {ctaText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
