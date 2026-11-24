import React from 'react'

export const HowItWorksIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full max-w-sm mx-auto ${className}`}>
      {/* Organic Soft Yellow / Navy Blob */}
      <div className="absolute inset-0 bg-[#FFF4CE] rounded-[45%_55%_65%_35%/55%_45%_55%_45%] transform rotate-6 scale-110 opacity-95 pointer-events-none" />

      {/* Subtle Orbital Ring */}
      <div className="absolute -top-3 -left-3 w-24 h-24 rounded-full border border-[#F5C842]/50 pointer-events-none" />

      <svg
        viewBox="0 0 380 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-auto drop-shadow-sm select-none"
      >
        <defs>
          <linearGradient id="hwYellow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5C842" />
            <stop offset="100%" stopColor="#E8AD22" />
          </linearGradient>
          <filter id="hwShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#17243A" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* 1. Base Stack of Innovation Books & Blocks */}
        <g filter="url(#hwShadow)">
          {/* Base Platform */}
          <rect x="70" y="370" width="240" height="28" rx="8" fill="#17243A" />
          <rect x="75" y="374" width="230" height="5" rx="2.5" fill="#F5C842" />

          {/* Book 2 */}
          <rect x="90" y="336" width="200" height="26" rx="7" fill="url(#hwYellow)" />
          <line x1="110" y1="349" x2="220" y2="349" stroke="#17243A" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 3" />

          {/* Book 3 */}
          <rect x="105" y="304" width="170" height="24" rx="6" fill="#FFFEFA" stroke="#E9E5DA" strokeWidth="2" />
          <circle cx="125" cy="316" r="4" fill="#17243A" />
          <circle cx="140" cy="316" r="4" fill="#F5C842" />

          {/* Book 4 Top */}
          <rect x="120" y="274" width="140" height="22" rx="6" fill="#17243A" />
        </g>

        {/* 2. Innovator / Explorer Character Standing on Top */}
        <g filter="url(#hwShadow)">
          {/* Legs */}
          <path d="M165 272 L165 210" stroke="#17243A" strokeWidth="10" strokeLinecap="round" />
          <path d="M195 272 L200 210" stroke="#17243A" strokeWidth="10" strokeLinecap="round" />
          {/* Shoes */}
          <path d="M152 276 L175 276" stroke="#E8AD22" strokeWidth="6" strokeLinecap="round" />
          <path d="M190 276 L212 276" stroke="#E8AD22" strokeWidth="6" strokeLinecap="round" />

          {/* Body/Shirt in Modern Teal/Navy */}
          <path d="M155 212 Q180 155 205 212 Z" fill="#38BDF8" />
          <rect x="160" y="190" width="40" height="24" rx="6" fill="#17243A" />

          {/* Head & Hair */}
          <circle cx="180" cy="145" r="16" fill="#FED7AA" />
          <path d="M166 142 Q180 120 196 136 Q190 150 170 150 Z" fill="#17243A" />

          {/* Arms Holding Telescope */}
          <path d="M175 178 L200 160 L240 150" stroke="#FED7AA" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M165 178 L190 165 L220 155" stroke="#17243A" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

          {/* The Golden Telescope Looking Into the Future */}
          <g transform="translate(190, 142) rotate(-12)">
            {/* Eyepiece */}
            <rect x="0" y="8" width="16" height="10" rx="3" fill="#17243A" />
            {/* Mid tube */}
            <rect x="16" y="6" width="34" height="14" rx="4" fill="#E8AD22" />
            {/* Front golden lens tube */}
            <rect x="50" y="4" width="48" height="18" rx="5" fill="#F5C842" />
            {/* Lens flare ring */}
            <circle cx="98" cy="13" r="5" fill="#38BDF8" opacity="0.8" />
            {/* Light beam radiating from telescope */}
            <path d="M102 13 L150 -5 L150 31 Z" fill="#F5C842" opacity="0.25" />
          </g>
        </g>

        {/* 3. Floating Vision Elements */}
        {/* Distant Flag / Trophy Star */}
        <g transform="translate(290, 95)" filter="url(#hwShadow)">
          <circle cx="15" cy="15" r="14" fill="#F5C842" />
          <path d="M15 8 L17 12 L22 13 L18 16 L19 21 L15 18 L11 21 L12 16 L8 13 L13 12 Z" fill="#17243A" />
        </g>

        {/* Playful Floating Squiggles & Crosses */}
        <path d="M60 210 Q72 198 84 210 T108 210" stroke="#F5C842" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M260 280 Q272 268 284 280 T308 280" stroke="#17243A" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4" />

        <g stroke="#17243A" strokeWidth="2.5" strokeLinecap="round" opacity="0.4">
          <line x1="75" y1="120" x2="75" y2="132" />
          <line x1="69" y1="126" x2="81" y2="126" />

          <line x1="310" y1="210" x2="310" y2="222" />
          <line x1="304" y1="216" x2="316" y2="216" />
        </g>
      </svg>
    </div>
  )
}
