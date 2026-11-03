import { useLenis } from 'lenis/react'
import {
  animate,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'motion/react'
import { useEffect, type RefObject } from 'react'

import { glareFade, rush } from '#/components/scene-kit/handoff'
import { roughVertices } from '#/components/scene-kit/rough'

/** The target window's box in the view, before the rush transform. */
type Aim = { x: number; y: number; w: number; h: number; vw: number; vh: number }

/** Extra zoom past "the window exactly covers the screen", so its frame stays out of view under parallax. */
const coverMargin = 1.1

/**
 * The crossing → train hand-off (`scene-kit/handoff.ts`), played once the
 * crossing's scroll reaches its end:
 * - locks scrolling, snaps to the exact end, and animates `handoff` 0 → 1;
 * - returns a top-left-origin transform that zooms the view into the window
 *   nearest the screen centre until it covers the screen (exponential, so
 *   the rush feels even; the window pans to the centre as it grows);
 * - returns `clip`, which cuts the window glass (`[data-glass]`) out of
 *   `plane`, the parallax plane holding the train, so the train scene pinned
 *   beneath shows through. Every other plane is hidden behind the train while
 *   it plays, so only this one needs the cut. Each hole is its pane's exact
 *   rough outline, so when the glass opens the navy pane gives way to the
 *   navy veil behind it in the same shape and nothing on screen moves (a
 *   bounding-box hole made the window's outline jump). The stopped train
 *   doesn't move within its plane, so the holes are measured once, when the
 *   rush starts (or the screen resizes), in the plane's own px: the zoom and
 *   the parallax then carry them along with no per-frame layout reads, which
 *   had forced a style and layout pass every frame of the rush.
 * Scrolling back above the end plays it in reverse. A jump far past the end
 * or back (a reload partway down, a jump to the top) sets it without playing.
 */
export function useWindowRush({
  view,
  plane,
  track,
  progress,
  handoff,
  calm,
}: {
  view: RefObject<HTMLElement | null>
  plane: RefObject<HTMLElement | null>
  track: RefObject<HTMLElement | null>
  progress: MotionValue<number>
  handoff: MotionValue<number>
  calm: boolean
}) {
  const aim = useMotionValue<Aim | null>(null)
  /** Path data: `plane`'s box with every pane as an evenodd hole. */
  const holes = useMotionValue('')

  const shot = () => {
    // Read every motion value before the early return: function-form
    // useTransform only tracks the values it saw being read.
    const r = handoff.get()
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
  // Once the reflections have faded, the glass is open.
  const clip = useTransform(() => {
    const r = handoff.get()
    const d = holes.get()
    return d && r >= glareFade[1] && r < 1 ? `path(evenodd, '${d}')` : 'none'
  })

  const lenis = useLenis()
  useEffect(() => {
    // The window nearest the screen centre, measured in the view with the
    // rush transform undone, and every pane as a hole in the plane.
    const measure = () => {
      const el = view.current
      const layer = plane.current
      if (!el || !layer) return
      const box = el.getBoundingClientRect()
      const local = (r: DOMRect) => ({
        x: (r.left - box.left - x.get()) / z.get(),
        y: (r.top - box.top - y.get()) / z.get(),
        w: r.width / z.get(),
        h: r.height / z.get(),
      })
      // a pixel past each edge: offsetWidth/Height are rounded
      let d = `M-1 -1H${layer.offsetWidth + 1}V${layer.offsetHeight + 1}H-1Z`
      let best: Aim | null = null
      let bestDistance = Infinity
      for (const glass of layer.querySelectorAll<SVGGraphicsElement>('[data-glass]')) {
        // Each pane's scene SVG fills the plane, so the pane's CTM (its
        // groups, the train's offset, the viewBox) maps it into plane px.
        const m = glass.getCTM()
        const outline = glass.getAttribute('d')
        if (m && outline) {
          for (const points of roughVertices(outline)) {
            d += `M${points
              .map(
                ([u, v]) =>
                  `${(m.a * u + m.c * v + m.e).toFixed(2)} ${(m.b * u + m.d * v + m.f).toFixed(2)}`,
              )
              .join('L')}Z`
          }
        }
        const r = local(glass.getBoundingClientRect())
        const distance = Math.hypot(r.x + r.w / 2 - box.width / 2, r.y + r.h / 2 - box.height / 2)
        if (distance < bestDistance) {
          bestDistance = distance
          best = { ...r, vw: box.width, vh: box.height }
        }
      }
      aim.set(best)
      holes.set(d)
    }
    const endY = () => {
      const el = track.current
      return el ? el.getBoundingClientRect().bottom + window.scrollY - window.innerHeight : 0
    }

    let playing: AnimationPlaybackControls | null = null
    const play = (to: 0 | 1) => {
      measure()
      if (to === 1) lenis?.scrollTo(endY(), { immediate: true, force: true })
      lenis?.stop()
      const flight = animate(handoff, to, calm ? { duration: 0 } : rush)
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
      const past = (window.scrollY - endY()) / window.innerHeight
      if (p >= 1 && handoff.get() < 1) {
        if (past > 0.5) handoff.set(1)
        else play(1)
      } else if (p < 1 && handoff.get() > 0) {
        if (past < -0.5) handoff.set(0)
        else play(0)
      }
    })
    // Where the page already is when this starts (a restored scroll position
    // can land before the first change event): set the state, no show.
    if (!playing) handoff.set(progress.get() >= 1 ? 1 : 0)

    // A resize while zoomed in (or partway) re-aims at the new layout.
    const el = view.current
    const observer = new ResizeObserver(() => handoff.get() > 0 && measure())
    if (el) observer.observe(el)

    return () => {
      unsubscribe()
      observer.disconnect()
      playing?.stop()
      if (playing) lenis?.start()
    }
  }, [view, plane, track, progress, handoff, calm, lenis, aim, holes, x, y, z])

  return { x, y, z, clip }
}
