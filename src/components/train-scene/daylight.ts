import { useTransform, type MotionValue } from 'motion/react'

import { mixOklab } from '#/components/scene-kit/color'
import { palette } from '#/components/scene-kit/palette'

/** Outside colours (and the sun's height) for the current time of day. */
export type Daylight = {
  /** the sky's gradient, top to the horizon: one flat colour until dusk */
  skyTop: MotionValue<string>
  skyMid: MotionValue<string>
  skyHorizon: MotionValue<string>
  skyHaze: MotionValue<string>
  cloud: MotionValue<string>
  cloudShade: MotionValue<string>
  /** the clouds' offset back sheets */
  cloudBack: MotionValue<string>
  sea: MotionValue<string>
  seaBright: MotionValue<string>
  seaDeep: MotionValue<string>
  sun: MotionValue<string>
  sunY: MotionValue<number>
  shore: MotionValue<string>
}

/**
 * Each tone: its noon → golden-hour stops, then its dusk colour. The sky,
 * haze and bright sea band pass through a pale, sunlit cream on the way to
 * gold (`palette.afternoon*`): a direct blend from blue to gold goes grey
 * halfway, and turning round the hue wheel instead goes pink or green. Dusk
 * is the platform scene's sky (`palette.dusk*`), so the station pulls in
 * under the same sky the train has been passing.
 */
const daySky = [palette.sky, palette.afternoonSky, palette.goldSky]
const dayHaze = [palette.skyHaze, palette.afternoonHaze, palette.goldSkyHaze]
const tones = {
  skyTop: [daySky, palette.duskSkyTop],
  skyMid: [daySky, palette.duskSkyMid],
  skyHorizon: [daySky, palette.duskHorizon],
  skyHaze: [dayHaze, palette.duskHorizon],
  cloud: [[palette.cloud, palette.goldCloud], palette.duskCloud],
  cloudShade: [[palette.cloudShade, palette.goldCloudShade], palette.duskCloudShade],
  cloudBack: [dayHaze, palette.duskCloudShade],
  sea: [[palette.sea, palette.goldSea], palette.duskSea],
  seaBright: [[palette.seaBright, palette.afternoonGlare, palette.goldSeaBright], palette.duskSea],
  seaDeep: [[palette.seaDeep, palette.goldSeaDeep], palette.duskSkyTop],
  sun: [[palette.foam, palette.sun], palette.duskSun],
  shore: [[palette.grassShade, palette.grassShade], palette.duskSand],
} as const

/**
 * The outside colours as the afternoon passes: `golden` runs 0 (noon) → 1
 * (golden hour), then `dusk` 0 → 1 (sunset). They never overlap (`dusk`
 * starts once `golden` is 1), so each tone is one blend or the other. The
 * sun sinks from above the window band into view, then to the horizon.
 */
export function useDaylight(golden: MotionValue<number>, dusk: MotionValue<number>): Daylight {
  const tone = ([day, night]: readonly [readonly string[], string]) => {
    const toGold = mixOklab(day)
    const toDusk = mixOklab([day[day.length - 1], night])
    // both read before choosing: a function-form transform only follows what it read
    return () => {
      const [g, d] = [golden.get(), dusk.get()]
      return d > 0 ? toDusk(d) : toGold(g)
    }
  }
  return {
    skyTop: useTransform(tone(tones.skyTop)),
    skyMid: useTransform(tone(tones.skyMid)),
    skyHorizon: useTransform(tone(tones.skyHorizon)),
    skyHaze: useTransform(tone(tones.skyHaze)),
    cloud: useTransform(tone(tones.cloud)),
    cloudShade: useTransform(tone(tones.cloudShade)),
    cloudBack: useTransform(tone(tones.cloudBack)),
    sea: useTransform(tone(tones.sea)),
    seaBright: useTransform(tone(tones.seaBright)),
    seaDeep: useTransform(tone(tones.seaDeep)),
    sun: useTransform(tone(tones.sun)),
    sunY: useTransform(() => {
      const [g, d] = [golden.get(), dusk.get()]
      return 150 + 180 * g + 140 * d
    }),
    shore: useTransform(tone(tones.shore)),
  }
}
