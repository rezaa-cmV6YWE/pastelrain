import { palette } from '#/components/scene-kit/palette'
import { Circle, Path, Rect } from '#/components/scene-kit/rough'
import { stops } from '#/components/train-scene/stations'

import { gateX, nameX, opening, wallEnd, wallFoot, wallStart } from './layout'
import { Strip, StripSvg, type Walk } from './strip'

const width = wallEnd - wallStart
const [gate0, gate1] = [gateX - opening.half, gateX + opening.half]

const wall = `M${wallStart} 180H${wallEnd}V${wallFoot}H${wallStart}Z M${gate0} ${opening.top}H${gate1}V${wallFoot}H${gate0}Z`

/** The roof's scalloped eave: semicircles of r 20 along y 150, drawn right to left. */
const roof = `M${wallStart} 110H${wallEnd}V150${Array.from(
  { length: Math.ceil(width / 40) },
  (_, i) => `A20 20 0 0 1 ${wallEnd - 40 * (i + 1)} 150`,
).join('')}Z`

/** The wall either side of the opening, as [x0, x1]. */
const sides = [
  [wallStart, gate0],
  [gate1, wallEnd],
] as const

/** Vertical joints every 300 units, except in the opening. */
const joints = Array.from({ length: Math.ceil(width / 300) }, (_, i) => 300 * i).filter(
  (x) => x < gate0 - 20 || x > gate1 + 20,
)

/** Ceiling lamps: either side of the name board, and the exit's. */
const lamps = [nameX - 330, nameX + 330, gateX]

const lastStop = stops[stops.length - 1].name

/**
 * The station wall facing the camera, the length of the platform: the
 * roof's eave, the station-name board (this stop is "Today"), the lamps, and
 * at the far end the opening to the ticket gate under its exit sign. The
 * lamps' light is a separate, unfiltered SVG clipped to the wall; the exit's
 * lamp flickers.
 */
export function StationWall({ walk }: { walk: Walk }) {
  return (
    <Strip walk={walk} speed={1} x0={wallStart} width={width}>
      <StripSvg>
        {/* roof: the fascia shows below the scalloped eave */}
        <Rect x={wallStart} y={140} width={width} height={42} fill={palette.duskFascia} />
        <Path d={roof} fill={palette.duskRoof} />

        {/* wall, wainscot, seam and joints */}
        <Path d={wall} fillRule="evenodd" fill={palette.duskWall} />
        {sides.map(([x0, x1]) => (
          <g key={x0}>
            <Rect
              x={x0}
              y={620}
              width={x1 - x0}
              height={wallFoot - 620}
              fill={palette.duskWainscot}
            />
            <Rect x={x0} y={400} width={x1 - x0} height={3} fill={palette.duskWallShade} />
          </g>
        ))}
        {joints.map((x) => (
          <Rect key={x} x={x} y={182} width={3} height={438} fill={palette.duskWallShade} />
        ))}
        {/* the building's far end, turned from the lamps: the first thing to pull in */}
        <Rect
          x={wallEnd - 28}
          y={150}
          width={28}
          height={wallFoot - 150}
          fill={palette.duskWallShade}
        />

        {/* under the eave */}
        <Rect x={wallStart} y={182} width={width} height={48} fill={palette.navy} opacity={0.22} />

        {/* drop shadows of the name board and the exit sign: the lamps are above */}
        <g fill={palette.navy} opacity={0.22}>
          <Rect x={nameX - 124} y={254} width={260} height={132} />
          <Rect x={gateX - 94} y={294} width={200} height={34} />
        </g>

        {/* the opening's frame */}
        <g fill={palette.duskRoof}>
          <Rect x={gate0 - 12} y={opening.top - 12} width={264} height={16} />
          <Rect x={gate0 - 12} y={opening.top - 12} width={12} height={wallFoot - 318} />
          <Rect x={gate1} y={opening.top - 12} width={12} height={wallFoot - 318} />
        </g>

        <g className="font-sans" textAnchor="middle" textRendering="geometricPrecision">
          {/* exit sign */}
          <Rect x={gateX - 100} y={280} width={200} height={34} fill={palette.tactile} />
          <text x={gateX} y={304} fontSize={20} fontWeight={700} fill={palette.navy}>
            出口 Exit →
          </text>

          {/* station-name board */}
          {[nameX - 100, nameX + 100].map((x) => (
            <Rect key={x} x={x - 2} y={182} width={4} height={58} fill={palette.navy} />
          ))}
          <g transform="translate(3 4)">
            <Rect x={nameX - 130} y={240} width={260} height={132} fill={palette.cloudShade} />
          </g>
          <Rect x={nameX - 130} y={240} width={260} height={132} fill={palette.foam} />
          <text x={nameX} y={300} fontSize={48} fontWeight={700} fill={palette.navy}>
            いま
          </text>
          <text x={nameX} y={326} fontSize={18} fontWeight={500} fill={palette.navy}>
            Today
          </text>
          <Rect x={nameX - 130} y={340} width={260} height={22} fill={palette.lineGreen} />
          <g fontSize={12} fontWeight={700} fill={palette.foam}>
            <text x={nameX - 122} y={355} textAnchor="start">
              ◂ {lastStop}
            </text>
            <text x={nameX + 122} y={355} textAnchor="end">
              うみ The beach ▸
            </text>
          </g>
        </g>

        {/* lamps: bracket, shade, bulb */}
        {lamps.map((x) => (
          <g key={x}>
            <Rect x={x - 2} y={182} width={4} height={14} fill={palette.navy} />
            <Path d={`M${x - 10} 196H${x + 10}L${x + 22} 214H${x - 22}Z`} fill={palette.navy} />
            <Circle cx={x} cy={214} r={6} fill={palette.duskLampGlow} />
          </g>
        ))}
      </StripSvg>
      <StripSvg paper={false}>
        <clipPath id="pr-platform-wall">
          <path d={wall} clipRule="evenodd" />
        </clipPath>
        <g clipPath="url(#pr-platform-wall)" fill={palette.duskLampGlow}>
          {lamps.map((x) => (
            <g key={x} className={x === gateX ? 'pr-flicker' : undefined}>
              <ellipse cx={x} cy={330} rx={200} ry={170} opacity={0.16} />
              <ellipse cx={x} cy={330} rx={120} ry={100} opacity={0.14} />
              <circle cx={x} cy={214} r={26} opacity={0.5} />
            </g>
          ))}
        </g>
      </StripSvg>
    </Strip>
  )
}
