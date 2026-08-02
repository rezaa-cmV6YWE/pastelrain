import { useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect } from 'react'

export function useParallax(depth: number): {
  x: MotionValue<number>
  y: MotionValue<number>
} {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const sx = useSpring(mx, { stiffness: 40, damping: 20 })
  const sy = useSpring(my, { stiffness: 40, damping: 20 })

  const x = useTransform(sx, (v) => v * depth * 140)
  const y = useTransform(sy, (v) => v * depth * 140)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mql.matches) return

    const onMouse = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }

    const onOrientation = (e: DeviceOrientationEvent) => {
      const beta = Math.max(-30, Math.min(30, e.beta ?? 0))
      const gamma = Math.max(-30, Math.min(30, e.gamma ?? 0))
      mx.set(gamma / 60)
      my.set(beta / 60)
    }

    window.addEventListener('mousemove', onMouse)
    window.addEventListener('deviceorientation', onOrientation)

    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('deviceorientation', onOrientation)
    }
  }, [mx, my])

  return { x, y }
}
