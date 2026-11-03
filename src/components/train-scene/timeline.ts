import { stops } from './stations'
import { pages } from './story'

/*
 * The train scene's scroll timeline. Moments are laid out in screens of
 * scroll (1 = 100svh) from the scene's start, then exported as fractions of
 * the section's scroll distance for `useScroll`. Ranges are [start, end].
 * The section's height follows from the total (`trackScreens`), so changing
 * a length here (or adding a page) keeps every other part's pace. It starts
 * once the crossing's rush into the window has handed over
 * (`scene-kit/handoff.ts`), with the interior in full view.
 */

/** Scroll spent on each spread (its chapter page, then its prose page). */
const pageScreens = 0.6
/**
 * Scroll a page turn takes, at the end of each single page's half of
 * `pageScreens`: the leaf follows the scroll, so scrolling back turns it back.
 */
const turnScreens = 0.2
/** How far the station run moves (viewBox units) per screen of scroll. */
const runPerScreen = 800

const riseAt = [0.5, 1.2]
const openAt = [1.2, 1.7]
const pagesAt = openAt[1]
const pagesEnd = pagesAt + pages.length * pageScreens
const closeAt = [pagesEnd, pagesEnd + 0.5]
const lowerAt = [closeAt[1], closeAt[1] + 0.65]
const zoomAt = [lowerAt[1] - 0.25, lowerAt[1] + 1.05]
const stopAt = [zoomAt[1] - 0.5, zoomAt[1]]
/**
 * After the zoom, scroll drives the train past the stations at one steady
 * speed: no stops, so each sign slides through the window and on. It ends
 * with the last sign centred.
 */
const runAt = [zoomAt[1], zoomAt[1] + stops[stops.length - 1].run / runPerScreen]
const total = runAt[1]
const goldenAt = [0.65, total - 0.65]

const at = (screens: number) => screens / total
const span = ([start, end]: number[]) => [at(start), at(end)]

/** The section's height in screens: its scroll distance plus the pinned screen. */
export const trackScreens = total + 1

/** The book rises into view, then the cover opens. */
export const bookRise = span(riseAt)
export const bookOpen = span(openAt)
/** One scroll step per spread; each page turn takes the last `turnSpan` of a page. */
export const pagesStart = at(pagesAt)
export const pageSpan = at(pageScreens)
export const turnSpan = at(turnScreens)
/** The cover closes, then the book lowers out of view. */
export const bookClose = span(closeAt)
export const bookLower = span(lowerAt)
/** The camera zooms into the centre window. */
export const zoomSpan = span(zoomAt)
/** The train slows from cruising to a stop, ready for the stations. */
export const cruiseStop = span(stopAt)
/** The station run, from 0 to the last stop's `run`. */
export const stationRun = span(runAt)
/** Noon to golden hour. */
export const goldenSpan = span(goldenAt)
