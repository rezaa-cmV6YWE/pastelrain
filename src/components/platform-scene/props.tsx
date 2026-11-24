import { motion, useTransform, type MotionValue } from 'motion/react'

import { palette } from '#/components/scene-kit/palette'
import { Circle, Rect, Shift } from '#/components/scene-kit/rough'

import { gateX, nameX, opening, wallEnd, wallFoot, wallStart } from './layout'
import { Strip, StripSvg, type Walk } from './strip'

const width = wallEnd - wallStart

/*
 * The fixtures are drawn about their own origin and placed with `Shift`
 * (which also moves the rough edges' noise, so no two benches match).
 */

/** The ticket-gate machines' left edges about the opening's centre; each is 34 wide. */
const machines = [-116, -17, 82]
const machineWidth = 34
/** The two aisles between the machines, as [x0, x1] about the opening's centre. */
const aisles = [
  [-82, -17],
  [17, 82],
] as const
const paddleWidth = (aisles[0][1] - aisles[0][0]) / 2 - 2

/** A vending machine left of the name board, a bench under it, and one past the gate. */
const fixtures = [
  { x: nameX - 470, kind: 'vending' },
  { x: nameX, kind: 'bench' },
  { x: gateX + 450, kind: 'vending' },
] as const

const vendings = fixtures.filter((f) => f.kind === 'vending').map((f) => f.x)

const bottles = [palette.lamp, palette.sea, palette.grass, palette.sun, palette.seatLight]

/** The tactile strip's dots, every 18 units. */
const dots = Array.from({ length: Math.ceil(width / 18) }, (_, i) => wallStart + 9 + 18 * i)

/** A bench centred on 0: legs, backrest and seat. */
function Bench() {
  return (
    <>
      <g fill={palette.navy}>
        {[-84, 76].map((x) => (
          <Rect key={x} x={x} y={610} width={8} height={wallFoot - 608} />
        ))}
      </g>
      <Rect x={-100} y={590} width={200} height={40} rx={6} fill={palette.stripe} />
      <Rect x={-100} y={640} width={200} height={22} rx={4} fill={palette.stripe} />
    </>
  )
}

/** A vending machine centred on 0, with its shadow on the wall behind. */
function Vending() {
  return (
    <>
      <Rect
        x={-60}
        y={426}
        width={135}
        height={wallFoot - 424}
        fill={palette.navy}
        opacity={0.22}
      />
      <Rect x={-68} y={420} width={135} height={wallFoot + 2 - 420} fill={palette.stripe} />
      <Rect x={-68} y={420} width={135} height={14} fill={palette.navy} />
      <Rect x={-56} y={438} width={111} height={122} fill={palette.foam} />
      {[450, 486, 522].map((y, row) =>
        bottles.map((_, i) => (
          <rect
            key={`${y}-${i}`}
            x={-47 + 20 * i}
            y={y}
            width={13}
            height={28}
            rx={4}
            fill={bottles[(i + row * 2) % bottles.length]}
          />
        )),
      )}
      <Rect x={-46} y={580} width={44} height={56} fill={palette.navy} opacity={0.35} />
      <Rect x={-38} y={660} width={76} height={30} fill={palette.navy} />
    </>
  )
}

/** The ticket-gate machines about the opening's centre: body, side face, top and IC reader. */
function GateMachines() {
  return machines.map((x) => (
    <g key={x}>
      <Rect
        x={x + machineWidth}
        y={584}
        width={8}
        height={wallFoot + 2 - 584}
        fill={palette.duskGateTop}
      />
      <Rect
        x={x}
        y={584}
        width={machineWidth}
        height={wallFoot + 2 - 584}
        fill={palette.duskGate}
      />
      <Rect
        x={x - 2}
        y={572}
        width={machineWidth + 12}
        height={16}
        rx={3}
        fill={palette.duskGateTop}
      />
      <Circle cx={x + machineWidth / 2} cy={580} r={7} fill={palette.seaGlint} />
    </g>
  ))
}

