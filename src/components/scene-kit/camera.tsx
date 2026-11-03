import { useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useRef, type RefObject } from 'react'

import { SceneSvg } from './scene-svg'

export type Point = { x: number; y: number }
/**
 * A camera move in viewBox units: the zoom starts on `from` and ends on `to`,
 * at the zoom where a `cover`-sized box fills the viewport, times `margin`
 * (extra zoom so no edge shows). With `keep`, the zoom stops short of that if
 * it would crop the `keep` size around `to`: on screens whose shape differs
 * from `cover`'s, what matters stays in frame.
 */
export type Shot = {
  from: Point
  to: Point
  cover: { w: number; h: number }
  margin: number
  keep?: { w: number; h: number }
}
type Measure = { from: Point; to: Point; unit: number; vw: number; vh: number }

/**
 * Invisible viewBox points used to find where the shot's start and end focus
 * land on screen. Render inside the scene wrapper, in a box with the same
 * overscan as the parallax layers but no parallax of its own.
 */
export function CameraMarks({
  shot,
  marks,
}: {
  shot: Shot
  marks: RefObject<(SVGCircleElement | null)[]>
}) {
  const points = [shot.from, shot.to, { x: shot.from.x + 100, y: shot.from.y }]
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
 * Scroll-driven camera zoom. `progress` is the zoom's own 0–1 progress (the
 * caller maps its slice of the scroll onto it). Zooms at a constant perceived
 * rate (exponential in `progress`) from 1× to the zoom at which the shot's
 * `cover` box fills the viewport, while panning the focus from `shot.from` to
 * `shot.to`. Returns a top-left-origin translate and scale for the camera
 * element; all positions are measured from the markers, so the camera follows
 * whatever framing CSS gives the scene (landscape slice or a portrait box).
 *
 * `view` is the camera element's parent box. It may itself be moved or
 * scaled by an outer transform (the crossing's rush into the window):
 * measurements are taken in its own untransformed space, so a resize while
 * it is transformed still re-measures correctly.
 */
export function useSceneCamera(
  progress: MotionValue<number>,
  view: RefObject<HTMLElement | null>,
  shot: Shot,
) {
  const marks = useRef<(SVGCircleElement | null)[]>([])
  const measure = useMotionValue<Measure | null>(null)

  const frame = () => {
    // Read every motion value on every call: function-form useTransform only
    // tracks the values it saw being read.
    const p = progress.get()
    const m = measure.get()
    if (!m) return { z: 1, x: 0, y: 0 }
    const cover = Math.max(
      (m.vh / (shot.cover.h * m.unit)) * shot.margin,
      (m.vw / (shot.cover.w * m.unit)) * shot.margin,
    )
    const keep = shot.keep
      ? Math.min(m.vh / (shot.keep.h * m.unit), m.vw / (shot.keep.w * m.unit))
      : Infinity
    const zMax = Math.max(1, Math.min(cover, keep))
    const z = zMax ** p
    const t = zMax === 1 ? 0 : (z - 1) / (zMax - 1)
    const focus = { x: lerp(m.from.x, m.to.x, t), y: lerp(m.from.y, m.to.y, t) }
    const target = { x: lerp(m.from.x, m.vw / 2, t), y: lerp(m.from.y, m.vh / 2, t) }
    return { z, x: target.x - z * focus.x, y: target.y - z * focus.y }
  }
  const z = useTransform(() => frame().z)
  const x = useTransform(() => frame().x)
  const y = useTransform(() => frame().y)

  useEffect(() => {
    const el = view.current
    if (!el) return
    const update = () => {
      // The view's layout size, and how its on-screen box is scaled and
      // moved by any outer transform, which is undone along with the camera's.
      const [vw, vh] = [el.offsetWidth, el.offsetHeight]
      const box = el.getBoundingClientRect()
      const outer = box.width / vw || 1
      const local = (i: number): Point => {
        const r = marks.current[i]?.getBoundingClientRect()
        if (!r) return { x: 0, y: 0 }
        return {
          x: ((r.left + r.width / 2 - box.left) / outer - x.get()) / z.get(),
          y: ((r.top + r.height / 2 - box.top) / outer - y.get()) / z.get(),
        }
      }
      const from = local(0)
      measure.set({ from, to: local(1), unit: (local(2).x - from.x) / 100, vw, vh })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [view, measure, x, y, z])

  return { marks, z, x, y }
}
