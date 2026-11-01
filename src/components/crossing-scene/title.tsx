import { cn } from 'cn'
import { motion, stagger, useReducedMotion, type Variants } from 'motion/react'

import { palette } from './palette'

export const title = 'Re:'

/**
 * Where the title sits, inside its parallax layer (hence `+3rem`: the layer's
 * overscan). The narration reuses it so captions appear exactly where the
 * title was; `titleLine` is the matching line box height.
 */
export const titleSpot = 'top-[calc(10svh+3rem)] portrait:top-[calc(16svh+3rem)]'
export const titleLine = 'h-[clamp(3rem,9vw,8rem)] text-[clamp(3rem,9vw,8rem)]'

/** Long, soft ease-out: fast start, slow settle, like a film title card. */
export const cinematic = [0.16, 1, 0.3, 1] as const

const centreOut = stagger(0.14, { from: 'center', startDelay: 0.5 })

/*
 * Both variants take `calm` (prefers reduced motion) as their `custom` value.
 * `hidden` is the same either way so server and client render identical
 * styles; only `shown` differs: calm snaps blur, offset and spacing while the
 * letters are still invisible, then just fades them in.
 */

/**
 * The word tracks in from wide letter-spacing while letters surface from the
 * centre out. Letter-spacing also trails the last letter, so an equal negative
 * right margin cancels it and keeps the centred word visually centred.
 */
const word: Variants = {
  hidden: { letterSpacing: '0.6em', marginRight: '-0.6em' },
  shown: (calm: boolean) => {
    const track = calm ? { duration: 0 } : { duration: 2.6, ease: cinematic, delay: 0.4 }
    return {
      letterSpacing: '-0.025em',
      marginRight: '0.025em',
      transition: { letterSpacing: track, marginRight: track, delayChildren: centreOut },
    }
  },
}

/** Each letter fades up out of a soft focus blur. */
const letter: Variants = {
  hidden: { opacity: 0, filter: 'blur(14px)', y: '0.25em', scale: 1.08 },
  shown: (calm: boolean) => ({
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    scale: 1,
    transition: calm
      ? { duration: 0, opacity: { duration: 1.2, ease: 'easeOut' } }
      : { duration: 1.8, ease: cinematic },
  }),
}

/**
 * The scene's visible heading, revealed like a film title card: letters fade
 * up from blur, centre first, while the word tracks in to its final spacing.
 * The reveal starts when `show` turns true (after the opening camera move).
 * Screen readers get the whole word from the hidden copy.
 */
export function Title({ show }: { show: boolean }) {
  const calm = useReducedMotion() === true
  return (
    <h1
      className={cn(
        'pr-cut-text absolute left-1/2 m-0 -translate-x-1/2 leading-none font-semibold tracking-tight whitespace-nowrap',
        titleSpot,
        titleLine,
      )}
      style={{ color: palette.navy }}
    >
      <span className="sr-only">{title}</span>
      <motion.span
        aria-hidden="true"
        initial="hidden"
        animate={show ? 'shown' : 'hidden'}
        variants={word}
        custom={calm}
      >
        {[...title].map((char, i) => (
          <motion.span key={i} variants={letter} custom={calm} className="inline-block">
            {char}
          </motion.span>
        ))}
      </motion.span>
    </h1>
  )
}
