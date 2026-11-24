import { motion, stagger, useReducedMotion, type Variants } from 'motion/react'
import { useState, type CSSProperties } from 'react'

import { cinematic } from './ease'

/*
 * The film-title reveal for a line of text, played (not scrubbed) when
 * `active` turns true: letters surface from a blur, centre first, while
 * drawing in from wide tracking. Tracking is faked with per-letter `x`
 * offsets so the line's layout (and wrapping) never changes. Turning
 * `active` off blurs the letters out, then the line fades.
 *
 * Letters take `{ calm, spread }` as `custom`: `spread` is the letter's
 * position from the centre (-1…1); `hidden` doesn't depend on `calm`, so
 * server and client render the same styles. The line takes its `delay`.
 */
type LetterCustom = { calm: boolean; spread: number }

const line: Variants = {
  hidden: { opacity: 0, transition: { when: 'afterChildren', duration: 0.3 } },
  shown: (delay: number) => ({
    opacity: 1,
    transition: {
      duration: 0.4,
      delayChildren: stagger(0.025, { from: 'center', startDelay: 0.15 + delay }),
    },
  }),
}

const letter: Variants = {
  hidden: ({ spread }: LetterCustom) => ({
    opacity: 0,
    filter: 'blur(8px)',
    x: `${spread * 0.6}em`,
    y: '0.25em',
    scale: 1.08,
    transition: { duration: 0.45, ease: 'easeIn' },
  }),
  shown: ({ calm }: LetterCustom) => ({
    opacity: 1,
    filter: 'blur(0px)',
    x: 0,
    y: 0,
    scale: 1,
    transition: calm
      ? { duration: 0, opacity: { duration: 1, ease: 'easeOut' } }
      : { duration: 1.8, ease: cinematic },
  }),
}

/**
 * A line of text revealed like a film title card while `active` (see above),
 * starting `delay` seconds in. It is rendered only while shown or leaving:
 * Safari kept drawing faded letters of filtered text (`.pr-cut-text`) as
 * stale layers. Screen readers get the text from a hidden copy beside it,
 * which stays while the line isn't rendered.
 */
export function RevealText({
  text,
  active,
  delay = 0,
  className,
  style,
}: {
  text: string
  active: boolean
  delay?: number
  className?: string
  style?: CSSProperties
}) {
  const calm = useReducedMotion() === true
  // set when the reveal starts, cleared once the line has faded out
  const [lingering, setLingering] = useState(false)

  const count = text.replaceAll(' ', '').length
  const centre = (count - 1) / 2 || 1
  let index = 0
  return (
    <>
      <span className="sr-only">{text}</span>
      <motion.p
        aria-hidden="true"
        className={className}
        style={{ ...style, display: active || lingering ? undefined : 'none' }}
        initial="hidden"
        animate={active ? 'shown' : 'hidden'}
        variants={line}
        custom={delay}
        onAnimationStart={(definition) => {
          if (definition === 'shown') setLingering(true)
        }}
        onAnimationComplete={(definition) => {
          if (definition === 'hidden') setLingering(false)
        }}
      >
        {text.split(' ').map((word, w) => (
          // Words stay whole so wrapping only happens at spaces.
          <span key={w}>
            {w > 0 && ' '}
            <span className="inline-block whitespace-nowrap">
              {[...word].map((char) => {
                const spread = (index++ - centre) / centre
                return (
                  <motion.span
                    key={index}
                    variants={letter}
                    custom={{ calm, spread } satisfies LetterCustom}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                )
              })}
            </span>
          </span>
        ))}
      </motion.p>
    </>
  )
}
