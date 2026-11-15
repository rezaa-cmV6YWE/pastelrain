import { useLenis } from 'lenis/react'
import {
  animate,
  motion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { CameraMarks, useSceneCamera, usePaperBlur, type Shot } from '#/components/scene-kit/camera'
import { glareFade } from '#/components/scene-kit/handoff'
import { palette } from '#/components/scene-kit/palette'
import { ParallaxLayer, usePointerParallax } from '#/components/scene-kit/parallax'

import { Clouds } from './clouds'
import { Crossing } from './crossing'
import { Foreground, Ground } from './foreground'
import { Land } from './land'
import { Narration } from './narration'
import { Sea } from './sea'
import { Sky } from './sky'
import { Title } from './title'
import { Train, train } from './train'
import { useWindowRush } from './window-rush'

/**
 * Scroll timeline, as fractions of the section's scroll distance: the title
 * fades out first; the train sweeps in from the right at `trainEnter`, runs
 * at a steady speed, then brakes from `brakeAt` to a stop at `trainStop` with
 * a window in front of the camera, which zooms in from `zoomStart` until the
 * train body fills the screen. Reaching the end plays the rush into that
 * window (`./window-rush`).
 */
const titleFadeEnd = 0.08
const trainEnter = 0.2
const brakeAt = 0.72
const trainStop = 0.9
const zoomStart = 0.65
/** Train offset when it enters (nose just past the right edge) and where it stops. */
const trainStart = 1750
const trainEnd = 785 - train.focusWindowX
/**
 * Where braking starts: the braking (an ease-out-quad, so even deceleration)
 * covers `brakeSpan / (2 × cruiseSpan)` of the cruising distance, so the
 * speed doesn't jump when the brakes go on.
 */
const trainBrake =
  trainStart + (trainEnd - trainStart) / (1 + (trainStop - brakeAt) / (2 * (brakeAt - trainEnter)))

/**
 * The zoom starts on the middle of the crossing, on the track, and ends on the
 * middle of the train body, over a window bay, once the body fills the screen
 * (with 12% extra so no edge shows).
 */
const crossingShot: Shot = {
  from: { x: 785, y: 650 },
  to: { x: 785, y: (train.bodyTop + train.bodyBottom) / 2 },
  cover: { w: train.carLength, h: train.bodyBottom - train.bodyTop },
  margin: 1.12,
}

/**
 * Opening crane shot on page load: the camera starts tilted up at the sky and
 * lowers onto the crossing, each layer settling at its own parallax rate
 * (see `ParallaxLayer`'s `intro`). The title is revealed once it lands.
 */
const introDescent = { delay: 0.3, duration: 3.2, ease: [0.5, 0, 0.15, 1] as const }

export function CrossingScene({ handoff }: { handoff: MotionValue<number> }) {
  const track = useRef<HTMLElement>(null)
  const view = useRef<HTMLDivElement>(null)
  // The scroll camera's parent: the rush camera, inside the pinned view. The
  // scroll camera measures in it, so a resize mid-rush re-frames correctly.
  const rushView = useRef<HTMLDivElement>(null)
  // The parallax plane holding the train, which the rush cuts the glass out of.
  const trainPlane = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const zoom = useTransform(scrollYProgress, [zoomStart, 1], [0, 1])
  const camera = useSceneCamera(zoom, rushView, crossingShot)
  const calm = useReducedMotion() === true
  // The hand-off: at the end of the scroll the camera rushes into the window
  // and the train scene shows through it (`./window-rush`).
  const rushCamera = useWindowRush({
    view,
    plane: trainPlane,
    track,
    progress: scrollYProgress,
    handoff,
    calm,
  })

  // Pointer/touch parallax stays live for the whole scene. Layer offsets sit
  // inside both cameras, so their zoom would magnify them; dividing by it
  // keeps the on-screen sway the same size from first frame to last.
  const pointer = usePointerParallax()
  const p = {
    x: useTransform(() => pointer.x.get() / (camera.z.get() * rushCamera.z.get())),
    y: useTransform(() => pointer.y.get() / (camera.z.get() * rushCamera.z.get())),
  }
  const titleOpacity = useTransform(scrollYProgress, [0, titleFadeEnd], [1, 0])
  const titleDisplay = useTransform(titleOpacity, (o) => (o > 0 ? 'block' : 'none'))
  const trainX = useTransform(
    scrollYProgress,
    [trainEnter, brakeAt, trainStop],
    [trainStart, trainBrake, trainEnd],
    { ease: [(t) => t, (t) => 1 - (1 - t) ** 2] },
  )
  const glare = useTransform(handoff, glareFade, [1, 0])
  // Once the window covers the screen, only the train scene beneath shows;
  // the hidden crossing's CSS animations pause (`--pr-play`).
  const visibility = useTransform(() => (handoff.get() >= 1 ? 'hidden' : 'visible'))
  const play = useTransform(() => (handoff.get() >= 1 ? 'paused' : 'running'))
  // hard paper shadows while the zoom or the rush moves the camera
  const paperBlur = usePaperBlur(zoom, handoff)
  // During the rush the stopped train's body fills the screen (the zoom
  // covers it with margin), so the planes around it can't be seen; not
  // drawing them saves GPU tile memory while both scenes are on screen.
  const covered = useTransform(handoff, (h): 'visible' | 'hidden' => (h > 0 ? 'hidden' : 'visible'))
  // Meanwhile the view's sky backdrop moves into the train's plane, so the
  // glass cut out of that plane opens onto the train scene, not the sky. Only
  // until the rush ends: an explicit `visible` would show through the view
  // hidden at 1.
  const rushing = useTransform(handoff, (h): 'visible' | 'hidden' =>
    h > 0 && h < 1 ? 'visible' : 'hidden',
  )
  const backdrop = useTransform(handoff, (h) => (h > 0 ? 'transparent' : palette.sky))

  // 1 = looking at the sky, 0 = resting framing. Starts at 1 on the server too,
  // so the first paint is already the sky shot.
  const intro = useMotionValue(1)
  const [landed, setLanded] = useState(false)
  useEffect(() => {
    let live = true
    const descent = animate(intro, 0, calm ? { duration: 0 } : introDescent)
    descent.then(() => live && setLanded(true))
    // A reload partway down restores the scroll position around mount (scroll
    // is held, but programmatic restoration still lands): cut straight to the
    // resting framing instead of craning down mid-story. It can land before
    // this subscribes, so check where the page already is too.
    if (scrollYProgress.get() > titleFadeEnd) descent.complete()
    const cut = scrollYProgress.on('change', (progress) => {
      if (progress > titleFadeEnd) descent.complete()
    })
    return () => {
      live = false
      descent.stop()
      cut()
    }
  }, [intro, calm, scrollYProgress])

  // No user scrolling until the camera has landed. Lenis's stopped state also
  // sets `overflow: clip` on <html>, which blocks touch and keyboard scrolling.
  const lenis = useLenis()
  useEffect(() => {
    if (!lenis || landed) return
    lenis.stop()
    return () => lenis.start()
  }, [lenis, landed])

  return (
    <MotionConfig reducedMotion="user">
      {/*
       * Tall scroll track. The view is fixed rather than sticky, so it stays
       * put through the hand-off whatever the exact scroll position (a sticky
       * view slides with the page as soon as it scrolls past the end).
       */}
      <section
        ref={track}
        aria-label="Seaside railway crossing"
        className="relative z-10 h-[500svh]"
      >
        <motion.div
          ref={view}
          className="fixed top-0 h-svh w-full overflow-hidden"
          style={
            {
              backgroundColor: backdrop,
              visibility,
              '--pr-play': play,
              '--pr-paper-blur': paperBlur,
            } as MotionStyle
          }
        >
          {/* the rush into the window, around everything that zooms or fades */}
          <motion.div
            ref={rushView}
            className="absolute inset-0 origin-top-left"
            style={{ x: rushCamera.x, y: rushCamera.y, scale: rushCamera.z }}
          >
            <motion.div
              className="absolute inset-0 origin-top-left"
              style={{ x: camera.x, y: camera.y, scale: camera.z }}
            >
              {/*
               * Portrait: frame ~820 viewBox units around both signals and gates
               * (centred near x=765), anchored to the bottom; the section's sky
               * colour fills the space above. The bottom inset leaves room for
               * the 16px vertical parallax swing.
               */}
              <div className="absolute inset-0 portrait:top-auto portrait:right-[-9vw] portrait:bottom-8 portrait:h-[min(calc(110vw-6rem),calc(100%-2rem))]">
                <ParallaxLayer pointer={p} intro={intro} depth={0} visibility={covered}>
                  <Sky />
                </ParallaxLayer>
                <ParallaxLayer pointer={p} intro={intro} depth={8} visibility={covered}>
                  {/*
                   * Tall phones: grow the clouds about the horizon (y=560 of 900)
                   * so the cumulus towers into the empty sky; their bases stay
                   * behind the sea.
                   */}
                  <div className="absolute inset-0 origin-[50%_62.2%] [@media(max-aspect-ratio:3/5)]:scale-[2.4]">
                    <Clouds />
                  </div>
                </ParallaxLayer>
                <ParallaxLayer pointer={p} intro={intro} depth={14} visibility={covered}>
                  <Sea />
                </ParallaxLayer>
                <ParallaxLayer pointer={p} intro={intro} depth={20} visibility={covered}>
                  <Land />
                </ParallaxLayer>
                <ParallaxLayer pointer={p} intro={intro} depth={28}>
                  <motion.div
                    ref={trainPlane}
                    className="absolute inset-0"
                    style={{ clipPath: rushCamera.clip }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      style={{ backgroundColor: palette.sky, visibility: rushing }}
                    />
                    <Ground />
                    <Crossing track={<Train x={trainX} glare={glare} />} />
                  </motion.div>
                </ParallaxLayer>
                <ParallaxLayer pointer={p} intro={intro} depth={40} visibility={covered}>
                  <Foreground />
                </ParallaxLayer>
                <CameraMarks shot={crossingShot} marks={camera.marks} />
              </div>
              {/* pinned to the sky: zooms away with the scene */}
              <Narration progress={scrollYProgress} />
            </motion.div>
            {/*
             * Outside the camera so it stays put and fades rather than zooms.
             * Once faded it is not rendered at all: Safari kept drawing the
             * faded title's filtered, animated letters as a stale layer ("Re:"
             * blinking over the scene, even inside the train).
             */}
            <motion.div
              className="absolute inset-0"
              style={{ opacity: titleOpacity, display: titleDisplay }}
            >
              <ParallaxLayer pointer={p} depth={6}>
                <Title show={landed} />
              </ParallaxLayer>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    </MotionConfig>
  )
}
