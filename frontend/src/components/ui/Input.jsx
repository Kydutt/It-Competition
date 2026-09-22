import React from 'react';

export const Input = ({
  label,
  error,
  helperText,
  id,
  type = 'text',
  className = '',
  required = false,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        required={required}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          error
            ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500/20 bg-red-50/30'
            : 'border-gray-300 text-gray-900 focus:border-brand-500 focus:ring-brand-500/20 bg-white'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};

export default Input;
