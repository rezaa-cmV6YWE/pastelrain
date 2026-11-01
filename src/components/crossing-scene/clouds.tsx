import type { CSSProperties, ReactNode } from 'react'

import { palette } from './palette'
import { SceneSvg } from './scene-svg'

/** [cx, cy, r, shaded crescent under this lobe] */
type Lobe = readonly [number, number, number, boolean?]
/** [x0, x1, top, bottom]; the flat base every cumulus sits on */
type Base = readonly [number, number, number, number]

type Drift = { drift: string; duration: string; delay: string }

function Drifting({ drift, duration, delay, children }: Drift & { children: ReactNode }) {
  const style = {
    '--drift': drift,
    '--drift-duration': duration,
    '--drift-delay': delay,
  } as CSSProperties
  return (
    <div className="pr-drift absolute inset-0" style={style}>
      <SceneSvg>
        <g filter="url(#pr-cut)">{children}</g>
      </SceneSvg>
    </div>
  )
}

function crescent([cx, cy, r]: Lobe) {
  const a1 = (25 * Math.PI) / 180
  const a2 = (155 * Math.PI) / 180
  const R = r * 0.9
  const sx = cx + R * Math.cos(a1)
  const sy = cy + R * Math.sin(a1)
  const ex = cx + R * Math.cos(a2)
  const ey = cy + R * Math.sin(a2)
  return `M${sx} ${sy} A${R} ${R} 0 0 1 ${ex} ${ey} A${R * 1.5} ${R * 1.5} 0 0 0 ${sx} ${sy} Z`
}

function Cumulus({ id, lobes, base }: { id: string; lobes: readonly Lobe[]; base: Base }) {
  const [x0, x1, top, bottom] = base
  const tone = (dx: number, dy: number, dr: number) => (
    <>
      {lobes.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx + dx} cy={cy + dy} r={r + dr} />
      ))}
      <rect x={x0 + dx} y={top + dy} width={x1 - x0} height={bottom - top} />
    </>
  )
  return (
    <>
      <clipPath id={`pr-cloud-${id}`}>
        <rect width="1600" height={bottom} />
      </clipPath>
      <g clipPath={`url(#pr-cloud-${id})`}>
        <g fill={palette.skyHaze}>{tone(8, 6, 0)}</g>
        <g fill={palette.cloudShade}>{tone(0, 0, 0)}</g>
        <g fill={palette.cloud}>{tone(3, -6, -1)}</g>
        <g fill={palette.cloudShade}>
          {lobes
            .filter((lobe) => lobe[3])
            .map((lobe) => (
              <path key={`${lobe[0]}-${lobe[1]}`} d={crescent(lobe)} />
            ))}
        </g>
      </g>
    </>
  )
}

const hero: readonly Lobe[] = [
  [650, 528, 45],
  [722, 506, 60, true],
  [802, 490, 70],
  [892, 496, 72, true],
  [972, 512, 60],
  [1035, 532, 45, true],
  [722, 432, 55, true],
  [792, 402, 70],
  [882, 408, 74, true],
  [962, 442, 58],
  [762, 332, 55, true],
  [842, 302, 74],
  [922, 334, 60, true],
  [806, 240, 52],
  [862, 200, 50, true],
  [920, 236, 48],
]

const right: readonly Lobe[] = [
  [1396, 532, 34],
  [1452, 494, 55, true],
  [1522, 472, 64],
  [1590, 500, 56, true],
  [1472, 414, 48, true],
  [1542, 382, 60],
  [1604, 414, 50, true],
]

const leftBank: readonly Lobe[] = [
  [302, 536, 30],
  [352, 512, 45, true],
  [422, 492, 54],
  [492, 498, 50, true],
  [556, 522, 44],
  [598, 542, 22],
  [442, 462, 40, true],
]

export function Clouds() {
  return (
    <>
      <Drifting drift="1.2%" duration="140s" delay="0s">
        <Cumulus id="hero" lobes={hero} base={[620, 1060, 500, 565]} />
      </Drifting>
      <Drifting drift="2.5%" duration="100s" delay="-30s">
        <Cumulus id="right" lobes={right} base={[1380, 1600, 520, 565]} />
      </Drifting>
      <Drifting drift="3%" duration="80s" delay="-10s">
        <Cumulus id="left" lobes={leftBank} base={[292, 610, 520, 565]} />
      </Drifting>
      <Drifting drift="4%" duration="70s" delay="-45s">
        <path
          d="M1390 446 C1410 432 1470 428 1500 436 C1490 444 1440 448 1390 446 Z"
          fill={palette.cloudShade}
        />
        <path
          d="M1394 442 C1414 431 1468 428 1496 434 C1480 440 1440 443 1394 442 Z"
          fill={palette.cloud}
        />
        <path
          d="M1050 558 C1080 540 1170 532 1240 538 C1262 541 1272 548 1270 558 Z"
          fill={palette.cloudShade}
        />
        <path
          d="M1056 552 C1090 538 1170 532 1236 537 C1256 540 1266 546 1264 552 Z"
          fill={palette.cloud}
        />
      </Drifting>
    </>
  )
}
