import { motion, useTransform, type MotionStyle, type MotionValue } from 'motion/react'
import type { CSSProperties } from 'react'

import { mixOklab } from '#/components/scene-kit/color'
import { Drifting } from '#/components/scene-kit/drifting'
import { palette } from '#/components/scene-kit/palette'
import { Circle, Path, Rect } from '#/components/scene-kit/rough'

import { nameX, walkMax } from './layout'
import { Strip, StripSvg, type Walk } from './strip'

/** The sky is far away: it slides a twelfth as fast as the platform. */
const speed = 0.08
const x0 = -300
// covers the frame along the whole walk (hidden during the pull-in: the train's outside shows instead)
const width = 1600 + speed * walkMax + 600
const horizon = 470
/** The sun ends up centred in the gate's opening, where the walk ends. */
const sunX = nameX + speed * walkMax

/** A gently wavy shoreline across the whole strip. */
const sand = `M${x0} 606 Q${x0 + 200} 596 ${x0 + 400} 606${Array.from(
  { length: Math.ceil(width / 400) },
  (_, i) => ` T${x0 + 800 + 400 * i} 606`,
).join('')} V960 H${x0} Z`

/** [cx, cy, r]: the first stars above the roof, and a few seen through the gate. */
const stars = [
  ...Array.from({ length: Math.ceil(width / 190) }, (_, i) => [
    x0 + 120 + 190 * i + ((i * 53) % 80),
    18 + ((i * 37) % 92),
    1.5 + (i % 3) * 0.5,
  ]),
  [sunX - 100, 352, 2],
  [sunX + 55, 384, 1.5],
  [sunX - 60, 418, 2],
]

/** [cx, cy, rx, ry]: the sun's path on the sea. */
const glow = [
  [sunX, 480, 44, 2.6],
  [sunX - 12, 494, 36, 2.2],
  [sunX + 10, 508, 28, 2],
  [sunX - 6, 523, 20, 1.7],
  [sunX + 6, 538, 12, 1.4],
]

/** [cx, cy, r]: the night's stars, shown as dusk turns to night. */
const nightStars = Array.from({ length: 70 }, (_, i) => [
  x0 + ((i * 197) % width),
  20 + ((i * 89) % 400),
  1 + (i % 3) * 0.5,
])

/** Dusk → night, for the beach. */
const toNight = {
  top: mixOklab([palette.duskSkyTop, palette.nightSkyTop]),
  mid: mixOklab([palette.duskSkyMid, palette.nightSkyMid]),
  horizon: mixOklab([palette.duskHorizon, palette.nightHorizon]),
  sea: mixOklab([palette.duskSea, palette.nightSea]),
  sand: mixOklab([palette.duskSand, palette.nightSand]),
}

/**
 * The sea's and the sand's colours as dusk turns to night (`night`, 0 → 1),
 * as the `--night-sea` and `--night-sand` custom properties for a wrapper's
 * style: the sky and the beach's planes (`beach-scene/shore.tsx`) share them,
 * so the shore's water and sand always match the sky's.
 */
export function useNightSeaAndSand(night: MotionValue<number>) {
  return {
    '--night-sea': useTransform(night, toNight.sea),
    '--night-sand': useTransform(night, toNight.sand),
  } as MotionStyle
}

/** Thin high streaks along the strip, alternating two shapes. */
const streaks = Array.from({ length: Math.ceil(width / 1100) }, (_, i) => {
  const x = x0 + 400 + 1100 * i
  return i % 2 === 0
    ? `M${x} 90 C${x + 60} 70 ${x + 220} 60 ${x + 320} 64 C${x + 400} 67 ${x + 480} 78 ${x + 500} 92 C${x + 400} 100 ${x + 120} 102 ${x} 90 Z`
    : `M${x} 74 C${x + 80} 58 ${x + 220} 52 ${x + 340} 56 C${x + 420} 59 ${x + 480} 68 ${x + 500} 78 C${x + 380} 88 ${x + 120} 90 ${x} 74 Z`
})

/** A thin streak of cloud: a lens of `duskCloud` over its offset shade. */
function Streak({ d }: { d: string }) {
  return (
    <>
      <g transform="translate(6 5)">
        <Path d={d} fill={palette.duskCloudShade} />
      </g>
      <Path d={d} fill={palette.duskCloud} />
    </>
  )
}

/**
 * Dusk over the sea, seen above the station roof and through the ticket
 * gate: the sky fading from night blue to the glow at the horizon, the
 * setting sun half under the sea, its path on the water, the first stars and
 * a few thin clouds. The twinkles are a separate, unfiltered SVG, so the
 * filtered paper doesn't repaint as they glint. `night` (0 → 1, the beach
 * scene) darkens the sky, sea and sand, sinks the sun, fades the clouds and
 * its path on the sea, and brings out the stars.
 */
