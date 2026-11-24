import { easeInOut } from 'motion/react'

import { walkMax } from './layout'
import { projects } from './projects'

/*
 * The platform scene's scroll timeline. As in the train scene, moments are
 * laid out in screens of scroll (1 = one `--screen`) from the scene's start, then
 * exported as fractions of the section's scroll distance (`useTrackProgress`).
 * It starts once the train's rush through the window has handed over
 * (`scene-kit/handoff.ts`), facing the station-name board. After a moment to
 * settle the phone comes up, its feed scrolls with the page, one
 * `feedPerProject` per project (so adding a project lengthens the track and
 * keeps the pace), the phone goes away, and the walk takes you to the ticket
 * gate and through it.
 */

/**
 * Scroll per project while the phone's feed scrolls: about a card's height,
 * so the feed moves nearly as far as the page scrolls.
 */
const feedPerProject = 0.4

/** The phone comes up. */
const riseAt = [0.35, 1.05]
const feedStart = riseAt[1] + 0.15
const feedAt = [feedStart, feedStart + feedPerProject * Math.max(1, projects.length)]
/** The phone goes away. */
const lowerAt = [feedAt[1] + 0.2, feedAt[1] + 0.85]
/** The walk to the gate, starting as the phone leaves the screen. */
const exitAt = [lowerAt[1] - 0.15, lowerAt[1] + 1.1]
/** The zoom through the gate starts as the walk brings it to the centre. */
const zoomAt = [exitAt[1] - 0.15, exitAt[1] + 1.45]
const openAt = [zoomAt[0] + 0.35, zoomAt[0] + 0.85]
const total = zoomAt[1] + 0.3

const at = (screens: number) => screens / total
const span = ([start, end]: number[]) => [at(start), at(end)]

/** The walk (0 → `walkMax`) at scroll progress `progress`. */
export function walkAt(progress: number) {
  const t = (progress * total - exitAt[0]) / (exitAt[1] - exitAt[0])
  return walkMax * easeInOut(Math.min(1, Math.max(0, t)))
}

/** The section's height in screens: its scroll distance plus the pinned screen. */
export const trackScreens = total + 1
/** The phone comes up, then goes away. */
export const phoneRise = span(riseAt)
export const phoneLower = span(lowerAt)
/** The phone's feed scrolls from its top to its end. */
export const feedSpan = span(feedAt)
/** The zoom through the gate, and its paddles opening on the way. */
export const gateZoom = span(zoomAt)
export const gateOpen = span(openAt)
