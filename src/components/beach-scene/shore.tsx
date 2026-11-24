import { motion, type MotionValue } from 'motion/react'
import type { CSSProperties } from 'react'

import { useNightSeaAndSand } from '#/components/platform-scene/sky'
import { palette } from '#/components/scene-kit/palette'
import { Path, Rect } from '#/components/scene-kit/rough'
import { SceneSvg } from '#/components/scene-kit/scene-svg'

/*
 * The beach at night, in stage units, in three planes so it has depth: the
 * far headland on the horizon, the shore (the shallows, the waterline, the
 * wet sand and a middle dune) and the near dune. Bands narrow and waves
 * flatten towards the horizon, as they would in perspective. The water is
 * the sky's sea colour and everything over the sand is a light or dark tint
 * of what lies beneath, so the beach follows the sky as dusk turns to night.
 * Nothing is drawn above y 545 except the headland, which stands right of
 * x 1100: that keeps the beach out of the frame the camera shows at the
 * deepest of its push past the gate (`platform-scene`), so nothing pops in
 * when these planes take over.
 */

/**
 * Path data through a cubic Bézier chain (a start point, then three points
 * per segment), `dy` lower, starting with `start` (M, or L to continue).
 */
const chain = (points: number[][], dy = 0, start = 'M') =>
  points.map(([x, y], i) => `${i === 0 ? start : i % 3 === 1 ? 'C' : ''}${x} ${y + dy}`).join(' ')
/** The same chain, traced back from its end. */
const back = (points: number[][], dy = 0) =>
  chain(
    points.map((_, i) => points[points.length - 1 - i]),
    dy,
    'L',
  )
/** A band from a chain's edge down past the bottom of the stage. */
const band = (points: number[][]) => `${chain(points)} V960 H-100 Z`
/** A crest: the strip between a chain and the same chain `depth` units lower. */
const crest = (points: number[][], depth: number) => `${chain(points)} ${back(points, depth)} Z`

/**
 * A wave's height along the shore: a chain of half-wavelength parabolic
 * arches (each `seg` long, `amp` high, alternating up and down) about
 * `base`, shifted by `phase`. Plain arithmetic, no trigonometry, so the
 * server and the browser compute identical path data.
 */
type Wave = { base: number; amp: number; seg: number; phase: number }
const height = ({ base, amp, seg, phase }: Wave, x: number) => {
  const t = (x + 100 + phase) / seg
  const k = Math.floor(t)
  const u = t - k
  return base + (k % 2 === 0 ? -4 : 4) * amp * u * (1 - u)
}
/** The waterline: where the last wave runs up the sand, two swells laid over each other. */
const waterline = (x: number) =>
  height({ base: 612, amp: 7, seg: 380, phase: 90 }, x) +
  height({ base: 0, amp: 3, seg: 150, phase: 40 }, x)

/** Sample points across the stage, every 20 units. */
const xs = Array.from({ length: 91 }, (_, i) => -100 + i * 20)
/** Path data along a height function across the stage, left to right. */
const along = (y: (x: number) => number, start = 'M') =>
  xs.map((x, i) => `${i === 0 ? start : 'L'}${x} ${y(x).toFixed(1)}`).join(' ')
/** The same, right to left, continuing a path. */
const alongBack = (y: (x: number) => number) =>
  xs
    .map((_, i) => xs[xs.length - 1 - i])
    .map((x) => `L${x} ${y(x).toFixed(1)}`)
    .join(' ')
/** Where the wet sand dries. */
const dryLine = [
  [-100, 652],
  [220, 640],
  [520, 660],
  [820, 648],
  [1100, 638],
  [1380, 656],
  [1700, 644],
]
const midDune = [
  [-100, 712],
  [140, 684],
  [380, 676],
  [620, 698],
  [800, 714],
  [980, 708],
  [1180, 688],
  [1360, 670],
  [1540, 676],
  [1700, 690],
]
const nearDune = [
  [-100, 800],
  [100, 770],
  [280, 760],
  [460, 778],
  [620, 794],
  [760, 806],
  [920, 792],
  [1100, 776],
  [1300, 748],
  [1700, 760],
]

/**
 * The waves coming in, far to near: each rises more and runs longer the
 * nearer it is, and the water shoreward of it is lighter by `light`.
 */
const waves = [
  { base: 552, amp: 3, seg: 200, phase: 0, light: 0.05 },
  { base: 574, amp: 5, seg: 260, phase: 130, light: 0.06 },
  { base: 594, amp: 8, seg: 320, phase: 260, light: 0.07 },
].map((w) => ({ ...w, y: (x: number) => height(w, x) }))

