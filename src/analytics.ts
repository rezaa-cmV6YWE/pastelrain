import type { MotionValue } from 'motion/react'
import { useEffect } from 'react'

/*
 * Umami Cloud (cookieless, no consent banner). The tracker is loaded in
 * production only (`__root.tsx`) and only counts on `domains`, so `pnpm
 * preview` on localhost records nothing. Clicks are tracked with
 * `data-umami-event` attributes on the links; scroll milestones, which no
 * click marks, go through `track`.
 */

export const umami = {
  src: 'https://cloud.umami.is/script.js',
  websiteId: '60ce5d60-d6c9-4c19-a7ed-482509c53cf6',
  domains: 'pastelrain.com,www.pastelrain.com',
}

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string | number>) => void }
  }
}

/**
 * Sends a custom event. The tracker is deferred, so an event raised before it
 * runs (a restored scroll lands past a milestone on load) waits for the
 * page's `load`; if it is still missing then (blocked, or dev), it is dropped.
 */
export function track(event: string, data?: Record<string, string | number>) {
  if (window.umami) {
    window.umami.track(event, data)
  } else if (document.readyState !== 'complete') {
    window.addEventListener('load', () => window.umami?.track(event, data), { once: true })
  }
}

/**
 * Sends `event` once per page load, the first time `value` reaches `at`
 * (also if it already has on mount, for a restored scroll).
 */
export function useMilestone(event: string, value: MotionValue<number>, at: number) {
  useEffect(() => {
    if (value.get() >= at) {
      track(event)
      return
    }
    let sent = false
    const stop = value.on('change', (v) => {
      if (sent || v < at) return
      sent = true
      track(event)
      // not now: Motion would skip the next subscriber of the change being sent
      queueMicrotask(stop)
    })
    return stop
  }, [event, value, at])
}
