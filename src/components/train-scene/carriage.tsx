import { motion, type MotionValue } from 'motion/react'
import type { CSSProperties } from 'react'

import { palette } from '#/components/scene-kit/palette'
import { Path, Rect } from '#/components/scene-kit/rough'
import { SceneSvg } from '#/components/scene-kit/scene-svg'

/** The three window openings' x ranges; they all run from `windowTop` to `windowBottom`. */
export const windows = [
  [150, 550],
  [600, 1000],
  [1050, 1450],
] as const
const windowTop = 230
const windowBottom = 560
const windowRadius = 18
/** The top of the transom bar across each window. */
const transom = 292

/** A closed rounded-rectangle subpath, for evenodd cut-outs. */
function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  return [
    `M${x + r} ${y}`,
    `H${x + w - r}`,
    `A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V${y + h - r}`,
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H${x + r}`,
    `A${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    'Z',
  ].join(' ')
}

const holes = windows.map(([x0, x1]) =>
  roundedRect(x0, windowTop, x1 - x0, windowBottom - windowTop, windowRadius),
)

const ads = [
  [170, 450, palette.stripe],
  [650, 950, palette.grass],
  [1150, 1430, palette.seaGlint],
] as const

const benches = [
  [40, 560],
  [580, 1020],
  [1040, 1560],
] as const

const vents = Array.from({ length: 25 }, (_, i) => 70 + 60 * i)

/** Seams between the seats of a bench spanning x0–x1, one seat about 110 wide. */
function seams(x0: number, x1: number) {
  const count = Math.round((x1 - x0) / 110)
  return Array.from({ length: count - 1 }, (_, i) => x0 + ((x1 - x0) * (i + 1)) / count)
}

/** The grab poles' x positions (`Stanchions`); the carriage draws their shadows. */
const poles = [563, 1023]
/** How far the window reveals (the wall's thickness) show inside each opening. */
const reveal = 12

/**
 * The carriage wall facing the camera: ceiling, advertisement band, luggage
 * rack, the window wall with its three openings, benches, heater skirt and
 * floor. Static, so it keeps the `pr-paper` shadow.
 *
 * Depth comes from flat paper-cut shadows under the overhead light: every
 * ledge (ceiling edge, ad frames, rack, seat backs, cushions) darkens the
 * strip below it, the poles cast narrow shadows on the wall and benches, and
 * each window shows the wall's thickness: the reveal's underside at the top,
 * the sill's top at the bottom, and the side facing the viewer.
 */
