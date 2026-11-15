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
 * speed: no stops, so each sign slides through the window and on. The run
 * goes on past the last sign (`runOn` screens of open sea), then the
 * platform pulls in (`pullIn`) with the scenery outside still passing: it
 * takes over at the run's speed and brakes with its name board in the
 * window. Meanwhile the light goes on from golden hour to dusk.
 */
const runOn = 1
/** The screen where the last sign is centred. */
const signAt = zoomAt[1] + stops[stops.length - 1].run / runPerScreen
/**
 * Long enough that the pull-in, starting at the run's speed, only ever
 * slows down (`pullIn` in `index.tsx`) on every screen shape.
 */
const pullInScreens = 4
const pullInAt = [signAt + runOn, signAt + runOn + pullInScreens]
const runAt = [zoomAt[1], pullInAt[0]]
/** The station run's end, where the pull-in takes over. */
export const runEnd = (runAt[1] - runAt[0]) * runPerScreen
// the train stands still briefly before the rush plays at the end
const total = pullInAt[1] + 0.3
const goldenAt = [0.65, signAt]
/** The sun sets as the platform comes into view. */
const duskAt = [signAt + 0.2, pullInAt[0] + 0.9]

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
/** The station run, from 0 to `runEnd`; the pull-in starts where it ends, at the same speed. */
export const stationRun = span(runAt)
/** The platform rolls into the windows and brakes (`pullIn` 0 → 1). */
export const pullInSpan = span(pullInAt)
/** Noon to golden hour. */
export const goldenSpan = span(goldenAt)
/** Golden hour to dusk: starts after `goldenSpan` ends, so the two never overlap. */
export const duskSpan = span(duskAt)
