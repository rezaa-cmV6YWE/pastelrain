/*
 * The crossing → train hand-off. The crossing's train brakes to a stop with a
 * window in front of the camera; reaching the end of the crossing's scroll
 * then plays (it is not scrubbed by scroll) a rush zoom into that window until
 * it covers the screen. Through the window, the glass clears to show the
 * train scene pinned beneath, so when the window fills the screen the train
 * scene is all that shows. Scrolling back up plays it in reverse.
 *
 * `handoff` (0 → 1) is one motion value both scenes share, created by the
 * route. Times below are in its units.
 *
 * A second hand-off, `arrival` (train → platform), reuses `rush`: at the end
 * of the train scene the camera rushes into the train's centre window onto
 * the platform. That platform already stands in the window: past the last
 * sign the light set to dusk and the platform pulled in in front of the
 * train's passing sea (`train-scene/timeline.ts`, `pullIn`).
 */

/** The rush: slow to start, fast through the middle, easing into the glass. */
export const rush = { duration: 1.4, ease: [0.7, 0, 0.3, 1] as const }

/**
 * The glass's reflection stripes fade first, since the train scene seen
 * through the openings starts as plain navy glass (its glass veil).
 */
export const glareFade = [0, 0.12]

/** Then the train scene's navy glass veil fades, showing the interior. */
export const glassFade = [0.2, 0.7]

/**
 * The range of `arrival` over which the platform scene's own dusk sky takes
 * over from the train's outside, seen through the gaps in the platform
 * (the gate, above the roof): the middle of the rush, while the carriage
 * covers most of the frame. Both are the same dusk colours.
 */
export const skyReveal = [0.25, 0.75]
