import { cn } from 'cn'
import {
  easeInOut,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from 'motion/react'
import { useState, type ReactNode } from 'react'

import { palette } from '#/components/scene-kit/palette'
import { SeaVignette } from '#/components/scene-kit/vignette'

import { pages, paragraphText } from './story'
import {
  bookClose,
  bookLower,
  bookOpen,
  bookRise,
  pagesStart,
  pageSpan,
  turnSpan,
} from './timeline'

/**
 * Single pages in reading order, two per spread: the chapter page (even),
 * then the prose page (odd). Portrait shows one at a time; landscape shows
 * the spread that holds the current one.
 */
const lastSlot = pages.length * 2 - 1
const spreadOf = (slot: number) => Math.floor(slot / 2)
/** Scroll per single page: half a spread. */
const slotSpan = pageSpan / 2

/**
 * Where scroll `v` is in the book: the current single page, and how far the
 * turn to the next one has got (0–1). Each page holds, then turns over the
 * last `turnSpan` of its scroll; the last page doesn't turn.
 */
function place(v: number) {
  const at = Math.min(lastSlot, Math.max(0, (v - pagesStart) / slotSpan))
  const slot = Math.floor(at)
  const into = (at - slot) * slotSpan - (slotSpan - turnSpan)
  return { slot, turn: slot === lastSlot ? 0 : Math.min(1, Math.max(0, into / turnSpan)) }
}

/**
 * Page content keeps to the top three quarters of a page: the bottom quarter
 * of the book is below the screen edge (see `Book`).
 */
const pageText =
  'relative flex h-3/4 flex-col overflow-hidden p-[7%] font-title text-[clamp(0.72rem,calc(var(--screen)*0.019),1.15rem)] leading-relaxed'
const ink = { color: palette.navy }

/** A sheet of paper: the rough-cut background is a sibling, so the text is never filtered. */
function Sheet({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn('absolute', className)}>
      <div
        className="pr-cut-text absolute inset-0 rounded-md"
        style={{ backgroundColor: palette.paper }}
      />
      {children}
    </div>
  )
}

/**
 * The page number, in the top margin at the page's outer corner. The box is
 * as tall as the page's top padding (7% of its width, hence the aspect ratio)
 * and centres the number in it.
 */
function PageNumber({ n, side }: { n: number; side: 'left' | 'right' }) {
  return (
    <p
      className={cn(
        'absolute inset-x-0 top-0 m-0 flex aspect-100/7 items-center px-[7%] text-[0.85em]',
        side === 'right' ? 'justify-end' : 'justify-start',
      )}
    >
      {n}
    </p>
  )
}

/** A spread's prose page. */
function RightPage({ page }: { page: number }) {
  const { paragraphs } = pages[page]
  return (
    <div className={pageText} style={ink}>
      <PageNumber n={page * 2 + 1} side="right" />
      <div className="flex-1">
        {paragraphs.map((paragraph, i) => (
          <p
            key={i}
            className={cn(
              'mt-0 mb-[0.8em]',
              i === 0 &&
                'first-letter:float-left first-letter:mr-2 first-letter:text-[3em] first-letter:leading-none',
              typeof paragraph !== 'string' && 'italic',
            )}
          >
            {paragraphText(paragraph)}
          </p>
        ))}
      </div>
    </div>
  )
}

/** A spread's chapter page: numeral, title and a small seaside vignette. */
function LeftPage({ page }: { page: number }) {
  const { numeral, chapter } = pages[page]
  return (
    <div className={cn(pageText, 'items-center')} style={ink}>
      <PageNumber n={page * 2} side="left" />
      <div className="flex flex-1 flex-col items-center justify-center gap-[0.6em] text-center">
        <p className="m-0 text-[3em] leading-none font-semibold">{numeral}</p>
        <p className="m-0 text-[1.4em] font-semibold">{chapter}</p>
        <SeaVignette className="mt-[0.6em] h-[5em] w-[7.5em]" />
      </div>
    </div>
  )
}

