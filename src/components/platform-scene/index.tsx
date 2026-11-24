import { useLenis } from 'lenis/react'
import {
  motion,
  MotionConfig,
  useMotionValueEvent,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from 'motion/react'
import { useRef, useState } from 'react'

import { Fireworks } from '#/components/beach-scene/fireworks'
import { Dunes, Headland, Shore } from '#/components/beach-scene/shore'
import {
  beyondGate,
  fireworksStart,
  pullBackSpan,
  throughSpan,
} from '#/components/beach-scene/timeline'
import { CameraMarks, useSceneCamera, usePaperBlur, type Shot } from '#/components/scene-kit/camera'
import { skyReveal } from '#/components/scene-kit/handoff'
import { palette } from '#/components/scene-kit/palette'
import { ParallaxLayer, usePointerParallax } from '#/components/scene-kit/parallax'
import { trackScrollY, useTrackProgress } from '#/components/scene-kit/track'

import { PlatformForeground } from './foreground'
import { usePullInDistance } from './layout'
import { Phone } from './phone'
import { PlatformFloor } from './props'
import { DuskSky } from './sky'
import { StationWall } from './station'
import type { Walk } from './strip'
import { gateOpen, gateZoom, trackScreens, walkAt } from './timeline'

/**
 * The zoom through the ticket gate. The walk ends with the gate's opening
 * centred on the screen (`layout.ts`), so the zoom is about that fixed
 * point, from the start (`from` = `to`), ending on the sea through it.
 */
const gateShot: Shot = {
  from: { x: 800, y: 470 },
  to: { x: 800, y: 470 },
  cover: { w: 240, h: 240 },
  margin: 1.1,
}

/**
 * Scene 3: a station platform at dusk, seen first-person facing the station
 * wall. It first shows through the train's windows: it pulls in from the
 * left in front of the sea the train has been passing (the train scene's
 * outside, beneath this view), braking with the station-name board in the
 * centre window (`pullIn`, driven by the train scene's scroll); the train
 * scene then rushes through that window onto it (`arrival`,
 * `scene-kit/handoff.ts`), and this scene's own dusk sky takes over from the
 * train's on the way (`skyReveal`). Here you pull out a phone whose feed of
 * project cards (`./projects`) scrolls with the page, put it away, and walk
 * to the ticket gate; the camera then goes through the gate as its paddles
 * open, ending on the dusk sea. Past the gate the camera pushes on into the
 * sea and pulls back onto the beach at night (`shore`, the beach scene's
 * scroll), with the platform's layers giving way to the beach's. Timings:
 * `./timeline` and `beach-scene/timeline`; positions: `./layout`.
 */
export function PlatformScene({
  pullIn,
  arrival,
  shore,
}: {
  pullIn: MotionValue<number>
  arrival: MotionValue<number>
  shore: MotionValue<number>
}) {
  const track = useRef<HTMLElement>(null)
  const view = useRef<HTMLDivElement>(null)
  const scrollYProgress = useTrackProgress(track, trackScreens)
  const gate = useTransform(scrollYProgress, gateZoom, [0, 1])
  // Past the gate: on into the sea, then back out to 1× over the beach.
  const beyond = useTransform(
    shore,
    [throughSpan[0], throughSpan[1], pullBackSpan[1]],
    [0, beyondGate, -1],
  )
  const zoom = useTransform(() => {
    const [g, b] = [gate.get(), beyond.get()]
    return Math.max(0, g + b)
  })
  const camera = useSceneCamera(zoom, view, gateShot)
  const distance = usePullInDistance(view)
  const walk: Walk = {
    // The pull-in: `pullIn` is the share of the way in (the train scene
    // eases it so it brakes with the train's scenery); the strips move
    // screen-right and stop with the name board in front of the camera.
    // Both values are read before computing.
    at: useTransform(() => {
      const [rolled, s, d] = [pullIn.get(), scrollYProgress.get(), distance.get()]
      return d * (1 - rolled) + walkAt(s)
    }),
    // `auto` from the gate zoom on, through the beach: a will-change layer
    // zoomed stays drawn at its largest scale.
    willChange: useTransform(() => {
      const [g, s] = [gate.get(), shore.get()]
      return g > 0 || s > 0 ? 'auto' : 'transform'
    }),
  }
  const open = useTransform(scrollYProgress, gateOpen, [0, 1])

  // As in the other scenes: the sway is divided by the zoom so it stays the
  // same size on screen.
  const pointer = usePointerParallax()
  const p = {
    x: useTransform(() => pointer.x.get() / camera.z.get()),
    y: useTransform(() => pointer.y.get() / camera.z.get()),
  }

  // Not drawn, and its CSS animations paused, until the pull-in starts: it
  // sits beneath the train scene.
  const visibility = useTransform(pullIn, (v) => (v > 0 ? 'visible' : 'hidden'))
  const play = useTransform(pullIn, (v) => (v > 0 ? 'running' : 'paused'))
  // hard paper shadows while the gate zoom or the beach's push and pull-back move the camera
  const paperBlur = usePaperBlur(
    gate,
    useTransform(shore, [throughSpan[0], pullBackSpan[1]], [0, 1]),
  )
  // the beach: dusk turns to night as the camera pulls back
  const night = useTransform(shore, pullBackSpan, [0, 1])
  // At the push's deepest, only sky and sea fill the frame: there the
  // platform's planes give way to the beach's, unseen.
  const onBeach = useTransform(shore, (s): 'visible' | 'hidden' =>
    s >= throughSpan[1] ? 'visible' : 'hidden',
  )
  const onPlatform = useTransform(shore, (s): 'visible' | 'hidden' =>
    s >= throughSpan[1] ? 'hidden' : 'visible',
  )
  // The fireworks are time-based: mounted once lit, so they start with the
  // first rocket. `shore` is set on mount by the beach scene (after this
  // subscribes), so a restored scroll lights them too.
  const [lit, setLit] = useState(false)
  useMotionValueEvent(shore, 'change', (v) => setLit(v >= fireworksStart))
  // Until the arrival, the sky and sea are the train scene's outside, seen
  // beneath this view; this scene's own sky takes over during the rush,
  // while the carriage hides most of it, and the backdrop once it's done.
  const skyOpacity = useTransform(arrival, skyReveal, [0, 1])
  const skyShown = useTransform(arrival, (a): 'visible' | 'hidden' =>
    a > 0 ? 'visible' : 'hidden',
  )
  const backdrop = useTransform(arrival, (a) => (a >= 1 ? palette.duskSkyTop : 'transparent'))

  const lenis = useLenis()
  // Scrolls the page to scroll progress `v` through this section.
  const scrollTo = (v: number) => {
    const el = track.current
    if (!el) return
    const y = trackScrollY(el, trackScreens, v)
    if (lenis) lenis.scrollTo(y, { duration: 1 })
    else window.scrollTo({ top: y })
  }

  return (
    <MotionConfig reducedMotion="user">
      {/*
       * Pulled up by one screen so its scroll range starts at the train
       * scene's end. No z-index: its fixed view stacks above the train's
       * outside and beneath its interior (`z-5`), which shows it through the
       * windows.
       */}
      <section
        ref={track}
        aria-label="Station platform at dusk"
        className="relative mt-[calc(var(--screen)*-1)]"
        style={{ height: `calc(var(--screen) * ${trackScreens})` }}
      >
        <h2 className="sr-only">Projects</h2>
        <motion.div
          ref={view}
          className="fixed top-0 h-(--view-h) w-full overflow-clip"
          style={
            {
              backgroundColor: backdrop,
              visibility,
              '--pr-play': play,
              '--pr-paper-blur': paperBlur,
            } as MotionStyle
          }
        >
          {/* pointer-events-none: the full-screen planes don't swallow clicks; the phone takes them */}
          <motion.div
            className="pointer-events-none absolute inset-0 origin-top-left"
            style={{ x: camera.x, y: camera.y, scale: camera.z }}
          >
            <motion.div className="absolute inset-0" style={{ opacity: skyOpacity }}>
              <ParallaxLayer pointer={p} depth={3} visibility={skyShown}>
                <DuskSky walk={walk} night={night} />
              </ParallaxLayer>
            </motion.div>
            <ParallaxLayer pointer={p} depth={5} visibility={onBeach}>
              <Headland />
            </ParallaxLayer>
            <ParallaxLayer pointer={p} depth={6} visibility={onBeach}>
              {lit && <Fireworks />}
            </ParallaxLayer>
            <ParallaxLayer pointer={p} depth={10} visibility={onPlatform}>
              <StationWall walk={walk} />
            </ParallaxLayer>
            <ParallaxLayer pointer={p} depth={18} visibility={onPlatform}>
              <PlatformFloor walk={walk} open={open} />
            </ParallaxLayer>
            <ParallaxLayer pointer={p} depth={30} visibility={onPlatform}>
              <PlatformForeground walk={walk} />
            </ParallaxLayer>
            <ParallaxLayer pointer={p} depth={18} visibility={onBeach}>
              <Shore night={night} />
            </ParallaxLayer>
            <ParallaxLayer pointer={p} depth={30} visibility={onBeach}>
              <Dunes />
            </ParallaxLayer>
            <CameraMarks shot={gateShot} marks={camera.marks} />
          </motion.div>
          {/* outside the camera: the phone is held, not zoomed */}
          <ParallaxLayer pointer={pointer} depth={40}>
            <Phone progress={scrollYProgress} onScrollTo={scrollTo} />
          </ParallaxLayer>
        </motion.div>
      </section>
    </MotionConfig>
  )
}
