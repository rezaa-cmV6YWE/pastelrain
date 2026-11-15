import { palette } from '#/components/scene-kit/palette'
import { Rect } from '#/components/scene-kit/rough'

import { Strip, StripSvg, type Walk } from './strip'

/** The roof's pillars stand at the platform's edge, nearer than the wall: they pass faster. */
const speed = 1.35
const x0 = -300
const width = 2400
/**
 * One pillar left of the vending machine, one between the name board and the
 * gate, one right of the gate. None stands in front of the name board on
 * arrival or in front of the gate at the walk's end (at this speed the walk
 * shifts them by 945).
 */
const pillars = [160, 1160, 2000]

/**
 * Nearest to the camera: the roof's pillars, each with a platform-number
 * plate, sliding past in front of the wall as you walk.
 */
export function PlatformForeground({ walk }: { walk: Walk }) {
  return (
    <Strip walk={walk} speed={speed} x0={x0} width={width}>
      <StripSvg>
        {pillars.map((x) => (
          <g key={x}>
            <Rect x={x - 40} y={-60} width={80} height={1020} fill={palette.duskFascia} />
            <Rect x={x + 24} y={-60} width={16} height={1020} fill={palette.duskRoof} />
            <Rect x={x - 34} y={300} width={68} height={52} rx={4} fill={palette.foam} />
            <g textAnchor="middle" textRendering="geometricPrecision" fill={palette.navy}>
              <text x={x} y={322} className="font-sans" fontSize={13} fontWeight={700}>
                のりば
              </text>
              <text x={x} y={344} className="font-sans" fontSize={18} fontWeight={700}>
                1
              </text>
            </g>
          </g>
        ))}
      </StripSvg>
    </Strip>
  )
}
