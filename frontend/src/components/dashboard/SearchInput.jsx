import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchInput = ({
  value = '',
  onChange = () => {},
  placeholder = 'Cari data...',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="w-4 h-4 text-[#948277] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs sm:text-sm pl-10 pr-9 py-2.5 rounded-xl bg-[#211811] border border-[rgba(255,179,107,0.2)] text-[#FFF7F0] placeholder-[#948277] focus:outline-none focus:ring-1 focus:ring-[#FFC58A]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#948277] hover:text-[#FFF7F0]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
