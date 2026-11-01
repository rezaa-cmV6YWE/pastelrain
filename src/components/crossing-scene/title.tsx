import { motion, stagger, useReducedMotion, type Variants } from 'motion/react'

import { palette } from './palette'

export const title = 'Re:'

/** Long, soft ease-out: fast start, slow settle, like a film title card. */
const cinematic = [0.16, 1, 0.3, 1] as const

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
 * Screen readers get the whole word from the hidden copy.
 */
export function Title() {
  const calm = useReducedMotion() === true
  return (
    <h1
      className="pr-cut-text absolute top-[calc(10svh+3rem)] left-1/2 m-0 -translate-x-1/2 text-[clamp(3rem,9vw,8rem)] leading-none font-semibold tracking-tight whitespace-nowrap portrait:top-[calc(16svh+3rem)]"
      style={{ color: palette.navy }}
    >
      <span className="sr-only">{title}</span>
      <motion.span
        aria-hidden="true"
        initial="hidden"
        animate="shown"
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
