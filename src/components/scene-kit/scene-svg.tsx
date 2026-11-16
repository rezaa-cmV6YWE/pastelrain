import { cn } from 'cn'
import type { CSSProperties, ReactNode } from 'react'

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

/**
 * HTML laid over a `SceneSvg`, in its viewBox units: the inner box is the
 * 1600×900 stage with the same bottom-centred cover mapping as
 * `xMidYMax slice`. `--u` is one viewBox unit in CSS px, for sizes
 * (`calc(var(--u) * 14)`). It clips with `overflow: clip`, not `hidden`: a
 * hidden box is still scrollable, and focusing a control in it scrolled it,
 * sliding the HTML off the art.
 */
export function SceneHtml({ children, className }: { children: ReactNode; className?: string }) {
  const width = 'max(100cqw, calc(100cqh * 16 / 9))'
  return (
    <div
      className={cn(
        '@container-size pointer-events-none absolute inset-0 overflow-clip',
        className,
      )}
    >
      <div
        style={
          {
            position: 'absolute',
            left: '50%',
            bottom: 0,
            translate: '-50% 0',
            aspectRatio: '16 / 9',
            width,
            '--u': `calc(${width} / 1600)`,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
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
