import { useEffect } from 'react'

/*
 * The page's two screen heights, as CSS custom properties on <html> (their
 * SSR fallbacks are in `src/styles.css`):
 * - `--screen`: one screen of scroll and of layout (track heights, the book,
 *   the phone, the title's spot), the viewport with a phone's toolbar
 *   showing (`100svh`).
 * - `--view-h`: the scenes' fixed views, tall enough for the viewport with
 *   the toolbar hidden (`100lvh`), so no strip below them is left blank.
 * On a phone both stay put as the toolbar collapses and comes back: only a
 * new width (turning it) measures them again. `svh`/`lvh` already do that in
 * Safari and Chrome, but browsers built on an iOS web view (Arc) resize the
 * whole web view with their toolbar, so there every viewport unit changes
 * with it and the scenes rescaled on each toggle; there `--view-h` grows to
 * the tallest viewport seen and never shrinks, so it changes once at most.
 * With a mouse every resize measures them again.
 */

/** The px height of a fixed box `height` tall (0 where the unit isn't supported). */
function probe(height: string) {
  const el = document.createElement('div')
  el.style.cssText = `position:fixed;top:0;visibility:hidden;pointer-events:none;height:${height}`
  document.body.append(el)
  const px = el.offsetHeight
  el.remove()
  return px
}

/** Keeps `--screen` and `--view-h` (above) on <html>. Call once, in the page. */
export function useStableScreen() {
  useEffect(() => {
    const root = document.documentElement
    const fine = window.matchMedia('(pointer: fine)')
    let width = -1
    let view = 0
    const update = () => {
      if (window.innerWidth !== width || fine.matches) {
        width = window.innerWidth
        view = 0
        root.style.setProperty('--screen', `${probe('100svh') || window.innerHeight}px`)
      }
      view = Math.max(view, probe('100lvh'), window.innerHeight)
      root.style.setProperty('--view-h', `${view}px`)
    }
    update()
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      root.style.removeProperty('--screen')
      root.style.removeProperty('--view-h')
    }
  }, [])
}
