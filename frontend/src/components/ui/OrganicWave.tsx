import React from 'react'

export interface OrganicWaveProps {
  fill?: string
  className?: string
  flip?: boolean
  variant?: 'gentle' | 'asymmetric' | 'deep'
}

export const OrganicWave: React.FC<OrganicWaveProps> = ({
  fill = '#FAF9F5',
  className = '',
  flip = false,
  variant = 'gentle',
}) => {
  const transform = flip ? 'rotate(180deg)' : undefined

  if (variant === 'asymmetric') {
    return (
      <div className={`w-full overflow-hidden leading-none ${className}`} style={{ transform }}>
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-10 sm:h-16 lg:h-24 block preserve-3d"
          preserveAspectRatio="none"
        >
          <path
            d="M0,32L60,42.7C120,53,240,75,360,69.3C480,64,600,32,720,26.7C840,21,960,43,1080,58.7C1200,75,1320,85,1380,90.7L1440,96L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"
            fill={fill}
          />
        </svg>
      </div>
    )
  }

  if (variant === 'deep') {
    return (
      <div className={`w-full overflow-hidden leading-none ${className}`} style={{ transform }}>
        <svg
          viewBox="0 0 1440 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-12 sm:h-20 lg:h-28 block"
          preserveAspectRatio="none"
        >
          <path
            d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,140L1360,140C1280,140,1120,140,960,140C800,140,640,140,480,140C320,140,160,140,80,140L0,140Z"
            fill={fill}
          />
        </svg>
      </div>
    )
  }

  // Gentle default wave
  return (
    <div className={`w-full overflow-hidden leading-none ${className}`} style={{ transform }}>
      <svg
        viewBox="0 0 1440 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-8 sm:h-14 lg:h-20 block"
        preserveAspectRatio="none"
      >
        <path
          d="M0,48 C240,90 480,10 720,48 C960,86 1200,20 1440,48 L1440,96 L0,96 Z"
          fill={fill}
        />
      </svg>
    </div>
  )
}
