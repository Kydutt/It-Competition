import React from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]'

  const variantClasses = {
    primary:
      'bg-[#F5C842] hover:bg-[#E8AD22] text-[#17243A] font-bold shadow-xs hover:shadow focus:ring-[#F5C842]',
    secondary:
      'bg-[#17243A] hover:bg-[#0D1726] text-[#FFFEFA] font-semibold shadow-xs hover:shadow focus:ring-[#17243A]',
    outline:
      'border border-[#E9E5DA] bg-[#FFFEFA] hover:bg-[#FFF4CE]/50 text-[#17243A] font-semibold focus:ring-[#F5C842]',
    ghost:
      'text-[#17243A] hover:bg-[#FAF9F5] hover:text-[#E8AD22] font-medium focus:ring-slate-300',
    danger:
      'bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs focus:ring-red-500',
  }

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-7 py-3.5 gap-2.5',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-1" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  )
}
