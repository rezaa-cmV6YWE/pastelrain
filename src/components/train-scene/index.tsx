import {
  motion,
  MotionConfig,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from 'motion/react'
import { useCallback, useEffect, useRef } from 'react'

import { usePullInDistance } from '#/components/platform-scene/layout'
import { CameraMarks, useSceneCamera, usePaperBlur, type Shot } from '#/components/scene-kit/camera'
import { glassFade } from '#/components/scene-kit/handoff'
import { palette } from '#/components/scene-kit/palette'
import { ParallaxLayer, usePointerParallax } from '#/components/scene-kit/parallax'
import { useRush } from '#/components/scene-kit/rush'
import { useTrackProgress } from '#/components/scene-kit/track'

import { Book } from './book'
import { Carriage, Stanchions, Straps, SunPatches } from './carriage'
import { useDaylight } from './daylight'
import { OutsideFar, OutsideNear } from './outside'
import { Stations, stops } from './stations'
import { pages, paragraphText } from './story'
import {
  cruiseStop,
  duskSpan,
  goldenSpan,
  pullInSpan,
  runEnd,
  stationRun,
  trackScreens,
  zoomSpan,
} from './timeline'

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
 * hour. Timings: `./timeline`. Past the last sign the sun sets and the
 * platform pulls in from the left in front of the same passing sea (the
 * outside is a separate view beneath the platform scene's), braking with its
 * name board in the window (`pullIn`, which the platform scene follows).
 * Then it plays `arrival`: the camera rushes through the centre window onto
 * that platform (`platform-scene`).
 */
export function TrainScene({
  handoff,
  arrival,
  pullIn,
}: {
  handoff: MotionValue<number>
  arrival: MotionValue<number>
  pullIn: MotionValue<number>
}) {
  const track = useRef<HTMLElement>(null)
  const view = useRef<HTMLDivElement>(null)
  // The arrival rush's transform wraps the scroll camera, which measures in
  // it, so a resize mid-rush re-frames correctly (as in the crossing).
  const rushView = useRef<HTMLDivElement>(null)
  const scrollYProgress = useTrackProgress(track, trackScreens)
  const zoom = useTransform(scrollYProgress, zoomSpan, [0, 1])
  const camera = useSceneCamera(zoom, rushView, windowShot)
  const calm = useReducedMotion() === true
  // The arrival: at the end of the scroll the camera rushes into the centre
  // window's opening below the transom (`Carriage`'s `data-rush-target`).
  const rushTarget = useCallback(
    () => view.current?.querySelector('[data-rush-target]') ?? null,
    [],
  )
  const rushCamera = useRush({
    view,
    track,
    screens: trackScreens,
    progress: scrollYProgress,
    value: arrival,
    calm,
    target: rushTarget,
  })

  // As in the crossing: the sway is divided by both zooms so it stays the
  // same size on screen while the camera is zoomed into the window. The
  // outside isn't in the rush camera (see below), so only the window zoom.
  const pointer = usePointerParallax()
  const p = {
    x: useTransform(() => pointer.x.get() / (camera.z.get() * rushCamera.z.get())),
    y: useTransform(() => pointer.y.get() / (camera.z.get() * rushCamera.z.get())),
  }
  const pOutside = {
    x: useTransform(() => pointer.x.get() / camera.z.get()),
    y: useTransform(() => pointer.y.get() / camera.z.get()),
  }

  // The train cruises on time (seconds travelled at full speed), slowing to a
  // stop just as the camera reaches the window. Not while the scene is hidden
  // (beneath the crossing, `handoff` 0, or behind the platform, `arrival`
  // 1): nobody sees it, so it does no work.
  const cruise = useMotionValue(0)
  const cruiseSpeed = useTransform(scrollYProgress, cruiseStop, [1, 0])
  useAnimationFrame((_, delta) => {
    if (calm || handoff.get() === 0 || arrival.get() >= 1) return
    cruise.set(cruise.get() + (Math.min(delta, 100) / 1000) * cruiseSpeed.get())
  })
  // Then scroll drives it past the stations at a steady speed, no stops.
  const run = useTransform(scrollYProgress, stationRun, [0, runEnd])
  // Then the platform pulls in, and the scenery outside goes on passing with
  // it: `pullIn` is the platform's share of its way in (0 → 1), and the
  // shore moves the same distance on screen (`glide`, in the zoomed camera's
  // units). The pull-in starts at the run's speed and only slows down:
  // 1 − (1 − t)^k starts at slope `k` (the run's speed, relative to the
  // pull-in's average) and brakes to a stop, so there is no jolt where it
  // takes over. `k` depends on the zoom and on how far the platform has to
  // come (`usePullInDistance`, shorter on narrow screens); it stays near 1.5–2
  // on real screens, and is kept within 1.2–3 so the curve always brakes.
  // Set on mount too, so a restored scroll position is right.
  const distance = usePullInDistance(view)
  const pullInLocal = useTransform(() => {
    const [v, z, d] = [scrollYProgress.get(), camera.z.get(), distance.get()]
    const t = Math.min(1, Math.max(0, (v - pullInSpan[0]) / (pullInSpan[1] - pullInSpan[0])))
    const runSpeed = runEnd / (stationRun[1] - stationRun[0])
    const k = (runSpeed * (pullInSpan[1] - pullInSpan[0]) * z) / d
    return 1 - (1 - t) ** Math.min(3, Math.max(1.2, k))
  })
  useMotionValueEvent(pullInLocal, 'change', (v) => pullIn.set(v))
  useEffect(() => pullIn.set(pullInLocal.get()), [pullIn, pullInLocal])
  const glide = useTransform(() => {
    const [f, z, d] = [pullInLocal.get(), camera.z.get(), distance.get()]
    return (d / z) * f
  })
  // Positive offsets move scenery screen-right: the train travels screen-left.
  const farX = useTransform(() => {
    const [c, r, g] = [cruise.get(), run.get(), glide.get()]
    return tile(c * 40 + (r + g) * 0.15)
  })
  const nearX = useTransform(() => {
    const [c, r, g] = [cruise.get(), run.get(), glide.get()]
    return tile(c * 900 + r + g)
  })

  // Noon to golden hour, then the sun sets as the platform comes into view;
  // the warm tint and the sun patches on the benches go with it.
  const golden = useTransform(scrollYProgress, goldenSpan, [0, 1])
  const dusk = useTransform(scrollYProgress, duskSpan, [0, 1])
  const daylight = useDaylight(golden, dusk)
  const patch = useTransform(golden, [0.3, 1], [0, 0.55])
  const warmth = useTransform(golden, [0, 1], [0, 0.28])
  const tint = useTransform(() => warmth.get() * (1 - dusk.get()))
  const sunPatches = useTransform(() => patch.get() * (1 - dusk.get()))
  const glass = useTransform(handoff, glassFade, [1, 0])
  // Not drawn until the hand-off starts, nor once the platform has taken
  // over: it sits beneath the crossing, and painting both scenes'
  // full-screen layers at once runs browsers out of GPU tile memory
  // (rectangles of the scene go missing or stale). Both values are read
  // before comparing: function-form useTransform only tracks values it saw
  // being read, and `&&` skipped `arrival` while `handoff` was 0.
  const live = useTransform(() => {
    const [h, a] = [handoff.get(), arrival.get()]
    return h > 0 && a < 1
  })
  const shown = useTransform(live, (l) => (l ? 'visible' : 'hidden'))
  // and its CSS animations pause meanwhile (`--pr-play`)
  const play = useTransform(live, (l) => (l ? 'running' : 'paused'))
  // hard paper shadows while the window zoom or the arrival rush moves the camera
  const paperBlur = usePaperBlur(zoom, arrival)

  return (
    <MotionConfig reducedMotion="user">
      {/*
       * Pulled up by one screen so its scroll range starts at the crossing's
       * end. The views are fixed rather than sticky, so they sit exactly
       * beneath the crossing's through the hand-off (`scene-kit/handoff.ts`):
       * a sticky view slid down as soon as the page scrolled above the
       * section, which flashed a strip of blank page as the rush back out
       * began. No z-index on the section, so its two views stack on their
       * own: the outside beneath the platform scene's view (earlier in the
       * page, same level), the interior (`z-5`) above it.
       */}
      <section
        ref={track}
        aria-label="Inside the train"
        className="relative mt-[calc(var(--screen)*-1)]"
        style={{ height: `calc(var(--screen) * ${trackScreens})` }}
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

        {/*
         * The view through the windows, beneath the platform scene's view, so
         * the station pulls in in front of the same sea. It follows the
         * window zoom but not the arrival rush: once the platform stands in
         * the window, the outside is behind it and stays with it.
         */}
        <motion.div
          aria-hidden
          className="pointer-events-none fixed top-0 h-(--view-h) w-full overflow-hidden"
          style={
            { backgroundColor: palette.cloud, visibility: shown, '--pr-play': play } as MotionStyle
          }
        >
          <motion.div
            className="absolute inset-0 origin-top-left"
            style={{ x: camera.x, y: camera.y, scale: camera.z }}
          >
            <ParallaxLayer pointer={pOutside} depth={4}>
              <OutsideFar daylight={daylight} x={farX} />
            </ParallaxLayer>
            <ParallaxLayer pointer={pOutside} depth={10}>
              <OutsideNear daylight={daylight} x={nearX} />
              <Stations run={run} />
            </ParallaxLayer>
          </motion.div>
        </motion.div>
        <motion.div
          ref={view}
          className="fixed top-0 z-5 h-(--view-h) w-full overflow-hidden"
          style={
            { visibility: shown, '--pr-play': play, '--pr-paper-blur': paperBlur } as MotionStyle
          }
        >
          <motion.div
            ref={rushView}
            className="absolute inset-0 origin-top-left"
            style={{ x: rushCamera.x, y: rushCamera.y, scale: rushCamera.z }}
          >
            <motion.div
              className="absolute inset-0 origin-top-left"
              style={{ x: camera.x, y: camera.y, scale: camera.z }}
            >
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
          </motion.div>
          {/* outside the camera: the book is held, not zoomed */}
          <ParallaxLayer pointer={pointer} depth={40}>
            <Book progress={scrollYProgress} />
          </ParallaxLayer>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-multiply"
            style={{ backgroundColor: palette.goldTint, opacity: tint }}
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
