import { palette } from './palette'
import { SceneSvg } from './scene-svg'

const stripe = 'url(#pr-stripe)'

/**
 * Fixtures are modelled once at the near side's size, in viewBox units relative
 * to their centre `x` and foot `base`, then multiplied by `scale`. `dir`
 * mirrors which way lamps and gate arms point (1 = right). The front fixtures
 * stand on the near side of the track (base below the rails, y > 700), the
 * back ones on the far side (base above them, y < 683), each on the grass
 * beside the road.
 */
type Placement = { x: number; base: number; scale: number; dir: 1 | -1 }

/** `back` signals face away: lamps and round sign are seen from behind. */
export type Signal = Placement & { facing: 'front' | 'back' }

/** A gate machine: striped housing pillar whose arm, down, reaches `reach`. */
export type Gate = Placement & { reach: number }

const frontSignal: Signal = { x: 408, base: 705, scale: 1, dir: 1, facing: 'front' }
const backSignal: Signal = { x: 1135, base: 680, scale: 0.7, dir: -1, facing: 'back' }
const frontGate: Gate = { x: 470, base: 728, scale: 1.3, dir: 1, reach: 1010 }
const backGate: Gate = { x: 1080, base: 676, scale: 0.75, dir: -1, reach: 560 }

export const signals: readonly Signal[] = [frontSignal, backSignal]
export const gates: readonly Gate[] = [frontGate, backGate]

export const poleWidth = 10
export const pillarSize = { w: 36, h: 56 }

function lampsOf({ x, base, scale, dir }: Signal) {
  return (
    [
      [193, 'pr-lamp-a'],
      [139, 'pr-lamp-b'],
    ] as const
  ).map(([rise, phase]) => ({
    cx: x + 54 * scale * dir,
    cy: base - rise * scale,
    housing: 16 * scale,
    lit: 11 * scale,
    glow: 22 * scale,
    phase,
  }))
}

function Crossbuck({ cx, cy, w, h }: { cx: number; cy: number; w: number; h: number }) {
  return (
    <g fill={stripe}>
      {[40, -40].map((angle) => (
        <rect
          key={angle}
          x={cx - w / 2}
          y={cy - h / 2}
          width={w}
          height={h}
          transform={`rotate(${angle} ${cx} ${cy})`}
        />
      ))}
    </g>
  )
}

function SignalArt({ signal }: { signal: Signal }) {
  const { x, base, scale: s, dir, facing } = signal
  const poleW = poleWidth * s
  const discX = x - 3 * s * dir
  const discY = base - 167 * s
  return (
    <g>
      <rect
        x={x - poleW / 2}
        y={base - 310 * s}
        width={poleW}
        height={310 * s}
        fill={palette.foam}
      />
      {facing === 'front' ? (
        <>
          <circle cx={discX} cy={discY} r={30 * s} fill={palette.stripe} />
          <circle cx={discX} cy={discY} r={24 * s} fill={palette.foam} />
        </>
      ) : (
        <>
          {/* bare back of the sign with its mounting bracket */}
          <circle cx={discX} cy={discY} r={30 * s} fill={palette.cloudShade} />
          <rect
            x={discX - 22 * s}
            y={discY - 3 * s}
            width={44 * s}
            height={6 * s}
            fill={palette.navy}
          />
        </>
      )}
      <Crossbuck cx={x} cy={base - 260 * s} w={90 * s} h={14 * s} />
      {lampsOf(signal).map(({ cx, cy, housing, lit }) => {
        const visor = housing + 4 * s
        const armX = dir === 1 ? x + 5 * s : cx - 8 * s
        return (
          <g key={cy}>
            <rect
              x={armX}
              y={cy - 3 * s}
              width={Math.abs(cx - x) + 3 * s}
              height={6 * s}
              fill={palette.navy}
            />
            <path
              d={`M${cx - visor} ${cy} A${visor} ${visor} 0 0 1 ${cx + visor} ${cy} Z`}
              fill={palette.navy}
            />
            <circle cx={cx} cy={cy} r={housing} fill={palette.navy} />
            {facing === 'front' && <circle cx={cx} cy={cy} r={lit} fill={palette.stripe} />}
          </g>
        )
      })}
    </g>
  )
}

function GateArt({ gate }: { gate: Gate }) {
  const { x, base, scale: s, dir, reach } = gate
  const w = pillarSize.w * s
  const h = pillarSize.h * s
  const top = base - h
  const hubY = top + 10 * s
  const armH = 12 * s
  const counterweight = 16 * s
  return (
    <g>
      <rect x={x - w / 2} y={top} width={w} height={h} fill={stripe} />
      <rect
        x={x - w / 2 - 2 * s}
        y={top - 6 * s}
        width={w + 4 * s}
        height={6 * s}
        fill={palette.navy}
      />
      {/* counterweight behind the pivot */}
      <rect
        x={dir === 1 ? x - w / 2 - counterweight : x + w / 2}
        y={hubY - 7 * s}
        width={counterweight}
        height={14 * s}
        fill={palette.navy}
      />
      <rect
        x={Math.min(x, reach)}
        y={hubY - armH / 2}
        width={Math.abs(reach - x)}
        height={armH}
        fill={stripe}
      />
      <rect
        x={Math.min(x, reach)}
        y={hubY + armH / 2}
        width={Math.abs(reach - x)}
        height={2 * s}
        fill={palette.navy}
      />
      <circle cx={x} cy={hubY} r={8 * s} fill={palette.navy} />
    </g>
  )
}

export function Crossing() {
  return (
    <>
      {/* glow of back-facing lamps, spilling around their housings */}
      <SceneSvg paper={false}>
        {signals
          .filter((signal) => signal.facing === 'back')
          .flatMap(lampsOf)
          .map(({ cx, cy, housing, phase }) => (
            <g key={`${cx}-${cy}`} className={phase}>
              <circle
                cx={cx}
                cy={cy}
                r={housing + 6}
                fill={palette.lamp}
                opacity={0.75}
                filter="url(#pr-glow)"
              />
            </g>
          ))}
      </SceneSvg>
      <SceneSvg>
        <g filter="url(#pr-cut)">
          {/* electrical box */}
          <rect x="232" y="578" width="150" height="84" fill={palette.navy} />
          <path d="M240 570 H390 L382 578 H232 Z" fill={palette.stripe} />
          <rect x="246" y="590" width="58" height="60" fill={palette.stripe} opacity={0.55} />

          {/* painter's order: far side of the track first */}
          <GateArt gate={backGate} />
          <SignalArt signal={backSignal} />
          <SignalArt signal={frontSignal} />
          <GateArt gate={frontGate} />
        </g>
      </SceneSvg>
      {/* lit faces of front-facing lamps */}
      <SceneSvg paper={false}>
        {signals
          .filter((signal) => signal.facing === 'front')
          .flatMap(lampsOf)
          .map(({ cx, cy, lit, glow, phase }) => (
            <g key={`${cx}-${cy}`} className={phase}>
              <circle
                cx={cx}
                cy={cy}
                r={glow}
                fill={palette.lamp}
                opacity={0.45}
                filter="url(#pr-glow)"
              />
              <circle cx={cx} cy={cy} r={lit} fill={palette.lamp} />
            </g>
          ))}
      </SceneSvg>
    </>
  )
}