const laceLengths = [90, 40, 140, 60, 30, 110, 70, 180, 50]
const laceGaps = [30, 60, 20, 80, 45, 25, 110, 35]
/**
 * Foam breaking along a wave: patches of irregular length, thickest in the
 * middle and tapering to points, following the wave's height `y`; `scale`
 * lengthens them and `thick` thickens them for nearer waves.
 */
const lace = (y: (x: number) => number, scale: number, thick: number, seed: number) => {
  const patches: string[] = []
  let x = -100 + ((seed * 37) % 60)
  for (let i = seed; x < 1700; i++) {
    const length = laceLengths[i % laceLengths.length] * scale
    const n = Math.max(4, Math.round(length / 12))
    const at = (j: number) => {
      const u = j / n
      return [x + length * u, y(x + length * u), (thick / 2) * 4 * u * (1 - u)]
    }
    const steps = Array.from({ length: n + 1 }, (_, j) => at(j))
    const top = steps.map(
      ([px, py, h], j) => `${j === 0 ? 'M' : 'L'}${px.toFixed(1)} ${(py - h).toFixed(1)}`,
    )
    const bottom = steps
      .map((_, j) => steps[n - j])
      .map(([px, py, h]) => `L${px.toFixed(1)} ${(py + h).toFixed(1)}`)
    patches.push(`${top.join(' ')} ${bottom.join(' ')} Z`)
    x += length + laceGaps[(i * 3) % laceGaps.length] * scale
  }
  return patches.join(' ')
}
/** Foam along each wave, far to near, then the waterline: its path and opacity. */
const foam = [
  { d: lace(waves[0].y, 0.6, 2.5, 0), opacity: 0.3 },
  { d: lace(waves[1].y, 0.8, 4, 1), opacity: 0.45 },
  { d: lace(waves[2].y, 1, 5.5, 2), opacity: 0.6 },
  { d: lace(waterline, 1.3, 7, 3), opacity: 0.8 },
]

/** [x, y, width]: the sky's light reflected in the wet sand. */
const sheen = [
  [120, 628, 120],
  [520, 630, 90],
  [860, 622, 140],
  [1260, 634, 110],
]

/** The rocks in the wash: [x, y, size]. */
const rocks = [
  [196, 632, 1],
  [262, 636, 0.5],
  [940, 626, 0.7],
]

/** Grass tufts on the near dune's crest: [x, y, height, lean]. */
const tufts = [
  [40, 784, 50, -0.3],
  [130, 774, 40, 0.2],
  [330, 770, 58, -0.2],
  [560, 794, 44, 0.3],
  [700, 806, 52, -0.25],
  [860, 802, 40, 0.15],
  [1040, 786, 54, -0.2],
  [1200, 768, 46, 0.25],
  [1270, 762, 36, -0.1],
  [1430, 758, 50, 0.2],
  [1580, 762, 42, -0.3],
]

/** One tuft: five pointed blades fanning from its base, leaning by `lean`. */
const tuft = ([x, y, h, lean]: number[]) =>
  [
    [-10, 0.55, -0.5],
    [-5, 0.85, -0.2],
    [0, 1, 0],
    [5, 0.8, 0.25],
    [10, 0.5, 0.55],
  ]
    .map(
      ([dx, k, fan]) =>
        `M${x + dx - 3} ${y} L${x + dx + (lean + fan) * h * k} ${y - h * k} L${x + dx + 3} ${y} Z`,
    )
    .join(' ')

/**
 * A driftwood fence along the near dune at the left, its posts shorter and
 * closer together as it runs away from us: [x, base y, height].
 */
const fence = [
  [40, 792, 74],
  [104, 782, 62],
  [158, 776, 52],
  [204, 772, 44],
  [242, 770, 37],
  [274, 770, 31],
  [300, 771, 26],
]
/** The fence's rail: along the posts at `at` of their height. */
const rail = (at: number) => fence.map(([x, y, h]) => [x, y - h * at])

/** The far headland's town lights, at the water's edge. */
const lights = [1336, 1352, 1361, 1404, 1478, 1530]

