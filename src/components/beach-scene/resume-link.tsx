import { motion, type Variants } from 'motion/react'
import type { CSSProperties } from 'react'

import { cinematic } from '#/components/scene-kit/ease'
import { palette } from '#/components/scene-kit/palette'

import { resume } from './contacts'

/** Fades up once the closing's second line has come out of its blur. */
const appear: Variants = {
  hidden: { opacity: 0, y: 8, transition: { duration: 0.3 } },
  shown: { opacity: 1, y: 0, transition: { delay: 2.6, duration: 1.2, ease: cinematic } },
}

/** a four-point star, in a 24×24 box */
const star =
  'M12 0C12.6 7.2 16.8 11.4 24 12 16.8 12.6 12.6 16.8 12 24 11.4 16.8 7.2 12.6 0 12 7.2 11.4 11.4 7.2 12 0Z'

/** The sparkles around the label, in ems so they scale with it; each twinkles on its own beat. */
const sparkles: readonly { at: CSSProperties; size: string; delay: string; color: string }[] = [
  { at: { left: '-1.25em', top: '-0.6em' }, size: '0.85em', delay: '0s', color: palette.goldLight },
  { at: { left: '56%', top: '-1.05em' }, size: '0.55em', delay: '2.1s', color: palette.foam },
  { at: { right: '-1.1em', top: '-0.95em' }, size: '1.1em', delay: '0.9s', color: palette.foam },
  {
    at: { right: '-1.5em', bottom: '-0.2em' },
    size: '0.65em',
    delay: '1.6s',
    color: palette.goldLight,
  },
]

/**
 * "Download résumé", centred under the closing line in the same title face.
 * A warm glint sweeps across the label now and then (`pr-shine`) and small
 * stars twinkle around it (`pr-sparkle`); hovering or keyboard focus draws an
 * underline in from the right, and it leaves to the left. Always mounted, so
 * it stays in the Tab order: focusing it scrolls to the end (`onFocus`),
 * where it shows; until then it is transparent, lets clicks through and its
 * loops are paused. No CSS filter (see "Safari stale text" in AGENTS.md).
 */
export function ResumeLink({ shown, onFocus }: { shown: boolean; onFocus: () => void }) {
  return (
    <motion.a
      href={resume.href}
      download={resume.filename}
      data-umami-event="resume"
      className="group relative mt-[0.4em] inline-flex items-center gap-[0.45em] font-title text-[clamp(0.85rem,1.6vw,1.15rem)] font-medium tracking-[0.06em] outline-none"
      style={
        {
          pointerEvents: shown ? 'auto' : 'none',
          '--pr-play': shown ? 'running' : 'paused',
          '--shine-base': palette.foam,
          '--shine': palette.goldLight,
        } as CSSProperties
      }
      initial={false}
      animate={shown ? 'shown' : 'hidden'}
      variants={appear}
      onFocus={onFocus}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[0.95em] fill-current">
        <path d={resume.icon} />
      </svg>
      <span className="relative">
        <span className="pr-shine">Download résumé</span>
        {/* grows from the right on hover; the origin flips so it also leaves to the left */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 -bottom-[0.15em] h-px origin-left scale-x-0 bg-current transition-transform duration-300 ease-out group-hover:origin-right group-hover:scale-x-100 group-focus-visible:origin-right group-focus-visible:scale-x-100"
        />
      </span>
      {sparkles.map(({ at, size, delay, color }) => (
        <svg
          key={delay}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="pr-sparkle pointer-events-none absolute"
          style={{ ...at, width: size, height: size, animationDelay: delay }}
        >
          <path d={star} fill={color} />
        </svg>
      ))}
    </motion.a>
  )
}
