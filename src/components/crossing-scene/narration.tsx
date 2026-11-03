import { cn } from 'cn'
import {
  motion,
  stagger,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
  type Variants,
} from 'motion/react'
import { useState } from 'react'

import { cinematic } from '#/components/scene-kit/ease'
import { palette } from '#/components/scene-kit/palette'

import { titleLine, titleSpot } from './title'

/**
 * Narration lines and the scroll-progress window [from, to] each is shown in.
 * Captions are pinned to the sky and zoom away with it, so every window ends
 * by ~0.68, just after the camera starts zooming (0.65).
 */
const lines: readonly (readonly [string, number, number])[] = [
  ['Noon by the sea. The sun stands high and the road is empty.', 0.06, 0.21],
  ['Somewhere down the line, the crossing bells begin to ring.', 0.22, 0.37],
  ['A little local train rolls in, right on time.', 0.38, 0.53],
  ['Come aboard.', 0.54, 0.68],
]

/*
 * The same film-title reveal as the heading, played (not scrubbed) when a
 * line's scroll window is entered: letters surface from a blur, centre first,
 * while drawing in from wide tracking. Tracking is faked with per-letter `x`
 * offsets so the line's layout (and wrapping) never changes. Leaving the
 * window blurs the letters out, then the caption fades.
 *
 * Letters take `{ calm, spread }` as `custom`: `spread` is the letter's
 * position from the centre (-1…1); `hidden` doesn't depend on `calm`, so
 * server and client render the same styles.
 */
type LetterCustom = { calm: boolean; spread: number }

const caption: Variants = {
  hidden: { opacity: 0, transition: { when: 'afterChildren', duration: 0.3 } },
  shown: {
    opacity: 1,
    transition: {
      duration: 0.4,
      delayChildren: stagger(0.025, { from: 'center', startDelay: 0.15 }),
    },
  },
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

function Line({
  progress,
  text,
  from,
  to,
}: {
  progress: MotionValue<number>
  text: string
  from: number
  to: number
}) {
  const calm = useReducedMotion() === true
  const [active, setActive] = useState(false)
  // Rendered only while shown or leaving: Safari kept drawing faded letters
  // of filtered text as stale layers (see the title in `./index`).
  const [present, setPresent] = useState(false)
  // useScroll measures on mount and emits a change, so a reload mid-scroll
  // still activates the right line.
  useMotionValueEvent(progress, 'change', (p) => {
    const inWindow = p >= from && p < to
    setActive(inWindow)
    if (inWindow) setPresent(true)
  })

  const count = text.replaceAll(' ', '').length
  const centre = (count - 1) / 2 || 1
  let index = 0
  return (
    <>
      {/* outside the caption, so screen readers keep it while it isn't rendered */}
      <span className="sr-only">{text}</span>
      <motion.p
        aria-hidden="true"
        className="pr-cut-text absolute m-0 max-w-[min(90vw,38rem)] text-center font-title text-[clamp(1.05rem,2.2vw,1.5rem)] leading-snug font-semibold"
        style={{ color: palette.navy, display: present ? undefined : 'none' }}
        initial="hidden"
        animate={active ? 'shown' : 'hidden'}
        variants={caption}
        onAnimationComplete={(definition) => {
          if (definition === 'hidden') setPresent(false)
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

/**
 * Captions that tell the story as the scene plays, set in the sky like the
 * title (same paper-cut text look, no backing strip). They are pinned to the
 * sky: render inside the camera, so they zoom away with the world. At 1× they
 * sit exactly in the title's spot; the outer box carries the same 3rem
 * overscan as a parallax layer so `titleSpot` lines up.
 */
export function Narration({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="pointer-events-none absolute -inset-12">
      <div
        className={cn(
          'absolute inset-x-0 flex items-center justify-center px-6',
          titleSpot,
          titleLine,
        )}
      >
        {lines.map(([text, from, to]) => (
          <Line key={text} progress={progress} text={text} from={from} to={to} />
        ))}
      </div>
    </div>
  )
}
