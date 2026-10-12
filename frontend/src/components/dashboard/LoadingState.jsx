import React from 'react';

export const LoadingState = ({ message = 'Memuat data sistem...' }) => {
  return (
    <div className="py-20 flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-[#FF6A00]/20 border-t-[#FF6A00] rounded-full animate-spin"></div>
      <p className="font-mono text-xs text-[#FFB36B] tracking-wider uppercase">
        {message}
      </p>
    </div>
  );
};

export default LoadingState;
