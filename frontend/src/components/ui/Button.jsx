import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fest-focus focus:ring-offset-2 focus:ring-offset-fest-bg disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-[#FF6A00] hover:bg-[#FF7A1A] text-white shadow-md hover:shadow-orange-glow active:scale-[0.98] border border-[#FF7A1A]/40',
    glow: 'bg-gradient-to-r from-[#FF6A00] via-[#FF7A1A] to-[#FFB36B] hover:brightness-110 text-white font-bold shadow-orange-glow hover:shadow-orange-glow-lg active:scale-[0.98] border border-white/20',
    secondary: 'bg-[#1C1410] hover:bg-[#2A1B14] text-[#FFF7F0] border border-[rgba(255,179,107,0.22)] hover:border-[#FF7A1A] hover:shadow-amber-subtle active:scale-[0.98]',
    outline: 'border border-[#FF6A00] text-[#FFB36B] hover:bg-[#FF6A00]/10 hover:text-white active:scale-[0.98]',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500',
    ghost: 'text-[#C4B3A7] hover:text-[#FFF7F0] hover:bg-white/5 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