export function DuskSky({ walk, night }: { walk: Walk; night: MotionValue<number> }) {
  const top = useTransform(night, toNight.top)
  const mid = useTransform(night, toNight.mid)
  const horizonColor = useTransform(night, toNight.horizon)
  const seaAndSand = useNightSeaAndSand(night)
  const sunDrop = useTransform(night, [0, 1], [0, 80])
  const sunFade = useTransform(night, [0, 1], [1, 0])
  const cloudFade = useTransform(night, [0, 1], [1, 0.3])
  return (
    <Strip walk={walk} speed={speed} x0={x0} width={width}>
      <motion.div className="absolute inset-0" style={seaAndSand}>
        <StripSvg>
          <linearGradient
            id="pr-dusk-sky"
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={0}
            y2={horizon}
          >
            <motion.stop offset={0} style={{ stopColor: top }} />
            <motion.stop offset={0.2} style={{ stopColor: top }} />
            <motion.stop offset={0.7} style={{ stopColor: mid }} />
            <motion.stop offset={1} style={{ stopColor: horizonColor }} />
          </linearGradient>
          <rect x={x0} y={-60} width={width} height={horizon + 60} fill="url(#pr-dusk-sky)" />
          {/* the halo, kept above the horizon; at night the sun sinks behind the sea */}
          <motion.g style={{ y: sunDrop, opacity: sunFade }}>
            <circle cx={sunX} cy={horizon} r={110} fill={palette.duskSun} opacity={0.12} />
            <circle cx={sunX} cy={horizon} r={70} fill={palette.duskSun} opacity={0.25} />
            <Circle cx={sunX} cy={horizon} r={46} fill={palette.duskSun} />
          </motion.g>
          <Rect
            x={x0}
            y={horizon}
            width={width}
            height={130}
            style={{ fill: 'var(--night-sea)' }}
          />
          <Path d={sand} style={{ fill: 'var(--night-sand)' }} />
        </StripSvg>
      </motion.div>
      <motion.div className="absolute inset-0" style={{ opacity: cloudFade }}>
        <Drifting drift="calc(var(--u) * 24)" duration="120s" delay="0s">
          <StripSvg>
            {streaks
              .filter((_, i) => i % 2 === 0)
              .map((d) => (
                <Streak key={d} d={d} />
              ))}
          </StripSvg>
        </Drifting>
        <Drifting drift="calc(var(--u) * 32)" duration="100s" delay="-40s">
          <StripSvg>
            {streaks
              .filter((_, i) => i % 2 === 1)
              .map((d) => (
                <Streak key={d} d={d} />
              ))}
            <Streak
              d={`M${sunX - 140} 404 C${sunX - 100} 392 ${sunX - 10} 386 ${sunX + 50} 390 C${sunX + 80} 393 ${sunX + 96} 398 ${sunX + 100} 404 C${sunX + 40} 412 ${sunX - 80} 412 ${sunX - 140} 404 Z`}
            />
          </StripSvg>
        </Drifting>
      </motion.div>
      <StripSvg paper={false}>
        {stars.map(([cx, cy, r], i) => (
          <circle
            key={`${cx}-${cy}`}
            className="pr-glint"
            style={
              {
                '--glint-duration': `${4 + (i % 4)}s`,
                '--glint-delay': `${-((i * 1.3) % 5)}s`,
              } as CSSProperties
            }
            cx={cx}
            cy={cy}
            r={r}
            fill={palette.foam}
          />
        ))}
        <motion.g style={{ opacity: sunFade }}>
          {glow.map(([cx, cy, rx, ry], i) => (
            <ellipse
              key={cy}
              className="pr-glint"
              style={
                {
                  '--glint-duration': `${3 + (i % 3) * 0.8}s`,
                  '--glint-delay': `${-i * 1.2}s`,
                } as CSSProperties
              }
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={palette.duskSeaGlow}
            />
          ))}
        </motion.g>
        <motion.g style={{ opacity: night }}>
          {nightStars.map(([cx, cy, r], i) => (
            <circle
              key={i}
              className="pr-glint"
              style={
                {
                  '--glint-duration': `${3 + (i % 5)}s`,
                  '--glint-delay': `${-((i * 0.7) % 6)}s`,
                } as CSSProperties
              }
              cx={cx}
              cy={cy}
              r={r}
              fill={palette.foam}
            />
          ))}
        </motion.g>
      </StripSvg>
    </Strip>
  )
}
