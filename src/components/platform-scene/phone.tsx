import { useLenis } from 'lenis/react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'

import { palette } from '#/components/scene-kit/palette'
import { SeaVignette } from '#/components/scene-kit/vignette'
import { platformStop } from '#/components/train-scene/stations'

import { ProjectPage, push } from './project-page'
import { projects, type Project } from './projects'
import { feedSpan, phoneLower, phoneRise } from './timeline'

const papers = [palette.paper, palette.flyerBlue, palette.flyerPink, palette.flyerYellow]

/**
 * The phone's height: most of the screen, but on a narrow screen no wider
 * than about 88% of it. Its contents scale with it (`--p`, 1/360 of its
 * width), which keeps a card's title at 18px or more on a 360×740 phone.
 */
const phoneHeight = 'min(calc(var(--screen) * 0.88), 190vw)'

/**
 * Held like the book: at rest it is pushed down a quarter of its height
 * (195 of its 780 `--p` units), so its bottom runs past the screen's edge.
 * Less the body's 10-unit border, that hides the bottom `hiddenP` units of
 * the screen; the feed's end is padded by as much, so its last card scrolls
 * up into view.
 */
const hiddenP = 185
/** One project's card in the feed. Focusing a link or button calls `onFocusCard` with the card. */
function Card({
  project,
  index,
  onMore,
  onFocusCard,
}: {
  project: Project
  index: number
  onMore: () => void
  onFocusCard: (card: HTMLElement) => void
}) {
  const card = useRef<HTMLElement>(null)
  const titleId = useId()
  // on the links and the button: jsx-a11y rejects focus handlers on <article>
  const onFocus = () => {
    if (card.current) onFocusCard(card.current)
  }
  return (
    <article
      ref={card}
      aria-labelledby={titleId}
      className="flex shrink-0 flex-col gap-[calc(var(--p)*8)] rounded-[calc(var(--p)*16)] p-[calc(var(--p)*12)]"
      style={{
        backgroundColor: papers[index % papers.length],
        boxShadow: '0 calc(var(--p) * 3) 0 rgb(13 40 80 / 0.15)',
      }}
    >
      <div
        className="aspect-video w-full overflow-hidden rounded-[calc(var(--p)*10)]"
        style={{ backgroundColor: palette.sky }}
      >
        {project.image ? (
          <img
            src={project.image.src}
            alt={project.image.alt}
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <SeaVignette className="size-full" />
        )}
      </div>
      <p className="m-0 font-sans text-[length:calc(var(--p)*11.5)] tracking-wide uppercase opacity-80">
        {project.kind} · {project.year}
      </p>
      <h3
        id={titleId}
        className="m-0 line-clamp-2 font-title text-[length:calc(var(--p)*22)] leading-[1.15] font-semibold"
      >
        {project.title}
      </h3>
      <p className="m-0 font-sans text-[length:calc(var(--p)*14)] leading-snug">
        {project.summary}
      </p>
      {project.stack.length > 0 && (
        <ul
          aria-label="Built with"
          className="m-0 flex list-none flex-wrap gap-[calc(var(--p)*5)] p-0"
        >
          {project.stack.map((item) => (
            <li
              key={item}
              className="rounded-sm px-[calc(var(--p)*6)] py-[calc(var(--p)*2)] font-mono text-[length:calc(var(--p)*11)]"
              style={{ backgroundColor: palette.paperShade }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-[calc(var(--p)*7)] pt-[calc(var(--p)*2)]">
        {project.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="project-link"
            data-umami-event-project={project.title}
            data-umami-event-link={link.label}
            data-umami-event-from="card"
            onFocus={onFocus}
            className="inline-flex items-center gap-[calc(var(--p)*5)] rounded-sm px-[calc(var(--p)*11)] py-[calc(var(--p)*6)] font-sans text-[length:calc(var(--p)*14)] font-bold no-underline transition-[translate] hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              backgroundColor: palette.stripe,
              color: palette.foam,
              outlineColor: palette.navy,
            }}
          >
            {link.label}
            <span aria-hidden="true">↗</span>
          </a>
        ))}
        {project.description.length > 0 && (
          <button
            type="button"
            onClick={onMore}
            data-umami-event="project-more"
            data-umami-event-project={project.title}
            onFocus={onFocus}
            aria-label={`More about ${project.title}`}
            className="cursor-pointer rounded-sm [border-width:calc(var(--p)*2)] border-solid bg-transparent px-[calc(var(--p)*11)] py-[calc(var(--p)*6)] font-sans text-[length:calc(var(--p)*14)] font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: palette.navy, borderColor: palette.navy, outlineColor: palette.navy }}
          >
            More
          </button>
        )}
      </div>
    </article>
  )
}

/**
 * The phone you pull out on the platform, held up close (outside the camera,
 * like the train scene's book, its bottom quarter past the screen's edge):
 * it rises, page scroll drives its feed of
 * project cards (`./projects`; the screen never scrolls by itself), then it
 * goes away. "More" pushes the project's page (`./project-page`) over the
 * feed; Back, Esc or scrolling the phone away goes back to the feed, with
 * focus on the "More" that opened it. Focusing a card that isn't fully on
 * screen with the phone up calls `onScrollTo` with the scroll progress that
 * shows it. No CSS filter: it moves.
 */
export function Phone({
  progress,
  onScrollTo,
}: {
  progress: MotionValue<number>
  onScrollTo: (progress: number) => void
}) {
  const viewport = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  // 105%: below the screen, with its shadow
  const rise = useTransform(progress, [...phoneRise, ...phoneLower], ['105%', '25%', '25%', '105%'])
  const lenis = useLenis()
  // the feed and a project page both end this far down, clear of the screen's hidden bottom
  const endPadding = `calc(var(--p) * ${hiddenP + 28})`

  // The project whose page is open. While it is, scrolling the window is held
  // (`lenis.stop()`) and the project page scrolls instead; if the window
  // scrolls anyway (no Lenis), leaving the phone-up range goes back to the feed.
  const [open, setOpen] = useState<number | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  const openPage = (i: number) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOpen(i)
    lenis?.stop()
  }
  const closePage = () => {
    setOpen(null)
    lenis?.start()
  }
  useMotionValueEvent(progress, 'change', (v) => {
    if (open !== null && (v < phoneRise[1] || v > phoneLower[0])) closePage()
  })
  useEffect(() => {
    if (open === null) {
      // after the feed stops being inert
      opener.current?.focus({ preventScroll: true })
      opener.current = null
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(null)
      lenis?.start()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, lenis])

  // How far the feed's content runs past the screen's bottom.
  const overflow = useMotionValue(0)
  useEffect(() => {
    const [v, c] = [viewport.current, content.current]
    if (!v || !c) return
    const observer = new ResizeObserver(() =>
      overflow.set(Math.max(0, c.offsetHeight - v.clientHeight)),
    )
    observer.observe(v)
    observer.observe(c)
    return () => observer.disconnect()
  }, [overflow])
  const feed = useTransform(progress, feedSpan, [0, 1])
  // both read before computing: a function-form transform only follows what it read
  const y = useTransform(() => {
    const [f, o] = [feed.get(), overflow.get()]
    return -f * o
  })

  const onFocusCard = (card: HTMLElement) => {
    const [v, c] = [viewport.current, content.current]
    if (!v || !c) return
    const at = progress.get()
    const up = at >= phoneRise[1] && at <= phoneLower[0]
    const top = card.offsetTop + y.get()
    // the part of the feed above the screen's bottom edge (`hiddenP`; the screen is 340 units wide)
    const shown = v.clientHeight - (v.clientWidth / 340) * hiddenP
    if (up && top >= 0 && top + card.offsetHeight <= shown) return
    const first = c.firstElementChild as HTMLElement
    const o = overflow.get()
    const f = o > 0 ? Math.min(1, Math.max(0, (card.offsetTop - first.offsetTop) / o)) : 0
    onScrollTo(feedSpan[0] + f * (feedSpan[1] - feedSpan[0]))
  }

  return (
    <motion.div
      className="pointer-events-none absolute inset-x-12 bottom-12 flex justify-center"
      style={{ y: rise }}
    >
      <div
        className="pointer-events-auto relative flex flex-col rounded-[calc(var(--p)*44)] p-[calc(var(--p)*10)]"
        style={
          {
            '--p': `calc(${phoneHeight} * 9 / 19.5 / 360)`,
            height: phoneHeight,
            aspectRatio: '9 / 19.5',
            backgroundColor: palette.navy,
            // a flat offset sheet, no blur
            boxShadow: 'calc(var(--p) * -4) calc(var(--p) * 6) 0 rgb(13 40 80 / 0.35)',
          } as CSSProperties
        }
      >
        {/* overflow-clip: focusing a link in an overflow: hidden box scrolls the box itself */}
        <div
          className="relative flex min-h-0 flex-1 flex-col overflow-clip rounded-[calc(var(--p)*34)]"
          style={{ backgroundColor: palette.cloud, color: palette.navy }}
        >
          <div
            aria-hidden="true"
            className="flex h-[calc(var(--p)*34)] shrink-0 items-center justify-between px-[calc(var(--p)*24)] font-sans text-[length:calc(var(--p)*12)] font-bold"
          >
            <span>18:42</span>
            <span className="flex items-center gap-[calc(var(--p)*6)]">
              5G
              <span className="flex h-[calc(var(--p)*11)] w-[calc(var(--p)*22)] rounded-[calc(var(--p)*3)] border-[length:calc(var(--p)*1.5)] border-solid border-current p-[calc(var(--p)*1.5)]">
                <span className="h-full w-4/5 rounded-[calc(var(--p)*1.5)] bg-current" />
              </span>
            </span>
          </div>
          <div className="relative min-h-0 flex-1">
            {/* the feed: pushed aside, and out of the tab order, while a page is open */}
            <motion.div
              inert={open !== null}
              className="absolute inset-0 flex flex-col"
              animate={{ x: open === null ? '0%' : '-25%' }}
              transition={push}
            >
              <div
                className="shrink-0 border-b-[length:calc(var(--p)*1)] border-solid px-[calc(var(--p)*16)] pb-[calc(var(--p)*10)]"
                style={{ borderColor: palette.cloudShade }}
              >
                <p className="m-0 font-title text-[length:calc(var(--p)*22)] leading-tight font-semibold">
                  Projects
                </p>
                <p className="m-0 font-sans text-[length:calc(var(--p)*12)] opacity-80">
                  {platformStop.join(' · ')}
                </p>
              </div>
              <div ref={viewport} className="relative min-h-0 flex-1 overflow-clip">
                <motion.div
                  ref={content}
                  className="relative flex flex-col gap-[calc(var(--p)*14)] p-[calc(var(--p)*14)]"
                  style={{ y, paddingBottom: endPadding }}
                >
                  {projects.length === 0 ? (
                    <p className="m-0 font-sans text-[length:calc(var(--p)*14)]">
                      No projects yet.
                    </p>
                  ) : (
                    projects.map((project, i) => (
                      // positions: titles may repeat
                      <Card
                        key={i}
                        project={project}
                        index={i}
                        onMore={() => openPage(i)}
                        onFocusCard={onFocusCard}
                      />
                    ))
                  )}
                </motion.div>
              </div>
            </motion.div>
            <AnimatePresence>
              {open !== null && (
                <ProjectPage
                  key={open}
                  project={projects[open]}
                  paper={papers[open % papers.length]}
                  endPadding={endPadding}
                  onBack={closePage}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