export function Carriage() {
  return (
    <SceneSvg>
      {/* ceiling, curving away at the top */}
      <Rect width={1600} height={120} fill={palette.cloud} />
      <Rect width={1600} height={18} fill={palette.cloudShade} />
      {[
        [140, 560],
        [620, 980],
        [1040, 1460],
      ].map(([x0, x1]) => (
        <g key={x0}>
          <Rect x={x0} y={34} width={x1 - x0} height={26} fill={palette.foam} />
          <Rect x={x0} y={60} width={x1 - x0} height={6} fill={palette.cloudShade} />
        </g>
      ))}
      <Rect y={112} width={1600} height={10} fill={palette.cloudShade} />

      {/* advertisement band */}
      <Rect y={122} width={1600} height={100} fill={palette.cloudShade} />
      {ads.map(([x0, x1, picture]) => (
        <g key={x0}>
          <Rect x={x0} y={132} width={x1 - x0} height={60} fill={palette.foam} />
          <Rect x={x0 + 10} y={140} width={100} height={44} fill={picture} />
          {[146, 160, 174].map((y) => (
            <Rect
              key={y}
              x={x0 + 124}
              y={y}
              width={x1 - 16 - (x0 + 124)}
              height={6}
              fill={palette.navy}
            />
          ))}
        </g>
      ))}

      {/* luggage rack */}
      <Rect x={40} y={214} width={1520} height={8} fill={palette.grassShade} />
      {[120, 560, 1040, 1480].map((x) => (
        <Rect key={x} x={x} y={206} width={10} height={22} fill={palette.navy} />
      ))}

      {/* window wall; it runs down behind the benches to the heater skirt */}
      <Path
        d={[roundedRect(-60, 222, 1720, 558, 0), ...holes].join(' ')}
        fillRule="evenodd"
        fill={palette.cloud}
      />
      {windows.map(([x0, x1], i) => (
        <g key={x0} fill={palette.cloudShade}>
          <Path
            d={`${roundedRect(
              x0 - 12,
              windowTop - 12,
              x1 - x0 + 24,
              windowBottom - windowTop + 24,
              windowRadius + 12,
            )} ${holes[i]}`}
            fillRule="evenodd"
          />
          <Rect x={x0} y={transom} width={x1 - x0} height={10} />
        </g>
      ))}

      {/* window reveals, clipped to the openings (the same rough outlines as the wall's) */}
      <clipPath id="train-window-holes">
        <Path d={holes.join(' ')} />
      </clipPath>
      <g clipPath="url(#train-window-holes)">
        {windows.map(([x0, x1], i) => (
          <g key={x0}>
            <Rect x={x0} y={windowTop} width={x1 - x0} height={reveal} fill={palette.cloudShade} />
            {/* the left window shows its left side, the right window its right */}
            {i !== 1 && (
              <Rect
                x={i === 0 ? x0 : x1 - reveal}
                y={windowTop}
                width={reveal}
                height={windowBottom - windowTop}
                fill={palette.cloudShade}
              />
            )}
            <Rect
              x={x0}
              y={windowBottom - reveal}
              width={x1 - x0}
              height={reveal}
              fill={palette.foam}
            />
          </g>
        ))}
      </g>

      {/* benches: backrest, then the cushion's lit top and its front face */}
      {benches.map(([x0, x1]) => (
        <g key={x0}>
          <g fill={palette.navy} transform="translate(3 4)">
            <Rect x={x0} y={598} width={x1 - x0} height={92} rx={14} />
            <Rect x={x0} y={690} width={x1 - x0} height={46} rx={10} />
          </g>
          <Rect x={x0} y={598} width={x1 - x0} height={92} rx={14} fill={palette.seatShade} />
          <Rect x={x0 + 8} y={601} width={x1 - x0 - 16} height={8} rx={4} fill={palette.seat} />
          <Rect x={x0} y={690} width={x1 - x0} height={46} rx={10} fill={palette.seatLight} />
          <Path
            d={`M${x0} 704 H${x1} V726 Q${x1} 736 ${x1 - 10} 736 H${x0 + 10} Q${x0} 736 ${x0} 726 Z`}
            fill={palette.seat}
          />
        </g>
      ))}

      {/* heater skirt */}
      <Rect x={40} y={736} width={1520} height={44} fill={palette.grassShade} />
      {vents.map((x) => (
        <Rect key={x} x={x} y={756} width={40} height={4} fill={palette.navy} />
      ))}

      {/* floor */}
      <Rect y={780} width={1600} height={120} fill={palette.grassShade} />
      <Rect y={780} width={1600} height={6} fill={palette.navy} />

      {/*
       * Cast shadows: one flat tone at group opacity, so where two overlap
       * they don't darken twice. None falls inside a window opening except
       * on the opaque reveals.
       */}
      <g fill={palette.navy} opacity={0.24}>
        <Rect y={122} width={1600} height={14} />
        {ads.map(([x0, x1]) => (
          <Rect key={x0} x={x0 + 4} y={192} width={x1 - x0} height={8} />
        ))}
        <Rect x={40} y={222} width={1520} height={windowTop + reveal - 222} />
        {windows.map(([x0, x1]) => (
          <g key={x0}>
            <Rect x={x0} y={windowTop} width={x1 - x0} height={reveal} />
            {/* under the sill, on the wall */}
            <Rect x={x0 - 12} y={windowBottom + 12} width={x1 - x0 + 24} height={10} />
          </g>
        ))}
        {benches.map(([x0, x1]) => (
          <g key={x0}>
            {/* under the backrest's overhang, and under the cushion */}
            <Rect x={x0 + 8} y={690} width={x1 - x0 - 16} height={8} />
            <Rect x={x0} y={736} width={x1 - x0} height={14} />
            {/* seams between the seats, one per passenger */}
            {seams(x0, x1).map((x) => (
              <Rect key={x} x={x - 1.5} y={614} width={3} height={72} rx={1.5} />
            ))}
          </g>
        ))}
        <Rect x={40} y={786} width={1520} height={22} />
        {poles.map((x) => (
          <Rect key={x} x={x + 18} y={122} width={12} height={658} />
        ))}
      </g>
      {/*
       * The arrival rush's target (`TrainScene`): the centre opening below the
       * transom, so once it covers the screen the straps, the transom and the
       * sill are out of frame.
       */}
      <rect
        data-rush-target
        x={windows[1][0]}
        y={transom + 10}
        width={windows[1][1] - windows[1][0]}
        height={windowBottom - transom - 10}
        fill="none"
      />
    </SceneSvg>
  )
}

/** Late sun falling through the windows onto the benches and floor. */
export function SunPatches({ opacity }: { opacity: MotionValue<number> }) {
  return (
    <SceneSvg paper={false}>
      <motion.g fill={palette.goldLight} style={{ opacity }}>
        {windows.map(([x0, x1]) => (
          <polygon
            key={x0}
            points={`${x0 + 60},600 ${x1 + 60},600 ${x1 + 180},900 ${x0 + 180},900`}
          />
        ))}
      </motion.g>
    </SceneSvg>
  )
}

/** The grab poles between the benches. */
export function Stanchions() {
  return (
    <SceneSvg>
      {poles.map((x) => (
        <g key={x}>
          <Rect x={x} width={14} height={900} fill={palette.foam} />
          <Rect x={x + 7} width={7} height={900} fill={palette.cloudShade} />
        </g>
      ))}
    </SceneSvg>
  )
}

const ring = (x: number, y: number) =>
  `M${x - 26} ${y} a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0 Z ` +
  `M${x - 19} ${y} a19 19 0 1 0 38 0 a19 19 0 1 0 -38 0 Z`

/**
 * The overhead rail and its hanging straps, each swaying on its own phase.
 * They move every frame, so no `pr-paper` shadow (it would be redrawn every
 * frame): a back sheet gives the paper look.
 */
export function Straps() {
  return (
    <SceneSvg paper={false}>
      <rect x={-60} y={86} width={1720} height={10} fill={palette.cloudShade} />
      <rect x={-60} y={86} width={1720} height={5} fill={palette.foam} />
      {Array.from({ length: 12 }, (_, i) => {
        const x = 130 + 120 * i
        return (
          <g
            key={x}
            className="pr-sway"
            style={{ '--sway-delay': `${-i * 0.37}s` } as CSSProperties}
          >
            <rect x={x - 5} y={96} width={10} height={120} fill={palette.stripe} />
            <rect x={x - 9} y={210} width={18} height={14} fill={palette.navy} />
            <path d={ring(x + 3, 255)} fillRule="evenodd" fill={palette.cloudShade} />
            <path d={ring(x, 252)} fillRule="evenodd" fill={palette.foam} />
          </g>
        )
      })}
    </SceneSvg>
  )
}
