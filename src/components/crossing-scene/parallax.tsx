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

export function ParallaxLayer({
  pointer,
  depth,
  children,
}: {
  pointer: PointerParallax
  depth: number
  children: ReactNode
}) {
  const x = useTransform(pointer.x, [-1, 1], [depth, -depth])
  const y = useTransform(pointer.y, [-1, 1], [depth * 0.4, -depth * 0.4])

  return (
    <motion.div
      data-depth={depth}
      className="absolute -inset-12 will-change-transform"
      style={{ x, y }}
    >
      {children}
    </motion.div>
  )
}
