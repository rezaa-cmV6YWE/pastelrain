import {
  motion,
  MotionConfig,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from 'motion/react'
import { useRef } from 'react'

import { CameraMarks, useSceneCamera, type Shot } from '#/components/scene-kit/camera'
import { glassFade } from '#/components/scene-kit/handoff'
import { palette } from '#/components/scene-kit/palette'
import { ParallaxLayer, usePointerParallax } from '#/components/scene-kit/parallax'

import { Book } from './book'
import { Carriage, Stanchions, Straps, SunPatches } from './carriage'
import { useDaylight } from './daylight'
import { OutsideFar, OutsideNear } from './outside'
import { Stations, stops } from './stations'
import { pages, paragraphText } from './story'
import { cruiseStop, goldenSpan, stationRun, trackScreens, zoomSpan } from './timeline'

/**
 * The zoom closes in on the centre window (600–1000 × 230–560), framed on the
 * station signs (`stations.tsx`), but stops while half of each neighbouring
 * window is still in frame: `keep` spans x 350–1250 (the inner halves of the
 * windows at 150–550 and 1050–1450) and the window band's height. `cover`
 * (the centre opening) only limits very wide or tall screens. Portrait
 * phones already show less than that at 1×, so they don't zoom.
 */
const windowShot: Shot = {
  from: { x: 800, y: 395 },
  to: { x: 800, y: 410 },
  cover: { w: 400, h: 330 },
  margin: 1.08,
  keep: { w: 900, h: 420 },
}

/** Wrap a strip offset into [-1600, 0), the range the three drawn tiles cover. */
const tile = (v: number) => (((v % 1600) + 1600) % 1600) - 1600

/**
 * Scene 2: inside the train, facing the far windows with the sea outside. It
 * first shows through the crossing train's window as the crossing's camera
 * rushes into it, the glass clearing to reveal it (`scene-kit/handoff.ts`;
 * `handoff` is that hand-off's progress). A book rises and tells the story page by page,
 * then the camera zooms into the centre window and the train passes the
 * stations of Rezaa's career, while the light turns from noon to golden
 * hour. Timings: `./timeline`.
 */
export function TrainScene({ handoff }: { handoff: MotionValue<number> }) {
  const track = useRef<HTMLElement>(null)
  const view = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const zoom = useTransform(scrollYProgress, zoomSpan, [0, 1])
  const camera = useSceneCamera(zoom, view, windowShot)

  // As in the crossing: the sway is divided by the zoom so it stays the same
  // size on screen while the camera is zoomed into the window.
  const pointer = usePointerParallax()
  const p = {
    x: useTransform(() => pointer.x.get() / camera.z.get()),
    y: useTransform(() => pointer.y.get() / camera.z.get()),
  }

  // The train cruises on time (seconds travelled at full speed), slowing to a
  // stop just as the camera reaches the window. Not while the scene is hidden
  // beneath the crossing (`handoff` 0): nobody sees it, so it does no work.
  const calm = useReducedMotion() === true
  const cruise = useMotionValue(0)
  const cruiseSpeed = useTransform(scrollYProgress, cruiseStop, [1, 0])
  useAnimationFrame((_, delta) => {
    if (calm || handoff.get() === 0) return
    cruise.set(cruise.get() + (Math.min(delta, 100) / 1000) * cruiseSpeed.get())
  })
  // Then scroll drives it past the stations at a steady speed, no stops.
  const run = useTransform(scrollYProgress, stationRun, [0, stops[stops.length - 1].run])
  // Positive offsets move scenery screen-right: the train travels screen-left.
  const farX = useTransform(() => tile(cruise.get() * 40 + run.get() * 0.15))
  const nearX = useTransform(() => tile(cruise.get() * 900 + run.get()))

  const golden = useTransform(scrollYProgress, goldenSpan, [0, 1])
  const daylight = useDaylight(golden)
  const sunPatches = useTransform(golden, [0.3, 1], [0, 0.55])
  const warmth = useTransform(golden, [0, 1], [0, 0.28])
  const glass = useTransform(handoff, glassFade, [1, 0])
  // Not drawn until the hand-off starts: it sits beneath the crossing, and
  // painting both scenes' full-screen layers at once runs browsers out of
  // GPU tile memory (rectangles of the scene go missing or stale).
  const shown = useTransform(handoff, (h) => (h > 0 ? 'visible' : 'hidden'))
  // and its CSS animations pause meanwhile (`--pr-play`)
  const play = useTransform(handoff, (h) => (h > 0 ? 'running' : 'paused'))

  return (
    <MotionConfig reducedMotion="user">
      {/*
       * Pulled up by one screen so its scroll range starts at the crossing's
       * end. The view is fixed rather than sticky, so it sits exactly beneath
       * the crossing's through the hand-off (`scene-kit/handoff.ts`): a sticky
       * view slid down as soon as the page scrolled above the section, which
       * flashed a strip of blank page as the rush back out began.
       */}
      <section
        ref={track}
        aria-label="Inside the train"
        className="relative mt-[-100svh]"
        style={{ height: `${trackScreens * 100}svh` }}
      >
        <h2 className="sr-only">About me</h2>
        <article className="sr-only">
          {pages.map((page) => (
            <section key={page.numeral}>
              <h3>{page.chapter}</h3>
              {page.paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraphText(paragraph)}</p>
              ))}
            </section>
          ))}
        </article>
        <ol className="sr-only">
          {stops.map((stop) => (
            <li key={stop.code}>
              {stop.name} — {stop.role}, {stop.dates}
            </li>
          ))}
        </ol>

        <motion.div
          ref={view}
          className="fixed top-0 h-svh w-full overflow-hidden"
          style={
            { backgroundColor: palette.cloud, visibility: shown, '--pr-play': play } as MotionStyle
          }
        >
          <motion.div
            className="absolute inset-0 origin-top-left"
            style={{ x: camera.x, y: camera.y, scale: camera.z }}
          >
            <ParallaxLayer pointer={p} depth={4}>
              <OutsideFar daylight={daylight} x={farX} />
            </ParallaxLayer>
            <ParallaxLayer pointer={p} depth={10}>
              <OutsideNear x={nearX} />
              <Stations run={run} />
            </ParallaxLayer>
            <motion.div
              className="pr-rattle absolute inset-0"
              style={{ '--rattle': cruiseSpeed } as MotionStyle}
            >
              <ParallaxLayer pointer={p} depth={22}>
                <Carriage />
                <SunPatches opacity={sunPatches} />
              </ParallaxLayer>
              <ParallaxLayer pointer={p} depth={32}>
                <Stanchions />
              </ParallaxLayer>
              <ParallaxLayer pointer={p} depth={40}>
                <Straps />
              </ParallaxLayer>
            </motion.div>
            <CameraMarks shot={windowShot} marks={camera.marks} />
          </motion.div>
          {/* outside the camera: the book is held, not zoomed */}
          <ParallaxLayer pointer={pointer} depth={40}>
            <Book progress={scrollYProgress} />
          </ParallaxLayer>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-multiply"
            style={{ backgroundColor: palette.goldTint, opacity: warmth }}
          />
          {/*
           * The crossing train's window glass: seen through the window during
           * the hand-off, this scene starts as navy glass, which clears
           */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: palette.navy, opacity: glass }}
          />
        </motion.div>
      </section>
    </MotionConfig>
  )
}
