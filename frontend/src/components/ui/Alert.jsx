import React from 'react';

export const Alert = ({ children, variant = 'info', title, className = '' }) => {
  const variants = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`p-4 rounded-xl border text-sm ${variants[variant] || variants.info} ${className}`}>
      {title && <h4 className="font-semibold mb-1">{title}</h4>}
      <div>{children}</div>
    </div>
  );
};

export default Alert;