/** One single page (see `lastSlot`): a chapter page or a prose page. */
function SinglePage({ slot }: { slot: number }) {
  return slot % 2 === 0 ? <LeftPage page={spreadOf(slot)} /> : <RightPage page={spreadOf(slot)} />
}

/**
 * A sheet hinged on its left edge, turned by `angle`: 0° lies on the right,
 * -180° on the left. Each face is shown only while it faces the viewer. That
 * is driven by the angle as well as `backface-visibility`, which WebKit does
 * not honour for faces with filtered children (the open cover's front leaked
 * past the book's left edge on iPhones). No filter on the hinged element
 * itself: filters flatten 3D.
 */
function Leaf({
  angle,
  front,
  back,
  layer,
  className,
}: {
  angle: MotionValue<number>
  front: ReactNode
  back?: ReactNode
  /** Stacking order among the book's leaves (z-index). */
  layer?: MotionValue<number>
  className?: string
}) {
  const frontShown = useTransform(angle, (a) => (a > -90 ? 1 : 0))
  const backShown = useTransform(angle, (a) => (a > -90 ? 0 : 1))
  return (
    <motion.div
      className={cn('absolute inset-y-0 right-0 w-1/2 transform-3d portrait:w-full', className)}
      style={{ rotateY: angle, transformOrigin: 'left center', zIndex: layer }}
    >
      <motion.div className="absolute inset-0 backface-hidden" style={{ opacity: frontShown }}>
        {front}
      </motion.div>
      {back && (
        // pre-flipped, so it faces the viewer once the leaf has turned over
        <motion.div
          className="absolute inset-0 rotate-y-180 backface-hidden"
          style={{ opacity: backShown }}
        >
          {back}
        </motion.div>
      )}
    </motion.div>
  )
}

/**
 * The book the passenger reads on the way, held up close: its bottom quarter
 * runs past the bottom of the screen. It rises into view, the cover opens,
 * one spread per scroll step introduces Rezaa, then it closes and lowers.
 * Landscape shows two-page spreads (chapter on the cover's back, prose on the
 * right); portrait is too narrow for two pages, so it shows the same pages
 * one at a time on the right page, turning between the chapter page and the
 * prose page of each spread. As it opens it slides right so the left page
 * (the cover's back and the backs of turned pages, blank paper) shows at the
 * screen's left edge. Page turns follow the scroll, like the cover: scrolling
 * back turns a page back. Decorative: the same text is in the scene's
 * screen-reader copy.
 */
