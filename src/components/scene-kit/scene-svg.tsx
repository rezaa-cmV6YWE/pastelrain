import { cn } from 'cn'
import type { ReactNode } from 'react'

import { palette } from './palette'

export function SceneSvg({ children, paper = true }: { children: ReactNode; paper?: boolean }) {
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={cn('absolute inset-0 size-full', paper && 'pr-paper')}
    >
      {children}
    </svg>
  )
}

export function SceneDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <filter id="pr-cut" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035"
            numOctaves="2"
            seed="7"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="pr-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <pattern
          id="pr-stripe"
          patternUnits="userSpaceOnUse"
          width="16"
          height="16"
          patternTransform="rotate(45)"
        >
          <rect width="16" height="16" fill={palette.foam} />
          <rect width="8" height="16" fill={palette.stripe} />
        </pattern>
        <filter id="pr-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="2" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
  )
}

/**
 * Paper texture over the whole page, rendered once (in `src/routes/index.tsx`)
 * above both scenes, so nothing swaps grain at the hand-off.
 */
export function PaperGrain() {
  return (
    <div className="pointer-events-none fixed inset-0 z-20 opacity-[0.16] mix-blend-multiply">
      <svg className="absolute inset-0 size-full" aria-hidden="true">
        <rect width="100%" height="100%" filter="url(#pr-grain)" />
      </svg>
    </div>
  )
}
