import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useEffect, type ReactNode } from 'react'

export type PointerParallax = { x: MotionValue<number>; y: MotionValue<number> }

const spring = { stiffness: 50, damping: 20, mass: 1 }

/**
 * Normalised parallax input in [-1, 1]. A mouse or pen moves the scene while
 * hovering; a finger moves it while touching and lets it spring back to centre
 * on release. Touch listeners are passive, so they never block scrolling.
 */
export function usePointerParallax(): PointerParallax {
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, spring)
  const y = useSpring(rawY, spring)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return

    const follow = (clientX: number, clientY: number) => {
      rawX.set((clientX / window.innerWidth) * 2 - 1)
      rawY.set((clientY / window.innerHeight) * 2 - 1)
    }
    const reset = () => {
      rawX.set(0)
      rawY.set(0)
    }
    // Touch drives the scene through the touch events below; touch pointer
    // events would be cancelled as soon as the browser starts panning.
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') follow(e.clientX, e.clientY)
    }
    const onTouch = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) follow(touch.clientX, touch.clientY)
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) reset()
    }
    const root = document.documentElement
    const passive = { passive: true }

    window.addEventListener('pointermove', onPointer)
    window.addEventListener('touchstart', onTouch, passive)
    window.addEventListener('touchmove', onTouch, passive)
    window.addEventListener('touchend', onTouchEnd, passive)
    window.addEventListener('touchcancel', onTouchEnd, passive)
    window.addEventListener('blur', reset)
    root.addEventListener('mouseleave', reset)
    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('blur', reset)
      root.removeEventListener('mouseleave', reset)
    }
  }, [reduceMotion, rawX, rawY])

  return { x, y }
}

/** Deepest layer depth in the scene; the intro drop is scaled against it. */
const maxDepth = 40

/**
 * One depth plane of the scene. `pointer` shifts it by up to `depth` px.
 * `intro` (1 → 0) is the opening crane shot: at 1 the camera is tilted up at
 * the sky, so every plane is pushed down, near ones further than far ones
 * (from 25% of the layer's height at depth 0 to 100% at the deepest), and
 * they settle at different speeds as it runs to 0. `visibility` can stop a
 * plane being drawn while something else covers it: each plane is a
 * full-screen GPU layer, and drawing covered ones still costs tile memory.
 *
 * No `will-change: transform`. Chromium keeps a will-change layer drawn at the
 * largest scale it has been zoomed to, and never lowers it: after the cameras
 * zoom in (the crossing's zoom, the rush into the window) and back out, every
 * plane stayed drawn at ~3× its size, so the page held ~8× the tile memory
 * (over the GPU budget on a large window, where whole parts of the scene,
 * like the gates, went undrawn and flickered) and scrolling up ran at half
 * speed. The planes stay on their own layers without it.
 */
export function ParallaxLayer({
  pointer,
  depth,
  intro,
  visibility,
  children,
}: {
  pointer: PointerParallax
  depth: number
  intro?: MotionValue<number>
  visibility?: MotionValue<'visible' | 'hidden'>
  children: ReactNode
}) {
  const x = useTransform(pointer.x, [-1, 1], [depth, -depth])
  const y = useTransform(pointer.y, [-1, 1], [depth * 0.4, -depth * 0.4])
  const still = useMotionValue(0)
  const drop = 25 + 75 * (depth / maxDepth)
  const introY = useTransform(intro ?? still, [0, 1], ['0%', `${drop}%`])

  return (
    <motion.div data-depth={depth} className="absolute -inset-12" style={{ x, y, visibility }}>
      <motion.div className="absolute inset-0" style={{ y: introY }}>
        {children}
      </motion.div>
    </motion.div>
  )
}