export function Book({ progress }: { progress: MotionValue<number> }) {
  const calm = useReducedMotion() === true
  // the book's box sits on the screen's bottom edge; 25% pushes its bottom
  // quarter off-screen, 105% the whole book
  const rise = useTransform(progress, [...bookRise, ...bookLower], ['105%', '25%', '25%', '105%'])
  const open = useTransform(
    progress,
    [bookOpen[0], bookOpen[1], bookClose[0], bookClose[1]],
    [0, 1, 1, 0],
  )
  const coverAngle = useTransform(open, [0, 1], [0, -180])
  // The resting page leaves sit over the page stack, so the cover must stack
  // above them while the book is closed, opening or closing. Pages only turn
  // once it's fully open, when they land on its back (the left page).
  const coverLayer = useTransform(open, (o): number => (o < 1 ? 2 : 0))

  // The current single page is state (pages change only at its edges; useScroll
  // emits a change on mount, so a reload partway down opens on the right
  // page). The leaves' angles follow the scroll every frame. Portrait turns
  // after every page, landscape only after a prose page (between spreads).
  // Reduced motion: no leaf moves; pages just change at their edges.
  const [slot, setSlot] = useState(0)
  useMotionValueEvent(progress, 'change', (v) => setSlot(place(v).slot))
  // Angles are worked out against the page that is rendered, not the one the
  // scroll has reached: crossing a page edge updates the angle at once but the
  // pages a render later, so until then a finished turn stays fully turned
  // (rather than snapping flat and flashing the old page) and a turn scrolled
  // back into stays at rest. useTransform re-reads `slot` on every render.
  const angleAt = (v: number) => {
    const at = place(v)
    if (at.slot > slot) return -180
    if (at.slot < slot) return 0
    return -180 * easeInOut(at.turn)
  }
  const singleAngle = useTransform(progress, (v): number => (calm ? 0 : angleAt(v)))
  const spreadAngle = useTransform(progress, (v): number =>
    calm || slot % 2 === 0 ? 0 : angleAt(v),
  )

  // Under each leaf lies the page it uncovers; the cover's back keeps the
  // current left page until the spread leaf lands on it.
  const next = Math.min(lastSlot, slot + 1)
  const spread = spreadOf(slot)
  const nextSpread = slot % 2 === 1 ? spreadOf(next) : spread

  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-x-12 bottom-12 flex justify-center"
      style={{ y: rise }}
    >
      {/*
       * Landscape: the closed book is centred, so it slides left by half its
       * width (one page) while opening. Portrait: it opens to the right of
       * centre, so the right page ends near the screen's right edge and the
       * left page shows at the left; at most by a page, on wide tablets.
       */}
      <motion.div
        className="relative aspect-[1.5] w-[min(90vw,1240px,calc(var(--screen)*1.4))] perspective-[1800px] portrait:aspect-[0.6] portrait:w-[min(78vw,480px,calc(var(--screen)*0.64))] portrait:[translate:calc(min(48vw-50%,50%)*var(--open))_0] landscape:[translate:calc(-25%*(1-var(--open)))_0] [@media(max-height:500px)]:w-[min(90vw,calc(var(--screen)*1.7))]"
        style={{ '--open': open } as MotionStyle}
      >
        {/* page stack */}
        <div
          className="absolute inset-y-0 right-0 w-1/2 translate-x-1 translate-y-1.5 rounded-md portrait:w-full"
          style={{ backgroundColor: palette.paperShade }}
        />
        <Sheet className="inset-y-0 right-0 w-1/2 portrait:w-full">
          <div className="h-full portrait:hidden">
            <RightPage page={nextSpread} />
          </div>
          <div className="h-full landscape:hidden">
            <SinglePage slot={next} />
          </div>
        </Sheet>
        {/* the spine: between the pages, at the hinge (the right page's left edge in portrait) */}
        <div
          className="absolute inset-y-0 left-1/2 w-0.75 -translate-x-1/2 portrait:left-0"
          style={{ backgroundColor: palette.paperShade }}
        />

        {/* the cover; its back is the spread's left page (blank in portrait) */}
        <Leaf
          angle={coverAngle}
          layer={coverLayer}
          front={
            <>
              <div
                className="pr-cut-text absolute inset-0 rounded-md"
                style={{ backgroundColor: palette.stripe }}
              />
              <div
                className="relative flex h-3/4 flex-col items-center justify-center gap-[0.5em] font-title"
                style={{ color: palette.foam }}
              >
                <p className="m-0 text-[clamp(2rem,calc(var(--screen)*0.06),4rem)] leading-none font-semibold">
                  Re:
                </p>
                <p className="m-0 text-sm tracking-[0.2em]">a short story</p>
              </div>
            </>
          }
          back={
            <Sheet className="inset-0">
              <div className="h-full portrait:hidden">
                <LeftPage page={spread} />
              </div>
            </Sheet>
          }
        />

        {/* the turning pages, at rest on the current page; after the cover so they land on it */}
        <Leaf
          angle={singleAngle}
          className="landscape:hidden"
          front={
            <Sheet className="inset-0">
              <SinglePage slot={slot} />
            </Sheet>
          }
          // turned over, a page lands blank on the left
          back={<Sheet className="inset-0" />}
        />
        <Leaf
          angle={spreadAngle}
          className="portrait:hidden"
          front={
            <Sheet className="inset-0">
              <RightPage page={spread} />
            </Sheet>
          }
          back={
            <Sheet className="inset-0">
              <LeftPage page={nextSpread} />
            </Sheet>
          }
        />
      </motion.div>
    </motion.div>
  )
}
