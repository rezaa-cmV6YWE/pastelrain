import { useScroll, useTransform, type MotionValue } from 'motion/react'
import type { RefObject } from 'react'

/*
 * Scroll progress through a scene's track, worked out from the track alone.
 * Each track is `screens` screens (`--screen`, `./screen.ts`) tall and
 * pinned for its last screen, so it scrolls `screens − 1` screens.
 * `useScroll`'s usual `end end` offset measures against the window's height
 * instead, and on phones that follows the browser's toolbar: as it hid on
 * scrolling down and came back on scrolling up, every scene's progress
 * jumped (zooms, the train's run, the walk). `--screen` keeps still.
 */

/** 0 → 1 as the page scrolls through `track`, a `screens`-screen track. */
export function useTrackProgress(
  track: RefObject<HTMLElement | null>,
  screens: number,
): MotionValue<number> {
  // `end start` (the track's bottom at the window's top) doesn't involve the
  // window's height: progress over the track's whole height, rescaled
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end start'] })
  return useTransform(scrollYProgress, (v) => Math.min(1, (v * screens) / (screens - 1)))
}

/** The page's scroll position at which `el`'s progress (as above) is `progress`. */
export function trackScrollY(el: HTMLElement, screens: number, progress: number) {
  const top = el.getBoundingClientRect().top + window.scrollY
  return top + (progress * el.offsetHeight * (screens - 1)) / screens
}
