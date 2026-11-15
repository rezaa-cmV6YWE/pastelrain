import { useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { useCallback, type RefObject } from 'react'

import { glareFade } from '#/components/scene-kit/handoff'
import { roughVertices } from '#/components/scene-kit/rough'
import { useRush } from '#/components/scene-kit/rush'

/**
 * The crossing → train hand-off (`scene-kit/handoff.ts`), played once the
 * crossing's scroll reaches its end (`scene-kit/rush.ts`):
 * - locks scrolling, snaps to the exact end, and animates `handoff` 0 → 1;
 * - returns a top-left-origin transform that zooms the view into the window
 *   nearest the screen centre until it covers the screen;
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
  /** Path data: `plane`'s box with every pane as an evenodd hole. */
  const holes = useMotionValue('')
  // Once the reflections have faded, the glass is open.
  const clip = useTransform(() => {
    const r = handoff.get()
    const d = holes.get()
    return d && r >= glareFade[1] && r < 1 ? `path(evenodd, '${d}')` : 'none'
  })

  // The window nearest the screen centre.
  const target = useCallback(() => {
    const box = view.current?.getBoundingClientRect()
    const layer = plane.current
    if (!box || !layer) return null
    let best: Element | null = null
    let bestDistance = Infinity
    for (const glass of layer.querySelectorAll('[data-glass]')) {
      const r = glass.getBoundingClientRect()
      const distance = Math.hypot(
        r.left + r.width / 2 - (box.left + box.width / 2),
        r.top + r.height / 2 - (box.top + box.height / 2),
      )
      if (distance < bestDistance) {
        bestDistance = distance
        best = glass
      }
    }
    return best
  }, [view, plane])

  // Every pane as a hole in the plane.
  const measureHoles = useCallback(() => {
    const layer = plane.current
    if (!layer) return
    // a pixel past each edge: offsetWidth/Height are rounded
    let d = `M-1 -1H${layer.offsetWidth + 1}V${layer.offsetHeight + 1}H-1Z`
    for (const glass of layer.querySelectorAll<SVGGraphicsElement>('[data-glass]')) {
      // Each pane's scene SVG fills the plane, so the pane's CTM (its
      // groups, the train's offset, the viewBox) maps it into plane px.
      const m = glass.getCTM()
      const outline = glass.getAttribute('d')
      if (!m || !outline) continue
      for (const points of roughVertices(outline)) {
        d += `M${points
          .map(
            ([u, v]) =>
              `${(m.a * u + m.c * v + m.e).toFixed(2)} ${(m.b * u + m.d * v + m.f).toFixed(2)}`,
          )
          .join('L')}Z`
      }
    }
    holes.set(d)
  }, [plane, holes])

  const camera = useRush({
    view,
    track,
    progress,
    value: handoff,
    calm,
    target,
    onMeasure: measureHoles,
  })
  return { ...camera, clip }
}
