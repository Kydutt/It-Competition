import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-[#1C1410] text-[#C4B3A7] border-[rgba(255,179,107,0.16)]',
    primary: 'bg-[#FF6A00]/15 text-[#FFB36B] border-[#FF6A00]/30',
    fest: 'bg-[#FF6A00]/10 text-[#FFB36B] border-[rgba(255,179,107,0.25)]',
    cyber: 'bg-[#211811] text-[#FFF7F0] border-[rgba(255,179,107,0.3)] shadow-[0_0_10px_rgba(255,106,0,0.15)]',
    orange: 'bg-[#FF6A00] text-white border-[#FF7A1A]',
    success: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    warning: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    danger: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
    info: 'bg-sky-950/60 text-sky-400 border-sky-800/60',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
