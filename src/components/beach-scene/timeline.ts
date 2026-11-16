/*
 * The beach scene's scroll timeline, in screens (1 = 100svh) as in the other
 * scenes. It starts where the platform's scroll ends, with the gate's opening
 * filling the screen. The camera (the platform view's, `platform-scene`) first
 * pushes on past the gate into the sea, then pulls back to 1× as dusk turns to
 * night, revealing the beach; then the fireworks with the closing line, and
 * the contacts.
 */
/** How far past the gate shot's cover zoom the camera pushes (camera progress units). */
export const beyondGate = 0.35
const throughAt = [0, 0.6]
const pullBackAt = [0.6, 2.4]
const fireworksAt = 2.1
const contactsAt = 2.4
const total = 3.6

const at = (screens: number) => screens / total
const span = ([start, end]: number[]) => [at(start), at(end)]

/** The section's height in screens: its scroll distance plus the pinned screen. */
export const trackScreens = total + 1
/** The camera pushes past the gate; at its end the platform's layers give way to the beach's. */
export const throughSpan = span(throughAt)
/** The camera pulls back to 1× while dusk turns to night. */
export const pullBackSpan = span(pullBackAt)
/** The fireworks start (mounted, so they begin with the first rocket). */
export const fireworksStart = at(fireworksAt)
/** The closing line in the sky is revealed with the fireworks. */
export const closingStart = fireworksStart
/** The contacts fade in. */
export const contactsStart = at(contactsAt)