/**
 * The platform floor, the length of the platform, and what stands on it:
 * a vending machine and bench by the name board, another machine past the gate, and the ticket gate's
 * machines in the wall's opening. `open` (0–1) retracts the gate's paddles
 * into their machines and turns its lamps from red to green. Static paper
 * art with its cast shadows; the glow, paddles and lamps are unfiltered.
 */
export function PlatformFloor({ walk, open }: { walk: Walk; open: MotionValue<number> }) {
  const closed = useTransform(open, [0, 1], [1, 0])
  return (
    <Strip walk={walk} speed={1} x0={wallStart} width={width}>
      <StripSvg>
        {/* floor: seams, the tactile strip and the platform edge */}
        <Rect x={wallStart} y={wallFoot} width={width} height={240} fill={palette.duskFloor} />
        {[760, 820].map((y) => (
          <Rect
            key={y}
            x={wallStart}
            y={y}
            width={width}
            height={3}
            fill={palette.duskFloorShade}
          />
        ))}
        <Rect x={wallStart} y={848} width={width} height={22} fill={palette.tactile} />
        <g fill={palette.tactileShade}>
          {dots.map((x) => (
            <circle key={x} cx={x} cy={859} r={3} />
          ))}
        </g>
        <Rect x={wallStart} y={878} width={width} height={82} fill={palette.duskFloorShade} />

        {fixtures.map(({ x, kind }) => (
          <Shift key={x} x={x}>
            {kind === 'bench' ? <Bench /> : <Vending />}
          </Shift>
        ))}
        <Shift x={gateX}>
          <GateMachines />
        </Shift>

        {/* cast shadows: the wall's foot, and under everything standing on the floor */}
        <g fill={palette.navy} opacity={0.22}>
          <Rect x={wallStart} y={wallFoot} width={gateX - opening.half - wallStart} height={18} />
          <Rect
            x={gateX + opening.half}
            y={wallFoot}
            width={wallEnd - gateX - opening.half}
            height={18}
          />
          {fixtures.map(({ x, kind }) =>
            kind === 'bench' ? (
              <ellipse key={x} cx={x} cy={728} rx={110} ry={10} />
            ) : (
              <ellipse key={x} cx={x + 4} cy={730} rx={82} ry={10} />
            ),
          )}
          {machines.map((x) => (
            <ellipse key={x} cx={gateX + x + 21} cy={729} rx={30} ry={8} />
          ))}
        </g>
      </StripSvg>
      <StripSvg paper={false}>
        {vendings.map((x) => (
          <g key={x}>
            <g className="pr-hum">
              <rect
                x={x - 56}
                y={438}
                width={111}
                height={122}
                fill={palette.duskLampGlow}
                opacity={0.25}
              />
            </g>
            <ellipse cx={x} cy={752} rx={90} ry={14} fill={palette.foam} opacity={0.15} />
          </g>
        ))}
        {/* the gate's paddles, each folding into its machine, and its lamps */}
        <g transform={`translate(${gateX} 0)`}>
          {aisles.flatMap(([a0, a1]) =>
            [
              { x: a0, originX: 0 },
              { x: a1 - paddleWidth, originX: 1 },
            ].map(({ x, originX }) => (
              <g key={x}>
                <motion.rect
                  x={x + 2}
                  y={615}
                  width={paddleWidth}
                  height={24}
                  rx={8}
                  fill={palette.navy}
                  opacity={0.3}
                  style={{ scaleX: closed, originX }}
                />
                <motion.rect
                  x={x}
                  y={612}
                  width={paddleWidth}
                  height={24}
                  rx={8}
                  fill={palette.duskPaddle}
                  style={{ scaleX: closed, originX }}
                />
              </g>
            )),
          )}
          {machines.map((x) => (
            <g key={x}>
              <motion.circle
                cx={x + machineWidth / 2}
                cy={600}
                r={5}
                fill={palette.lamp}
                style={{ opacity: closed }}
              />
              <motion.circle
                cx={x + machineWidth / 2}
                cy={600}
                r={5}
                fill={palette.duskGo}
                style={{ opacity: open }}
              />
            </g>
          ))}
        </g>
      </StripSvg>
    </Strip>
  )
}
