import { useLenis } from 'lenis/react'
import {
  motion,
  MotionConfig,
  useMotionValueEvent,
  type MotionValue,
  type Variants,
} from 'motion/react'
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'

import { cinematic } from '#/components/scene-kit/ease'
import { palette } from '#/components/scene-kit/palette'
import { RevealText } from '#/components/scene-kit/reveal-text'
import { trackScrollY, useTrackProgress } from '#/components/scene-kit/track'

import { contacts } from './contacts'
import { closingStart, contactsStart, trackScreens } from './timeline'

const reveal: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.08 } },
}
/** The heading and then each link rise a little as they fade in. */
const rise: Variants = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: cinematic } },
}

/**
 * The contacts, at the bottom-right: "Say hello" over a row of round logo
 * links (flex, wrapping if it ever runs out of room), each named by its
 * label, which also shows in a small tooltip on hover or keyboard focus.
 * Always mounted, so keyboard users can Tab to the links: focusing one
 * scrolls to the end (`onFocus`), where they show; until then they are
 * transparent and let clicks through. No CSS filter on the text (see "Safari
 * stale text" in AGENTS.md).
 */
function Contacts({ shown, onFocus }: { shown: boolean; onFocus: () => void }) {
  const id = useId()
  return (
    <motion.nav
      aria-labelledby={id}
      className="fixed right-[max(1.25rem,3vw)] bottom-[max(1.25rem,calc(var(--screen)*0.03))] z-10 flex flex-col items-end gap-3 text-(--fg)"
      style={{ '--fg': palette.foam, '--ink': palette.navy } as CSSProperties}
      initial={false}
      animate={shown ? 'shown' : 'hidden'}
      variants={reveal}
    >
      <motion.h2
        id={id}
        variants={rise}
        className="m-0 font-title text-[clamp(1.25rem,2.2vw,1.75rem)] font-semibold"
      >
        Say hello
      </motion.h2>
      {/*
       * The boxes are wider than the logos: pulled right so the last logo
       * lines up with the heading; the top margin leaves room for a tooltip.
       */}
      <ul className="m-0 mt-5 -mr-2 flex list-none flex-wrap justify-end gap-1 p-0 sm:-mr-2.5">
        {contacts.map(({ label, href, icon, evenOdd }) => {
          const external = !href.startsWith('mailto:')
          return (
            <motion.li key={href} variants={rise}>
              <a
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                aria-label={label}
                className="group relative flex size-9 items-center justify-center rounded-md text-(--fg) opacity-80 outline-offset-2 outline-(--fg) transition duration-200 hover:-translate-y-0.5 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 sm:size-11"
                style={{ pointerEvents: shown ? 'auto' : 'none' }}
                onFocus={onFocus}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-5 fill-current sm:size-6"
                >
                  <path d={icon} fillRule={evenOdd ? 'evenodd' : undefined} />
                </svg>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-full mb-2 rounded bg-(--fg) px-2 py-0.5 font-sans text-xs whitespace-nowrap text-(--ink) opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  {label}
                </span>
              </a>
            </motion.li>
          )
        })}
      </ul>
    </motion.nav>
  )
}

/**
 * The closing line, centred in the night sky between the fireworks and the
 * horizon, revealed like the opening title and the captions (`RevealText`),
 * its second line a beat later.
 */
function Closing({ shown }: { shown: boolean }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(var(--screen)*0.34)] z-10 flex flex-col items-center gap-[0.6em] px-4 text-center portrait:top-[calc(var(--screen)*0.4)]"
      style={{ color: palette.foam }}
    >
      <RevealText
        text="The fireworks always end too soon."
        active={shown}
        className="pr-cut-text m-0 font-title text-[clamp(1.05rem,4.6vw,3.5rem)] leading-tight font-semibold"
      />
      <RevealText
        text="Thank you for staying until the last one."
        active={shown}
        delay={1.2}
        className="pr-cut-text m-0 font-title text-[clamp(0.9rem,2vw,1.5rem)] leading-snug font-medium"
      />
    </div>
  )
}

/**
 * Scene 4: the beach at night, the last scene. It owns the scroll track and
 * the contacts; the beach itself is drawn in the platform scene's view and
 * camera (the same sky, no cut), driven by `shore`, this section's scroll
 * progress (0 → 1). Timings: `./timeline`.
 */
export function BeachScene({ shore }: { shore: MotionValue<number> }) {
  const track = useRef<HTMLElement>(null)
  const scrollYProgress = useTrackProgress(track, trackScreens)
  useMotionValueEvent(scrollYProgress, 'change', (v) => shore.set(v))
  // a restored scroll; `shore`'s change event then sets `shown`
  useEffect(() => shore.set(scrollYProgress.get()), [shore, scrollYProgress])
  const [shown, setShown] = useState(false)
  const [closing, setClosing] = useState(false)
  useMotionValueEvent(shore, 'change', (v) => {
    setShown(v >= contactsStart)
    setClosing(v >= closingStart)
  })

  const lenis = useLenis()
  // Scrolls the page to this section's end, where the contacts show.
  const scrollToEnd = () => {
    const el = track.current
    if (!el) return
    // clamped by the browser: with a phone's toolbar hidden the page ends
    // a toolbar's height short of it
    const y = trackScrollY(el, trackScreens, 1)
    if (lenis) lenis.scrollTo(y, { duration: 1 })
    else window.scrollTo({ top: y })
  }

  return (
    <MotionConfig reducedMotion="user">
      {/* Pulled up by one screen so its scroll starts at the platform's end; only the fixed contacts show. */}
      <section
        ref={track}
        aria-label="Beach at night"
        className="relative mt-[calc(var(--screen)*-1)]"
        style={{ height: `calc(var(--screen) * ${trackScreens})` }}
      >
        <Closing shown={closing} />
        <Contacts shown={shown} onFocus={scrollToEnd} />
      </section>
    </MotionConfig>
  )
}
