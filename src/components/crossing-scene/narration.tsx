import { cn } from 'cn'
import { useMotionValueEvent, type MotionValue } from 'motion/react'
import { useState } from 'react'

import { palette } from '#/components/scene-kit/palette'
import { RevealText } from '#/components/scene-kit/reveal-text'

import { titleLine, titleSpot } from './title'

/**
 * Narration lines and the scroll-progress window [from, to] each is shown in.
 * Captions are pinned to the sky and zoom away with it, so every window ends
 * by ~0.68, just after the camera starts zooming (0.65).
 */
const lines: readonly (readonly [string, number, number])[] = [
  ['Noon by the sea. The road is empty, and the summer is almost over.', 0.06, 0.21],
  ['Somewhere down the line, the crossing bells begin to ring.', 0.22, 0.37],
  ['The little local train rolls in on time, the way it always has.', 0.38, 0.53],
  ['Come aboard. It never waits for long.', 0.54, 0.68],
]

/**
 * One caption, revealed like the heading (`RevealText`) while the scroll is
 * in its window. useScroll measures on mount and emits a change, so a reload
 * mid-scroll still activates the right line.
 */
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
  const [active, setActive] = useState(false)
  useMotionValueEvent(progress, 'change', (p) => setActive(p >= from && p < to))
  return (
    <RevealText
      text={text}
      active={active}
      className="pr-cut-text absolute m-0 max-w-[min(90vw,38rem)] text-center font-title text-[clamp(1.05rem,2.2vw,1.5rem)] leading-snug font-semibold"
      style={{ color: palette.navy }}
    />
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
