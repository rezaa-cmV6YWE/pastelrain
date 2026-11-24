import type { CSSProperties } from 'react'

import { palette } from '#/components/scene-kit/palette'
import { Path, Rect } from '#/components/scene-kit/rough'
import { SceneSvg } from '#/components/scene-kit/scene-svg'

/** [left x, base y, width] of each wave-crest crescent */
const crests: readonly (readonly [number, number, number])[] = [
  [1130, 612, 43],
  [1173, 606, 43],
  [1216, 614, 43],
  [1259, 608, 43],
  [1302, 616, 43],
  [1345, 610, 43],
  [1388, 604, 43],
  [1431, 612, 43],
  [1474, 608, 43],
  [1517, 614, 43],
  [940, 610, 36],
  [978, 604, 36],
  [1016, 612, 36],
  [1054, 606, 36],
]

const glintDurations = ['3s', '3.5s', '4s', '4.5s', '5s']

/** [cx, cy, width, height, seaGlint instead of foam, delay in seconds] */
const glints: readonly (readonly [number, number, number, number, boolean, number])[] = [
  [640, 578, 30, 2, false, 0],
  [720, 604, 22, 2, true, -1.75],
  [790, 586, 40, 3, false, -0.5],
  [860, 626, 26, 2, false, -2.75],
  [930, 575, 18, 2, true, -1],
  [1010, 592, 46, 3, false, -3.25],
  [1080, 630, 24, 2, false, -0.25],
  [1150, 580, 34, 2, false, -2],
  [1230, 636, 20, 2, true, -1.25],
  [1300, 586, 42, 3, false, -3],
  [1380, 628, 28, 2, false, -0.75],
  [1440, 574, 22, 2, false, -2.5],
  [1510, 640, 30, 3, true, -1.5],
  [1565, 588, 36, 2, false, -3.5],
]

export function Sea() {
  return (
    <>
      <SceneSvg>
        <Rect y="560" width="1600" height="160" fill={palette.sea} />
        <Rect y="560" width="1600" height="7" fill={palette.seaDeep} />
        <Path
          d="M0 574 H1600 V598 Q1540 606 1480 598 T1360 598 T1240 598 T1120 598 T1000 598 T880 598 T760 598 T640 598 T520 598 T400 598 T280 598 T160 598 T40 598 T-80 598 V574 Z"
          fill={palette.seaBright}
        />
        <Path
          d="M1100 645 C1150 628 1230 622 1320 628 S1500 620 1600 624 V645 Z"
          fill={palette.seaDeep}
        />
        <g fill={palette.foam}>
          {crests.map(([x, y, w]) => (
            <Path key={x} d={`M${x} ${y} a${w / 2} 14 0 0 1 ${w} 0 a${w / 2} 6 0 0 0 ${-w} 0 Z`} />
          ))}
        </g>
      </SceneSvg>
      <SceneSvg paper={false}>
        {glints.map(([cx, cy, w, h, bright, delay], i) => (
          <path
            key={cx}
            className="pr-glint"
            d={`M${cx - w / 2} ${cy} Q${cx} ${cy - h} ${cx + w / 2} ${cy} Q${cx} ${cy + h} ${cx - w / 2} ${cy} Z`}
            fill={bright ? palette.seaGlint : palette.foam}
            style={
              {
                '--glint-delay': `${delay}s`,
                '--glint-duration': glintDurations[i % glintDurations.length],
              } as CSSProperties
            }
          />
        ))}
      </SceneSvg>
    </>
  )
}
