import { useTransform, type MotionValue } from 'motion/react'

import { mixOklab } from '#/components/scene-kit/color'
import { palette } from '#/components/scene-kit/palette'

/** Outside colours (and the sun's height) for the current time of day. */
export type Daylight = {
  sky: MotionValue<string>
  skyHaze: MotionValue<string>
  cloud: MotionValue<string>
  cloudShade: MotionValue<string>
  sea: MotionValue<string>
  seaBright: MotionValue<string>
  seaDeep: MotionValue<string>
  sun: MotionValue<string>
  sunY: MotionValue<number>
}

/**
 * Noon → golden hour blends, in OKLab. The sky, haze and bright sea band pass
 * through a pale, sunlit cream on the way (`palette.afternoon*`): a direct
 * blend from blue to gold goes grey halfway, and turning round the hue wheel
 * instead goes pink or green.
 */
const tones = {
  sky: mixOklab([palette.sky, palette.afternoonSky, palette.goldSky]),
  skyHaze: mixOklab([palette.skyHaze, palette.afternoonHaze, palette.goldSkyHaze]),
  cloud: mixOklab([palette.cloud, palette.goldCloud]),
  cloudShade: mixOklab([palette.cloudShade, palette.goldCloudShade]),
  sea: mixOklab([palette.sea, palette.goldSea]),
  seaBright: mixOklab([palette.seaBright, palette.afternoonGlare, palette.goldSeaBright]),
  seaDeep: mixOklab([palette.seaDeep, palette.goldSeaDeep]),
  sun: mixOklab([palette.foam, palette.sun]),
}

/**
 * The outside colours as the afternoon passes: `golden` runs 0 (noon) → 1
 * (golden hour). The sun sinks from above the window band into view.
 */
export function useDaylight(golden: MotionValue<number>): Daylight {
  return {
    sky: useTransform(golden, tones.sky),
    skyHaze: useTransform(golden, tones.skyHaze),
    cloud: useTransform(golden, tones.cloud),
    cloudShade: useTransform(golden, tones.cloudShade),
    sea: useTransform(golden, tones.sea),
    seaBright: useTransform(golden, tones.seaBright),
    seaDeep: useTransform(golden, tones.seaDeep),
    sun: useTransform(golden, tones.sun),
    sunY: useTransform(golden, [0, 1], [150, 330]),
  }
}
