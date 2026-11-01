import { useLenis } from 'lenis/react'
import {
  animate,
  motion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { CameraMarks, useCrossingCamera } from './camera'
import { Clouds } from './clouds'
import { Crossing } from './crossing'
import { Foreground, Ground } from './foreground'
import { Land } from './land'
import { Narration } from './narration'
import { palette } from './palette'
import { ParallaxLayer, usePointerParallax } from './parallax'
import { PaperGrain, SceneDefs } from './scene-svg'
import { Sea } from './sea'
import { Sky } from './sky'
import { Title } from './title'
import { Train, train } from './train'

/**
 * Scroll timeline, as fractions of the section's scroll distance: the title
 * fades out first; the train sweeps in from the right at
 * `trainEnter` and keeps running at a steady speed to the end, so it is still
 * moving as the camera zooms in from `zoomStart` until the train fills the
 * screen (a window bay is on the camera's focus at the very end).
 */
const titleFadeEnd = 0.08
const trainEnter = 0.2
const zoomStart = 0.65
/** Train offset when it enters (nose just past the right edge) and at the end of the scroll. */
const trainStart = 1750
const trainEnd = 785 - train.focusWindowX

/**
 * Opening crane shot on page load: the camera starts tilted up at the sky and
 * lowers onto the crossing, each layer settling at its own parallax rate
 * (see `ParallaxLayer`'s `intro`). The title is revealed once it lands.
 */
const introDescent = { delay: 0.3, duration: 3.2, ease: [0.5, 0, 0.15, 1] as const }

export function CrossingScene() {
  const track = useRef<HTMLElement>(null)
  const view = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const zoom = useTransform(scrollYProgress, [zoomStart, 1], [0, 1])
  const camera = useCrossingCamera(zoom, view)

  // Pointer/touch parallax stays live for the whole scene. Layer offsets sit
  // inside the camera, so the zoom would magnify them; dividing by the zoom
  // keeps the on-screen sway the same size from first frame to last.
  const pointer = usePointerParallax()
  const p = {
    x: useTransform(() => pointer.x.get() / camera.z.get()),
    y: useTransform(() => pointer.y.get() / camera.z.get()),
  }
  const titleOpacity = useTransform(scrollYProgress, [0, titleFadeEnd], [1, 0])
  const trainX = useTransform(scrollYProgress, [trainEnter, 1], [trainStart, trainEnd])

  // 1 = looking at the sky, 0 = resting framing. Starts at 1 on the server too,
  // so the first paint is already the sky shot.
  const intro = useMotionValue(1)
  const [landed, setLanded] = useState(false)
  const calm = useReducedMotion() === true
  useEffect(() => {
    let live = true
    const descent = animate(intro, 0, calm ? { duration: 0 } : introDescent)
    descent.then(() => live && setLanded(true))
    // A reload partway down restores the scroll position after mount (scroll
    // is held, but programmatic restoration still lands): cut straight to the
    // resting framing instead of craning down mid-story.
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
      {/* tall scroll track; the scene stays pinned while it scrolls past */}
      <section ref={track} aria-label="Seaside railway crossing" className="relative h-[500svh]">
        <div
          ref={view}
          className="sticky top-0 h-svh w-full overflow-hidden"
          style={{ backgroundColor: palette.sky }}
        >
          <SceneDefs />
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
              <ParallaxLayer pointer={p} intro={intro} depth={0}>
                <Sky />
              </ParallaxLayer>
              <ParallaxLayer pointer={p} intro={intro} depth={8}>
                {/*
                 * Tall phones: grow the clouds about the horizon (y=560 of 900)
                 * so the cumulus towers into the empty sky; their bases stay
                 * behind the sea.
                 */}
                <div className="absolute inset-0 origin-[50%_62.2%] [@media(max-aspect-ratio:3/5)]:scale-[2.4]">
                  <Clouds />
                </div>
              </ParallaxLayer>
              <ParallaxLayer pointer={p} intro={intro} depth={14}>
                <Sea />
              </ParallaxLayer>
              <ParallaxLayer pointer={p} intro={intro} depth={20}>
                <Land />
              </ParallaxLayer>
              <ParallaxLayer pointer={p} intro={intro} depth={28}>
                <Ground />
                <Crossing track={<Train x={trainX} />} />
              </ParallaxLayer>
              <ParallaxLayer pointer={p} intro={intro} depth={40}>
                <Foreground />
              </ParallaxLayer>
              <CameraMarks marks={camera.marks} />
            </div>
            {/* pinned to the sky: zooms away with the scene */}
            <Narration progress={scrollYProgress} />
          </motion.div>
          {/* outside the camera so it stays put and fades rather than zooms */}
          <motion.div className="absolute inset-0" style={{ opacity: titleOpacity }}>
            <ParallaxLayer pointer={p} depth={6}>
              <Title show={landed} />
            </ParallaxLayer>
          </motion.div>
          <PaperGrain />
        </div>
      </section>
    </MotionConfig>
  )
}
