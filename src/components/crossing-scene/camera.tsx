import { useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useRef, type RefObject } from 'react'

import { SceneSvg } from './scene-svg'
import { train } from './train'

/** Where the zoom starts: the middle of the crossing, on the track. */
const crossingFocus = { x: 785, y: 650 }
/** Where it ends: the middle of the train body, over a window bay. */
const trainFocus = { x: 785, y: (train.bodyTop + train.bodyBottom) / 2 }
/** Extra zoom past "train body exactly fills the screen", so no edge shows. */
const coverMargin = 1.12

type Point = { x: number; y: number }
type Measure = { cross: Point; finish: Point; unit: number; vw: number; vh: number }

/**
 * Invisible viewBox points used to find where the crossing and train focus land
 * on screen. Render inside the scene wrapper, in a box with the same overscan
 * as the parallax layers but no parallax of its own.
 */
export function CameraMarks({ marks }: { marks: RefObject<(SVGCircleElement | null)[]> }) {
  const points = [crossingFocus, trainFocus, { x: crossingFocus.x + 100, y: crossingFocus.y }]
  return (
    <div className="pointer-events-none absolute -inset-12" aria-hidden="true">
      <SceneSvg paper={false}>
        {points.map((p, i) => (
          <circle
            key={i}
            ref={(el) => {
              marks.current[i] = el
            }}
            cx={p.x}
            cy={p.y}
            r={1}
            fill="none"
          />
        ))}
      </SceneSvg>
    </div>
  )
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Scroll-driven camera for the crossing → train transition. `progress` is the
 * zoom's own 0–1 progress (the caller maps its slice of the scroll onto it).
 * Zooms at a constant perceived rate (exponential in `progress`) from 1× to
 * the zoom at which the train body covers the viewport, while panning the
 * focus from the crossing to the centre of the train. Returns a
 * top-left-origin translate and scale for the camera element; all positions
 * are measured from the markers, so the camera follows whatever framing CSS
 * gives the scene (landscape slice or the portrait bottom-anchored box).
 */
export function useCrossingCamera(
  progress: MotionValue<number>,
  view: RefObject<HTMLElement | null>,
) {
  const marks = useRef<(SVGCircleElement | null)[]>([])
  const measure = useMotionValue<Measure | null>(null)

  const frame = () => {
    // Read every motion value on every call: function-form useTransform only
    // tracks the values it saw being read.
    const p = progress.get()
    const m = measure.get()
    if (!m) return { z: 1, x: 0, y: 0 }
    const zMax = Math.max(
      1,
      (m.vh / ((train.bodyBottom - train.bodyTop) * m.unit)) * coverMargin,
      (m.vw / (train.carLength * m.unit)) * coverMargin,
    )
    const z = zMax ** p
    const t = zMax === 1 ? 0 : (z - 1) / (zMax - 1)
    const focus = { x: lerp(m.cross.x, m.finish.x, t), y: lerp(m.cross.y, m.finish.y, t) }
    const target = { x: lerp(m.cross.x, m.vw / 2, t), y: lerp(m.cross.y, m.vh / 2, t) }
    return { z, x: target.x - z * focus.x, y: target.y - z * focus.y }
  }
  const z = useTransform(() => frame().z)
  const x = useTransform(() => frame().x)
  const y = useTransform(() => frame().y)

  useEffect(() => {
    const el = view.current
    if (!el) return
    const update = () => {
      const box = el.getBoundingClientRect()
      // Undo the camera's current transform so measurements are in its local space.
      const local = (i: number): Point => {
        const r = marks.current[i]?.getBoundingClientRect()
        if (!r) return { x: 0, y: 0 }
        return {
          x: (r.left + r.width / 2 - box.left - x.get()) / z.get(),
          y: (r.top + r.height / 2 - box.top - y.get()) / z.get(),
        }
      }
      const cross = local(0)
      measure.set({
        cross,
        finish: local(1),
        unit: (local(2).x - cross.x) / 100,
        vw: box.width,
        vh: box.height,
      })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [view, measure, x, y, z])

  return { marks, z, x, y }
}
