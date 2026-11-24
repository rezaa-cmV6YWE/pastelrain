import { useLenis } from 'lenis/react'
import {
  animate,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'motion/react'
import { useEffect, type RefObject } from 'react'

import { rush } from './handoff'
import { trackScrollY } from './track'

/** The target's box in the view, before the rush transform. */
type Aim = { x: number; y: number; w: number; h: number; vw: number; vh: number }

/** Extra zoom past "the target exactly covers the screen", so its frame stays out of view under parallax. */
const coverMargin = 1.1

/**
 * A played (not scrubbed) hand-off between two scenes (`./handoff.ts`), once
 * the scroll reaches the end of `track`:
 * - locks scrolling, snaps to the exact end, and animates `value` 0 → 1;
 * - returns a top-left-origin transform for the view's direct child that
 *   zooms into `target()` until it covers the screen (exponential, so the
 *   rush feels even; the target pans to the centre as it grows).
 * Scrolling back above the end plays it in reverse. A jump far past the end
 * or back (a reload partway down, a jump to the top) sets it without playing.
 *
 * The target is measured once per play (and on resize while the rush is past
 * 0), never per frame: the scenes' CSS animations dirty style every frame, so
 * a layout read each frame forced a full style and layout pass. `onMeasure`
 * runs after each measurement, for measuring of the caller's own.
 *
 * `target` and `onMeasure` MUST be stable (`useCallback`): a new function
 * re-runs the effect, which stops a playing rush on every render.
 */
export function useRush({
  view,
  track,
  screens,
  progress,
  value,
  calm,
  target,
  onMeasure,
}: {
  /** The fixed view; the rush transform's element is its direct child. */
  view: RefObject<HTMLElement | null>
  /** The scene's scroll section; the rush plays at its end. */
  track: RefObject<HTMLElement | null>
  /** Its length in screens (`./track`). */
  screens: number
  /** That section's progress (`useTrackProgress`). */
  progress: MotionValue<number>
  /** The hand-off value it animates 0 ↔ 1. */
  value: MotionValue<number>
  calm: boolean
  /** The element to rush into. */
  target: () => Element | null
  onMeasure?: () => void
}) {
  const aim = useMotionValue<Aim | null>(null)

  const shot = () => {
    // Read every motion value before the early return: function-form
    // useTransform only tracks the values it saw being read.
    const r = value.get()
    const a = aim.get()
    if (!a || r === 0) return { z: 1, x: 0, y: 0 }
    const zMax = Math.max(a.vw / a.w, a.vh / a.h) * coverMargin
    const z = zMax ** r
    const t = zMax === 1 ? 0 : (z - 1) / (zMax - 1)
    const [cx, cy] = [a.x + a.w / 2, a.y + a.h / 2]
    const [tx, ty] = [cx + (a.vw / 2 - cx) * t, cy + (a.vh / 2 - cy) * t]
    return { z, x: tx - z * cx, y: ty - z * cy }
  }
  const z = useTransform(() => shot().z)
  const x = useTransform(() => shot().x)
  const y = useTransform(() => shot().y)

  const lenis = useLenis()
  useEffect(() => {
    // The target, measured in the view with the rush transform undone.
    const measure = () => {
      const box = view.current?.getBoundingClientRect()
      const el = target()
      if (!box || !el) return
      const r = el.getBoundingClientRect()
      aim.set({
        x: (r.left - box.left - x.get()) / z.get(),
        y: (r.top - box.top - y.get()) / z.get(),
        w: r.width / z.get(),
        h: r.height / z.get(),
        vw: box.width,
        vh: box.height,
      })
      onMeasure?.()
    }
    // where progress reaches 1 (`./track`)
    const endY = () => {
      const el = track.current
      return el ? trackScrollY(el, screens, 1) : 0
    }

    let playing: AnimationPlaybackControls | null = null
    const play = (to: 0 | 1) => {
      measure()
      if (to === 1) lenis?.scrollTo(endY(), { immediate: true, force: true })
      lenis?.stop()
      const flight = animate(value, to, calm ? { duration: 0 } : rush)
      playing = flight
      void flight.finished.then(() => {
        playing = null
        lenis?.start()
      })
    }
    const unsubscribe = progress.on('change', (p) => {
      if (playing) return
      // How far past the end the page is, in screens: small when scrolled
      // there, large after a jump (which sets the state without the show).
      const el = track.current
      const screen = el ? el.offsetHeight / screens : window.innerHeight
      const past = (window.scrollY - endY()) / screen
      if (p >= 1 && value.get() < 1) {
        if (past > 0.5) value.set(1)
        else play(1)
      } else if (p < 1 && value.get() > 0) {
        if (past < -0.5) value.set(0)
        else play(0)
      }
    })
    // Where the page already is when this starts (a restored scroll position
    // can land before the first change event): set the state, no show.
    if (!playing) value.set(progress.get() >= 1 ? 1 : 0)

    // A resize while zoomed in (or partway) re-aims at the new layout.
    const el = view.current
    const observer = new ResizeObserver(() => value.get() > 0 && measure())
    if (el) observer.observe(el)

    return () => {
      unsubscribe()
      observer.disconnect()
      playing?.stop()
      if (playing) lenis?.start()
    }
  }, [view, track, screens, progress, value, calm, target, onMeasure, lenis, aim, x, y, z])

  return { x, y, z }
}
