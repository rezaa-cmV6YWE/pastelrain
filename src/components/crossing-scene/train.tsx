import { motion, type MotionValue } from 'motion/react'

import { palette } from '#/components/scene-kit/palette'
import { Circle, Path, Rect, Shift } from '#/components/scene-kit/rough'
import { SceneSvg } from '#/components/scene-kit/scene-svg'

/**
 * A two-car Japanese local train (white body, blue stripe band, three
 * double-leaf doors per side, roof AC units, pantograph) in side view, facing
 * left. Coordinates are viewBox units with the leading car's nose at x=0;
 * `trainX` slides the whole set along the track.
 */
export const train = {
  carLength: 1150,
  gap: 20,
  roofTop: 438,
  bodyTop: 450,
  bodyBottom: 655,
  /**
   * Centre of the trailing car's window at 625–750, in train coordinates: the
   * train stops with it in front of the camera, which then rushes into it.
   */
  focusWindowX: 1150 + 20 + (625 + 750) / 2,
} as const

const doors = [180, 535, 890]
const doorWidth = 80
const windowBays: readonly (readonly [number, number])[] = [
  [30, 165],
  [275, 400],
  [410, 525],
  [625, 750],
  [760, 880],
  [985, 1120],
]

function Car({ x, leading, glare }: { x: number; leading: boolean; glare: MotionValue<number> }) {
  const { carLength: L, roofTop, bodyTop, bodyBottom } = train
  return (
    <Shift x={x}>
      {/* back sheet peeking out down-right, like the clouds' stacked layers */}
      <Rect
        x={6}
        y={bodyTop + 5}
        width={L}
        height={bodyBottom - bodyTop}
        rx={10}
        fill={palette.cloudShade}
      />

      {/* underframe, bogies and wheels on the rails */}
      <Rect x={40} y={bodyBottom - 8} width={L - 80} height={22} fill={palette.navy} />
      {[175, L - 175].map((bx) => (
        <g key={bx}>
          <Rect x={bx - 85} y={bodyBottom + 6} width={170} height={16} rx={4} fill={palette.navy} />
          {[-48, 48].map((dx) => (
            <g key={dx}>
              <Circle cx={bx + dx} cy={671} r={13} fill={palette.navy} />
              <Circle cx={bx + dx} cy={671} r={4} fill={palette.cloudShade} />
            </g>
          ))}
        </g>
      ))}

      {/* roof, AC units, pantograph on the trailing (motor) car */}
      <Rect x={6} y={roofTop} width={L - 12} height={18} rx={8} fill={palette.grassShade} />
      {[300, 760].map((ax) => (
        <Rect
          key={ax}
          x={ax}
          y={roofTop - 13}
          width={120}
          height={15}
          rx={3}
          fill={palette.cloudShade}
        />
      ))}
      {!leading && (
        <g fill={palette.navy}>
          <Path
            d={`M518 ${roofTop} L560 ${roofTop - 40} L602 ${roofTop} H592 L560 ${roofTop - 30} L528 ${roofTop} Z`}
          />
          <Rect x={536} y={roofTop - 44} width={48} height={6} rx={2} />
        </g>
      )}

      {/* body: white upper, light grey lower panel, blue stripe band */}
      <Rect x={0} y={bodyTop} width={L} height={bodyBottom - bodyTop} rx={10} fill={palette.foam} />
      <Rect x={0} y={600} width={L} height={bodyBottom - 600} fill={palette.cloudShade} />
      <Rect x={0} y={588} width={L} height={12} fill={palette.stripe} />
      <Rect x={0} y={603} width={L} height={4} fill={palette.seaBright} />

      {/*
       * window bays: dark glass with a cut-paper reflection sweep. `data-glass`
       * marks the panes the hand-off to the train interior cuts open.
       */}
      {windowBays.map(([a, b]) => (
        <Rect
          key={a}
          data-glass
          x={a}
          y={478}
          width={b - a}
          height={82}
          rx={4}
          fill={palette.navy}
        />
      ))}
      <motion.g fill={palette.stripe} style={{ opacity: glare }}>
        {windowBays.map(([a]) => (
          <Path key={a} d={`M${a + 14} 560 L${a + 44} 478 H${a + 62} L${a + 32} 560 Z`} />
        ))}
      </motion.g>

      {/* double-leaf doors with tall windows */}
      {doors.map((dx) => (
        <g key={dx}>
          <Rect
            x={dx}
            y={466}
            width={doorWidth}
            height={bodyBottom - 466 - 4}
            fill={palette.cloudShade}
          />
          <Rect
            x={dx + 4}
            y={470}
            width={doorWidth - 8}
            height={bodyBottom - 470 - 8}
            fill={palette.foam}
          />
          <Rect data-glass x={dx + 10} y={482} width={24} height={72} rx={3} fill={palette.navy} />
          <Rect
            data-glass
            x={dx + doorWidth - 34}
            y={482}
            width={24}
            height={72}
            rx={3}
            fill={palette.navy}
          />
          <Rect
            x={dx + doorWidth / 2 - 1.5}
            y={470}
            width={3}
            height={bodyBottom - 478}
            fill={palette.navy}
          />
        </g>
      ))}

      {/* leading car: cab end with headlight and end gangway on the trailing side */}
      {leading ? (
        <>
          <Rect
            x={0}
            y={bodyTop}
            width={10}
            height={bodyBottom - bodyTop}
            rx={4}
            fill={palette.navy}
          />
          <Circle cx={18} cy={622} r={8} fill={palette.foam} />
          <Circle cx={18} cy={622} r={4} fill={palette.seaGlint} />
          <Rect x={L} y={472} width={train.gap} height={168} fill={palette.navy} />
        </>
      ) : (
        <Rect
          x={L - 10}
          y={bodyTop}
          width={10}
          height={bodyBottom - bodyTop}
          rx={4}
          fill={palette.navy}
        />
      )}
    </Shift>
  )
}

/**
 * Paper-cut like the rest of the scene: the `pr-paper` drop shadow on the SVG
 * and rough edges baked into each shape. Their noise is fixed to the train, so
 * it travels with it instead of shimmering across it.
 */
export function Train({ x, glare }: { x: MotionValue<number>; glare: MotionValue<number> }) {
  return (
    <SceneSvg>
      <motion.g style={{ x }}>
        <Car x={0} leading glare={glare} />
        <Car x={train.carLength + train.gap} leading={false} glare={glare} />
      </motion.g>
    </SceneSvg>
  )
}
