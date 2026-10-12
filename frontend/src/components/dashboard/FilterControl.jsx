import React from 'react';

export const FilterControl = ({
  options = [], // [{ label: 'Semua', value: 'all' }, ...]
  value = 'all',
  onChange = () => {},
  label = '',
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-[#211811] p-1.5 rounded-2xl border border-[rgba(255,179,107,0.18)]">
      {label && (
        <span className="text-[11px] font-mono text-[#948277] uppercase px-2">
          {label}:
        </span>
      )}
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              isSelected
                ? 'bg-[#FF6A00] text-white shadow-orange-glow'
                : 'text-[#C4B3A7] hover:text-[#FFF7F0] hover:bg-white/5'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default FilterControl;
