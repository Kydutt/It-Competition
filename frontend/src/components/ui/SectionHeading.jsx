import React from 'react';

export const SectionHeading = ({
  badge = '',
  title = '',
  highlight = '',
  description = '',
  align = 'center', // 'center' | 'left'
  className = '',
}) => {
  const isCenter = align === 'center';

  return (
    <div className={`space-y-4 ${isCenter ? 'text-center max-w-3xl mx-auto' : 'max-w-2xl'} ${className}`}>
      {badge && (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] text-xs font-bold font-mono tracking-wider text-[#FFB36B] uppercase ${isCenter ? 'mx-auto' : ''}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] animate-pulse"></span>
          <span>{badge}</span>
        </div>
      )}

      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-[#FFF7F0] leading-tight">
        {title}{' '}
        {highlight && (
          <span className="text-gradient-orange">
            {highlight}
          </span>
        )}
      </h2>

      {description && (
        <p className="text-base sm:text-lg text-[#C4B3A7] leading-relaxed font-sans">
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
