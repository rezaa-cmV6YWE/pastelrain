import type { CSSProperties } from 'react'

import { palette } from '#/components/scene-kit/palette'
import { SceneSvg } from '#/components/scene-kit/scene-svg'

type Burst = { x: number; y: number; color: string; duration: number; delay: number }

const durations = [4.8, 5.4, 4.6, 5.1, 5.7]
const delays = [0, 0.9, 1.8, 2.6, 3.5]
const colors = [palette.lamp, palette.sun, palette.seaGlint, palette.flyerPink, palette.duskGo]
/** [x, y] of each burst: spread over the sea in landscape, kept near the middle in portrait. */
const wide: [number, number][] = [
  [1000, 190],
  [1200, 130],
  [1360, 240],
  [880, 270],
  [1120, 300],
]
const narrow: [number, number][] = [
  [860, 170],
  [960, 110],
  [980, 270],
  [820, 300],
  [920, 220],
]

const bursts = (spots: [number, number][]): Burst[] =>
  spots.map(([x, y], i) => ({ x, y, color: colors[i], duration: durations[i], delay: delays[i] }))

const petals = Array.from({ length: 12 }, (_, i) => i * 30)
const dots = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5)

/**
 * One firework: a rocket rises from the horizon, bursts into paper petals and
 * dots that droop as they fade, with a glow in the sky and on the sea. Angles
 * are rotations, not trig, so SSR and the browser write the same attributes.
 */
function BurstArt({ x, y, color, duration, delay }: Burst) {
  return (
    <g
      style={{ '--burst-duration': `${duration}s`, '--burst-delay': `${delay}s` } as CSSProperties}
    >
      <circle className="pr-flash" cx={x} cy={y} r={90} fill={color} fillOpacity={0.25} />
      <ellipse className="pr-flash" cx={x} cy={510} rx={60} ry={5} fill={color} />
      <g transform={`translate(${x} ${y})`}>
        <g className="pr-rocket" style={{ '--rise': `${470 - y}px` } as CSSProperties}>
          <rect x={-1.5} y={0} width={3} height={18} rx={1.5} fill={palette.foam} />
        </g>
      </g>
      <g transform={`translate(${x} ${y})`}>
        <g className="pr-burst">
          {petals.map((a) => (
            <rect
              key={a}
              x={-2}
              y={-54}
              width={4}
              height={24}
              rx={2}
              fill={color}
              transform={`rotate(${a})`}
            />
          ))}
          {dots.map((a) => (
            <circle key={a} cx={0} cy={-26} r={3} fill={palette.foam} transform={`rotate(${a})`} />
          ))}
        </g>
      </g>
    </g>
  )
}

/**
 * Paper fireworks over the night sea. Unfiltered: they animate. Time-based
 * loops (`pr-rocket`, `pr-burst`, `pr-flash`): mounting restarts them, so the
 * platform scene mounts this only once they're lit; they pause with
 * `--pr-play`.
 */
export function Fireworks() {
  return (
    <SceneSvg paper={false}>
      <g className="portrait:hidden">
        {bursts(wide).map((b) => (
          <BurstArt key={`${b.x}-${b.y}`} {...b} />
        ))}
      </g>
      <g className="landscape:hidden">
        {bursts(narrow).map((b) => (
          <BurstArt key={`${b.x}-${b.y}`} {...b} />
        ))}
      </g>
    </SceneSvg>
  )
}
