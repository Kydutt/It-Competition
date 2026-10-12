import React from 'react';

export const StatCard = ({
  title = '',
  value = '0',
  description = '',
  icon: Icon = null,
  trend = null, // e.g. "+12% dari target"
  variant = 'default', // 'default' | 'orange' | 'amber' | 'emerald'
}) => {
  const borderStyles = {
    default: 'border-[rgba(255,179,107,0.18)] hover:border-[#FF7A1A]',
    orange: 'border-[#FF6A00]/40 shadow-orange-glow',
    amber: 'border-[#FFB36B]/40',
    emerald: 'border-emerald-600/30',
  }[variant] || 'border-[rgba(255,179,107,0.18)]';

  const iconBgStyles = {
    default: 'bg-[#211811] text-[#FFB36B]',
    orange: 'bg-[#FF6A00] text-white shadow-orange-glow',
    amber: 'bg-[#FFB36B]/20 text-[#FFB36B]',
    emerald: 'bg-emerald-950/60 text-emerald-400',
  }[variant] || 'bg-[#211811] text-[#FFB36B]';

  return (
    <div className={`bg-[#1C1410] rounded-3xl border ${borderStyles} p-6 transition-all duration-300 hover:-translate-y-0.5 space-y-3 relative overflow-hidden group`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-[#948277]">
          {title}
        </span>
        {Icon && (
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${iconBgStyles}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div>
        <p className="text-3xl sm:text-4xl font-black font-display text-[#FFF7F0] tracking-tight">
          {value}
        </p>
        {description && (
          <p className="text-xs text-[#C4B3A7] mt-1 font-sans">
            {description}
          </p>
        )}
      </div>

      {trend && (
        <div className="pt-2 border-t border-[rgba(255,179,107,0.08)] text-[11px] font-mono text-[#FFB36B]">
          {trend}
        </div>
      )}
    </div>
  );
};

export default StatCard;
