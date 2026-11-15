import { useMotionValue, type MotionValue } from 'motion/react'
import { useEffect } from 'react'

/*
 * Where things stand along the platform, in viewBox units. The platform is
 * longer than the screen: the walk (`walk`, from 0 to `walkMax`) slides it
 * screen-left, so the thing at `nameX + walk` is in front of the camera.
 */

/** The station-name board's centre: in front of the camera on arrival. */
export const nameX = 800
/**
 * The ticket-gate opening's centre: close enough that the exit's sign and
 * gate show at the right edge of the arrival frame in landscape.
 */
export const gateX = nameX + 700
/** The opening through the wall: `gateX` ± `half`, from `top` down to the floor. */
export const opening = { half: 120, top: 330 } as const
/** The wall's foot, where the platform floor starts. */
export const wallFoot = 720
/** The walk ends with the gate where the name board started. */
export const walkMax = gateX - nameX
/** The wall and floor strips' extent: past the frame at either end of the walk. */
export const wallStart = -300
export const wallEnd = gateX + 1100
/**
 * How far along the platform the walk starts while the train pulls in: just
 * far enough that the whole platform (to `wallEnd`, plus a margin for the
 * parallax overscan) starts off-screen to the left of the frame. The stage
 * is a bottom-centred cover mapping (`SceneSvg`), so a narrow screen sees
 * less around x 800 and the platform needs less of a run-up; a shorter
 * pull-in brakes more gently (`train-scene/index.tsx`). Measured on the
 * client, so SSR renders the widest case.
 */
export function usePullInDistance(): MotionValue<number> {
  const distance = useMotionValue(wallEnd + 100)
  useEffect(() => {
    const measure = () => {
      const [w, h] = [window.innerWidth, window.innerHeight]
      const scale = Math.max(w / 1600, h / 900)
      distance.set(wallEnd + 100 - (800 - w / 2 / scale))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [distance])
  return distance
}
