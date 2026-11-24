import React from 'react'

export const HeroIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full max-w-lg mx-auto ${className}`}>
      {/* Background Soft Blob */}
      <div className="absolute inset-0 bg-[#FFF4CE] rounded-[60%_40%_70%_30%/50%_60%_40%_50%] transform -rotate-3 scale-105 opacity-90 blur-[1px] pointer-events-none transition-transform duration-700 hover:rotate-2" />

      {/* Decorative Subtle Orbit Rings */}
      <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full border-2 border-dashed border-[#F5C842]/40 pointer-events-none animate-spin-slow" />
      <div className="absolute -bottom-6 -left-6 w-36 h-36 rounded-full border border-[#E8AD22]/30 pointer-events-none" />

      {/* Main Vector SVG */}
      <svg
        viewBox="0 0 540 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-auto drop-shadow-md select-none"
      >
        <defs>
          <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5C842" />
            <stop offset="100%" stopColor="#E8AD22" />
          </linearGradient>
          <linearGradient id="navyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#17243A" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="lightBookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFEFA" />
            <stop offset="100%" stopColor="#FAF9F5" />
          </linearGradient>
          <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#17243A" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* 1. Base Tech/Book Stack (Layered Foundation) */}
        {/* Layer 1 - Bottom Massive Knowledge Block */}
        <g filter="url(#softShadow)">
          {/* Base shadow */}
          <path d="M70 420 L470 420 L440 450 L100 450 Z" fill="#E9E5DA" opacity="0.6" />
          {/* Main bottom block */}
          <rect x="80" y="380" width="380" height="42" rx="10" fill="#17243A" />
          <rect x="85" y="385" width="370" height="8" rx="4" fill="#F5C842" opacity="0.8" />
          {/* Spine accents */}
          <line x1="120" y1="398" x2="220" y2="398" stroke="#FFFEFA" strokeWidth="3" strokeLinecap="round" />
          <line x1="240" y1="398" x2="300" y2="398" stroke="#F5C842" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Layer 2 - Middle Technology Architecture Block */}
        <g filter="url(#softShadow)">
          <rect x="110" y="335" width="330" height="38" rx="9" fill="url(#yellowGradient)" />
          {/* Digital dots/tracks */}
          <circle cx="140" cy="354" r="5" fill="#17243A" />
          <circle cx="160" cy="354" r="5" fill="#17243A" />
          <circle cx="180" cy="354" r="5" fill="#17243A" />
          <line x1="210" y1="354" x2="390" y2="354" stroke="#17243A" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 4" />
        </g>

        {/* Layer 3 - Algorithmic Logic Block */}
        <g filter="url(#softShadow)">
          <rect x="135" y="290" width="290" height="36" rx="8" fill="#FFFEFA" stroke="#E9E5DA" strokeWidth="2" />
          {/* Code symbols on spine */}
          <text x="160" y="314" fontFamily="monospace" fontSize="14" fontWeight="bold" fill="#17243A">&lt;code&gt; logic.rs &lt;/&gt;</text>
          <rect x="360" y="302" width="45" height="12" rx="6" fill="#FFF4CE" />
        </g>

        {/* Layer 4 - Open Innovation Platform Book */}
        <g filter="url(#softShadow)">
          <path d="M150 250 Q270 260 390 250 L400 280 Q270 290 140 280 Z" fill="#17243A" />
          <path d="M152 248 Q270 258 388 248 L385 240 Q270 250 155 240 Z" fill="#F5C842" />
        </g>

        {/* 2. Modern Laptop Workspace atop Blocks */}
        <g filter="url(#softShadow)">
          {/* Laptop Base */}
          <path d="M220 230 L370 230 L385 242 L205 242 Z" fill="#64748B" />
          <rect x="270" y="238" width="50" height="3" rx="1.5" fill="#FAF9F5" />
          {/* Laptop Screen */}
          <path d="M230 140 L360 140 L365 230 L225 230 Z" fill="#17243A" rx="6" />
          {/* Screen Content */}
          <rect x="236" y="146" width="118" height="78" rx="4" fill="#0F172A" />
          {/* Code Lines on Screen */}
          <rect x="244" y="156" width="40" height="5" rx="2.5" fill="#F5C842" />
          <rect x="290" y="156" width="30" height="5" rx="2.5" fill="#64748B" />
          <rect x="250" y="167" width="60" height="4" rx="2" fill="#EBF2F8" />
          <rect x="250" y="176" width="45" height="4" rx="2" fill="#38BDF8" />
          <rect x="250" y="185" width="70" height="4" rx="2" fill="#F5C842" />
          <rect x="244" y="196" width="50" height="5" rx="2.5" fill="#34D399" />
          {/* Glow Cursor */}
          <rect x="300" y="196" width="4" height="6" fill="#F5C842" />
        </g>

        {/* 3. Golden Ladder Leading Up (Symbolizing Learning & Ascent) */}
        <g filter="url(#softShadow)">
          {/* Left Stringer */}
          <line x1="120" y1="440" x2="190" y2="180" stroke="#E8AD22" strokeWidth="8" strokeLinecap="round" />
          {/* Right Stringer */}
          <line x1="150" y1="440" x2="220" y2="180" stroke="#E8AD22" strokeWidth="8" strokeLinecap="round" />
          {/* Ladder Rungs */}
          <line x1="126" y1="410" x2="156" y2="410" stroke="#F5C842" strokeWidth="6" strokeLinecap="round" />
          <line x1="134" y1="370" x2="164" y2="370" stroke="#F5C842" strokeWidth="6" strokeLinecap="round" />
          <line x1="142" y1="330" x2="172" y2="330" stroke="#F5C842" strokeWidth="6" strokeLinecap="round" />
          <line x1="150" y1="290" x2="180" y2="290" stroke="#F5C842" strokeWidth="6" strokeLinecap="round" />
          <line x1="158" y1="250" x2="188" y2="250" stroke="#F5C842" strokeWidth="6" strokeLinecap="round" />
          <line x1="166" y1="210" x2="196" y2="210" stroke="#F5C842" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* 4. The Climbing Young Innovator Character */}
        {/* Legs on ladder */}
        <path d="M145 320 L160 280 L180 285" stroke="#17243A" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M165 340 L180 300 L195 305" stroke="#17243A" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        {/* Torso in Yellow/Orange Hoodie */}
        <path d="M160 275 Q175 240 195 245 Q210 270 190 285 Z" fill="#F5C842" />
        {/* Backpack */}
        <rect x="150" y="248" width="16" height="24" rx="6" fill="#17243A" transform="rotate(-15 150 248)" />
        {/* Arms reaching upward */}
        <path d="M185 250 L205 220 L220 225" stroke="#F5C842" strokeWidth="7" strokeLinecap="round" />
        {/* Head */}
        <circle cx="198" cy="225" r="14" fill="#FBCFE8" />
        {/* Stylized Hair */}
        <path d="M188 222 Q200 205 212 216 Q208 228 190 228 Z" fill="#17243A" />

        {/* 5. Soaring Innovation Rocket / Star */}
        <g transform="translate(370, 70) rotate(25)" filter="url(#softShadow)">
          {/* Flame */}
          <path d="M15 65 Q20 85 20 95 Q25 85 30 65 Z" fill="#F5C842" />
          <path d="M18 65 Q20 78 20 85 Q22 78 24 65 Z" fill="#EF4444" />
          {/* Rocket Body */}
          <path d="M5 45 Q20 5 35 45 Z" fill="#FFFEFA" stroke="#E9E5DA" strokeWidth="2" />
          {/* Rocket Fin Left & Right */}
          <path d="M5 40 L-5 55 L8 50 Z" fill="#17243A" />
          <path d="M35 40 L45 55 L32 50 Z" fill="#17243A" />
          {/* Window */}
          <circle cx="20" cy="30" r="6" fill="#17243A" />
          <circle cx="20" cy="30" r="4" fill="#38BDF8" />
        </g>

        {/* 6. Floating Trophy of Excellence */}
        <g transform="translate(160, 60)" filter="url(#softShadow)">
          <path d="M10 20 Q10 45 30 45 Q50 45 50 20 Z" fill="#F5C842" stroke="#E8AD22" strokeWidth="2" />
          <rect x="25" y="45" width="10" height="15" fill="#E8AD22" />
          <rect x="18" y="60" width="24" height="8" rx="3" fill="#17243A" />
          {/* Handles */}
          <path d="M10 24 Q-2 28 8 38" stroke="#E8AD22" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M50 24 Q62 28 52 38" stroke="#E8AD22" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Star on Cup */}
          <path d="M30 25 L32 30 L37 30 L33 33 L35 38 L30 35 L25 38 L27 33 L23 30 L28 30 Z" fill="#FFFEFA" />
        </g>

        {/* 7. Whimsical Decorative Elements (Studwork inspired subtle graphics) */}
        {/* Squiggle wave line */}
        <path d="M60 200 Q75 190 90 200 T120 200" stroke="#F5C842" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M420 320 Q435 310 450 320 T480 320" stroke="#17243A" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
        
        {/* Sparkling crosses */}
        <g stroke="#17243A" strokeWidth="3" strokeLinecap="round" opacity="0.5">
          <line x1="430" y1="180" x2="430" y2="196" />
          <line x1="422" y1="188" x2="438" y2="188" />
          
          <line x1="90" y1="120" x2="90" y2="134" />
          <line x1="83" y1="127" x2="97" y2="127" />
        </g>

        {/* Golden Sparkles */}
        <circle cx="340" cy="90" r="5" fill="#F5C842" />
        <circle cx="460" cy="240" r="6" fill="#F5C842" />
        <circle cx="90" cy="280" r="4" fill="#E8AD22" />
      </svg>
    </div>
  )
}
