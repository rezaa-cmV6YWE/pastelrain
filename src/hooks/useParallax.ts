import { useMotionValue, useSpring, useTransform } from 'motion/react'
import { useEffect } from 'react'

import type { MotionValue } from 'motion/react'

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

    const onTouch = (e: TouchEvent) => {
      const touch = e.touches[0]
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!touch) return
      mx.set(touch.clientX / window.innerWidth - 0.5)
      my.set(touch.clientY / window.innerHeight - 0.5)
    }

    const onOrientation = (e: DeviceOrientationEvent) => {
      const beta = Math.max(-30, Math.min(30, e.beta ?? 0))
      const gamma = Math.max(-30, Math.min(30, e.gamma ?? 0))
      mx.set(gamma / 60)
      my.set(beta / 60)
    }

    const requestOrientation = () => {
      const DOE = window.DeviceOrientationEvent as
        | (typeof window.DeviceOrientationEvent & {
            requestPermission?: () => Promise<'granted' | 'denied' | 'default'>
          })
        | undefined

      if (typeof DOE?.requestPermission === 'function') {
        DOE.requestPermission().then((state) => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', onOrientation)
          }
        })
        return
      }

      window.addEventListener('deviceorientation', onOrientation)
    }

    const onFirstGesture = () => {
      requestOrientation()
      window.removeEventListener('touchstart', onFirstGesture)
      window.removeEventListener('click', onFirstGesture)
    }

    window.addEventListener('mousemove', onMouse)
    window.addEventListener('touchmove', onTouch)
    window.addEventListener('touchstart', onFirstGesture, { passive: true })
    window.addEventListener('click', onFirstGesture)

    // Non-iOS devices can start orientation immediately; iOS will wait for the
    // first user gesture through onFirstGesture.
    const DOE = window.DeviceOrientationEvent as
      | (typeof window.DeviceOrientationEvent & {
          requestPermission?: () => Promise<'granted' | 'denied' | 'default'>
        })
      | undefined
    if (typeof DOE?.requestPermission !== 'function') {
      window.addEventListener('deviceorientation', onOrientation)
    }

    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('deviceorientation', onOrientation)
      window.removeEventListener('touchstart', onFirstGesture)
      window.removeEventListener('click', onFirstGesture)
    }
  }, [mx, my])

  return { x, y }
}
