import { cn } from 'cn'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { createContext, use, type ReactNode } from 'react'

import { SceneHtml } from '#/components/scene-kit/scene-svg'

type Extent = { x0: number; width: number }

/**
 * The walk along the platform: `at` runs 0 → `walkMax` (`layout.ts`).
 * `willChange` is `transform` while the gate camera is at 1× and `auto`
 * once it zooms: as their own layers the strips slide without the paper art
 * being redrawn, but Chromium keeps a will-change layer drawn at the
 * largest scale it has been zoomed to, so they must not keep it through
 * the zoom (they don't move then anyway). On iOS (`.pr-walk` in
 * `src/styles.css`) they never get it.
 */
export type Walk = { at: MotionValue<number>; willChange: MotionValue<'transform' | 'auto'> }

const StripContext = createContext<Extent>({ x0: 0, width: 1600 })

/**
 * A strip of the platform longer than the screen, from `x0` for `width`
 * viewBox units, slid screen-left by `walk.at × speed` (nearer strips move
 * faster). It is laid out on the scene's 1600×900 stage (`SceneHtml`, the
 * same mapping as `SceneSvg`) and moved as a whole by a transform on its own
 * layer (`Walk`), so the paper art in it is never redrawn as it moves. Draw
 * in it with `StripSvg`.
 */
export function Strip({
  walk,
  speed,
  x0,
  width,
  children,
}: Extent & { walk: Walk; speed: number; children: ReactNode }) {
  const x = useTransform(walk.at, (w) => `${((-w * speed) / width) * 100}%`)
  return (
    <SceneHtml>
      <motion.div
        className="pr-walk absolute top-0 h-full"
        style={{ left: `${x0 / 16}%`, width: `${width / 16}%`, x, willChange: walk.willChange }}
      >
        <StripContext value={{ x0, width }}>{children}</StripContext>
      </motion.div>
    </SceneHtml>
  )
}

/** An SVG covering the strip, in its viewBox units; `paper` adds the `pr-paper` shadow. */
export function StripSvg({ paper = true, children }: { paper?: boolean; children: ReactNode }) {
  const { x0, width } = use(StripContext)
  return (
    <svg
      viewBox={`${x0} 0 ${width} 900`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn('absolute inset-0 size-full', paper && 'pr-paper')}
    >
      {children}
    </svg>
  )
}
