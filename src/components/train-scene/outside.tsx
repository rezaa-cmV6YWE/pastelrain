import { motion, type MotionValue } from 'motion/react'

import { palette } from '#/components/scene-kit/palette'
import { SceneSvg } from '#/components/scene-kit/scene-svg'

import type { Daylight } from './daylight'

/*
 * The view through the windows. Everything here moves every frame, so it gets
 * no `pr-paper` shadow (a filter on moving art is redrawn every frame); offset
 * back sheets in a darker tone give it the paper look instead.
 * Moving strips repeat a 1600-wide tile, drawn three times so any offset in
 * [-1600, 0) covers the frame.
 */
const tiles = [0, 1600, 3200]

/** Cumulus bases [cx, base] within one tile. */
const cumuli = [
  [150, 440],
  [560, 420],
  [980, 445],
  [1380, 430],
] as const

type Lobe = readonly [number, number, number]

function lobes(cx: number, base: number): Lobe[] {
  return [
    [cx - 40, base - 20, 28],
    [cx, base - 38, 38],
    [cx + 42, base - 22, 30],
    [cx - 18, base - 8, 20],
    [cx + 20, base - 8, 20],
  ]
}

/** A shaded crescent under a lobe (same shape as the crossing's clouds). */
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

function CloudTile({ ox, daylight }: { ox: number; daylight: Daylight }) {
  const all = cumuli.map(([cx, base]) => lobes(cx + ox, base))
  const circles = (dx: number, dy: number) =>
    all.flat().map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx + dx} cy={cy + dy} r={r} />)
  return (
    <>
      <motion.g style={{ fill: daylight.cloudBack }}>{circles(5, 4)}</motion.g>
      <motion.g style={{ fill: daylight.cloud }}>{circles(0, 0)}</motion.g>
      <motion.g style={{ fill: daylight.cloudShade }}>
        {all.flatMap((cloud) =>
          [cloud[0], cloud[2]].map((lobe) => (
            <path key={`${lobe[0]}-${lobe[1]}`} d={crescent(lobe)} />
          )),
        )}
      </motion.g>
    </>
  )
}

/**
 * Sky, sun, slow clouds and the sea: the far plane, barely moving. At dusk
 * the sky turns into the platform scene's gradient (same stops, horizon at
 * 470) and the sun sets on the horizon in front of the haze.
 */
export function OutsideFar({ daylight, x }: { daylight: Daylight; x: MotionValue<number> }) {
  return (
    <SceneSvg paper={false}>
      <linearGradient
        id="pr-train-sky"
        gradientUnits="userSpaceOnUse"
        x1={0}
        y1={0}
        x2={0}
        y2={470}
      >
        <motion.stop offset={0} style={{ stopColor: daylight.skyTop }} />
        <motion.stop offset={0.2} style={{ stopColor: daylight.skyTop }} />
        <motion.stop offset={0.7} style={{ stopColor: daylight.skyMid }} />
        <motion.stop offset={1} style={{ stopColor: daylight.skyHorizon }} />
      </linearGradient>
      <rect width={1600} height={900} fill="url(#pr-train-sky)" />
      <motion.path
        d="M0 400 C300 392 600 404 900 398 S1400 392 1600 400 V470 H0 Z"
        style={{ fill: daylight.skyHaze }}
      />
      <motion.circle
        cx={1180}
        cy={daylight.sunY}
        r={80}
        opacity={0.35}
        style={{ fill: daylight.sun }}
      />
      <motion.circle cx={1180} cy={daylight.sunY} r={46} style={{ fill: daylight.sun }} />
      <motion.g style={{ x }}>
        {tiles.map((ox) => (
          <CloudTile key={ox} ox={ox} daylight={daylight} />
        ))}
      </motion.g>
      <motion.rect y={470} width={1600} height={430} style={{ fill: daylight.sea }} />
      <motion.rect y={470} width={1600} height={6} style={{ fill: daylight.seaDeep }} />
      <motion.rect y={486} width={1600} height={20} style={{ fill: daylight.seaBright }} />
    </SceneSvg>
  )
}

const shore = 'M0 546 C200 540 400 552 600 546 S1000 540 1200 548 S1500 552 1600 546 V600 H0 Z'

/** The shoreline and telephone poles rushing past just outside; the shore dims to sand at dusk. */
export function OutsideNear({ daylight, x }: { daylight: Daylight; x: MotionValue<number> }) {
  return (
    <SceneSvg paper={false}>
      {/* wires look the same while moving, so they stay put */}
      <rect y={262} width={1600} height={2} fill={palette.navy} />
      <rect y={270} width={1600} height={2} fill={palette.navy} />
      <motion.g data-strip="near" style={{ x }}>
        {tiles.map((ox) => (
          <g key={ox} transform={`translate(${ox} 0)`}>
            <path d={shore} transform="translate(3 4)" fill={palette.navy} />
            <motion.path d={shore} style={{ fill: daylight.shore }} />
            {[300, 1100].map((px) => (
              <g key={px} fill={palette.navy}>
                <rect x={px - 6} y={230} width={12} height={370} />
                <rect x={px - 30} y={250} width={60} height={6} />
              </g>
            ))}
          </g>
        ))}
      </motion.g>
    </SceneSvg>
  )
}