/** The far headland on the horizon, with a few town lights twinkling at its foot. */
export function Headland() {
  return (
    <>
      <SceneSvg>
        <Path
          d="M1180 472 C1260 446 1340 420 1440 418 C1540 416 1620 436 1720 446 V476 H1180 Z"
          fill={palette.nightHeadlandFar}
        />
        <Path
          d="M1110 474 C1180 466 1240 458 1300 456 C1360 454 1400 462 1460 460 C1540 457 1620 462 1720 466 V478 H1110 Z"
          fill={palette.nightHeadland}
        />
      </SceneSvg>
      <SceneSvg paper={false}>
        {lights.map((x, i) => (
          <circle
            key={x}
            className="pr-glint"
            style={
              {
                '--glint-duration': `${3 + (i % 3)}s`,
                '--glint-delay': `${-i * 0.9}s`,
              } as CSSProperties
            }
            cx={x}
            cy={469 - (i % 2) * 2}
            r={1.8}
            fill={palette.duskLampGlow}
          />
        ))}
      </SceneSvg>
    </>
  )
}

/**
 * The shore: the waves coming in, the water lighter in bands towards the
 * beach, the waterline curving along the sand, the wet sand with the sky in
 * it and a few rocks, and a middle dune with its crest lit; foam breaks
 * along each wave and the waterline. `night` is the sky's (`DuskSky`).
 */
export function Shore({ night }: { night: MotionValue<number> }) {
  return (
    <motion.div className="absolute inset-0" style={useNightSeaAndSand(night)}>
      <SceneSvg>
        {/* the sea runs on up to the waterline, over the sky's straight shore */}
        <Path
          d={`M-100 586 L1700 586 ${alongBack(waterline)} Z`}
          style={{ fill: 'var(--night-sea)' }}
        />
        {waves.map(({ base, y, light }) => (
          <Path
            key={base}
            d={`${along(y)} ${alongBack(waterline)} Z`}
            fill={palette.foam}
            opacity={light}
          />
        ))}
        {/* the wet sand, darker down to where it dries, the sky's light in it */}
        <Path
          d={`${along(waterline)} ${back(dryLine)} Z`}
          fill={palette.nightShade}
          opacity={0.3}
        />
        {sheen.map(([x, y, w]) => (
          <Path
            key={x}
            d={`M${x} ${y} C${x + w * 0.3} ${y - 4} ${x + w * 0.7} ${y - 4} ${x + w} ${y} C${x + w * 0.7} ${y + 3} ${x + w * 0.3} ${y + 3} ${x} ${y} Z`}
            fill={palette.foam}
            opacity={0.12}
          />
        ))}
        {rocks.map(([x, y, s]) => (
          <g key={x}>
            <Path
              d={`M${x - 46 * s} ${y} C${x - 40 * s} ${y - 20 * s} ${x - 20 * s} ${y - 30 * s} ${x + 4 * s} ${y - 28 * s} C${x + 26 * s} ${y - 26 * s} ${x + 42 * s} ${y - 14 * s} ${x + 44 * s} ${y} Z`}
              fill={palette.nightRock}
            />
            <Path
              d={`M${x - 28 * s} ${y - 22 * s} C${x - 16 * s} ${y - 29 * s} ${x} ${y - 31 * s} ${x + 14 * s} ${y - 28 * s} C${x} ${y - 26 * s} ${x - 14 * s} ${y - 23 * s} ${x - 24 * s} ${y - 18 * s} Z`}
              fill={palette.nightRockLight}
            />
          </g>
        ))}
        {/* the middle dune, in its own shade, its crest catching the light */}
        <Path d={band(midDune)} fill={palette.nightShade} opacity={0.3} />
        <Path d={crest(midDune, 7)} fill={palette.foam} opacity={0.08} />
      </SceneSvg>
      <SceneSvg paper={false}>
        <g className="pr-wash" fill={palette.foam}>
          {foam.map(({ d, opacity }) => (
            <path key={d} d={d} opacity={opacity} />
          ))}
        </g>
      </SceneSvg>
    </motion.div>
  )
}

/**
 * The near dune, darker and closer: its lit crest, grass tufts along it and
 * a driftwood fence running away from us at the left.
 */
export function Dunes() {
  return (
    <SceneSvg>
      {fence.map(([x, y, h]) => (
        <Rect
          key={x}
          x={x - h * 0.06}
          y={y - h}
          width={h * 0.12}
          height={h + 20}
          fill={palette.nightDriftwood}
        />
      ))}
      <Path
        d={`M${rail(0.7).join(' L')} ${rail(0.62)
          .map((_, i, r) => r[r.length - 1 - i])
          .map((p) => `L${p.join(' ')}`)
          .join(' ')} Z`}
        fill={palette.nightDriftwood}
      />
      <Path d={band(nearDune)} fill={palette.nightShade} opacity={0.55} />
      <Path d={crest(nearDune, 6)} fill={palette.foam} opacity={0.07} />
      {tufts.map((t) => (
        <Path key={t[0]} d={tuft(t)} fill={palette.nightGrass} />
      ))}
    </SceneSvg>
  )
}
