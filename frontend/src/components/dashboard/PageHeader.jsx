import React from 'react';

export const PageHeader = ({
  badge = '',
  title = '',
  description = '',
  actions = null,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[rgba(255,179,107,0.14)] mb-8">
      <div className="space-y-1.5">
        {badge && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#211811] border border-[rgba(255,179,107,0.2)] text-[11px] font-mono font-bold text-[#FFB36B] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] animate-pulse"></span>
            <span>{badge}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[#FFF7F0]">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-[#C4B3A7] max-w-2xl font-sans">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
