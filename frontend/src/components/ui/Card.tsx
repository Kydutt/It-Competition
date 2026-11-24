import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-[#FFFEFA] rounded-2xl border border-[#E9E5DA] shadow-xs ${
        hoverable ? 'transition-all duration-300 hover:shadow-lg hover:border-[#F5C842]/60 hover:-translate-y-1' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
