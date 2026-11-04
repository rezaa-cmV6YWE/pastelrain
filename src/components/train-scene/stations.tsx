import { motion, type MotionValue } from 'motion/react'

import { palette } from '#/components/scene-kit/palette'
import { SceneSvg } from '#/components/scene-kit/scene-svg'

/**
 * The stops on the way: past work, newest first, shown as Japanese station
 * name boards. `code` is the stop's number along the line, in that order.
 * `run` is the scene's station-run offset (viewBox units) at which this
 * stop's sign is centred in the middle window.
 */
export const stops = [
  {
    code: '01',
    kana: 'ダブラースタジオ',
    name: 'Doubler Studio',
    role: 'Frontend Developer',
    dates: 'Dec 2023 – Present',
    prev: ['はじまり', 'Start'],
    next: ['アルカマヤ', 'PT. Arkamaya'],
    run: 1400,
  },
  {
    code: '02',
    kana: 'アルカマヤ',
    name: 'PT. Arkamaya',
    role: 'Intern',
    dates: 'Oct 2019 – Jan 2020',
    prev: ['ダブラースタジオ', 'Doubler Studio'],
    next: ['つぎは…', 'Next stop'],
    run: 2800,
  },
] as const

type Stop = (typeof stops)[number]

/** The middle window's centre, where each sign comes to rest. */
const windowCentre = 800

/** A piece of the sign's pipe frame: foam over an offset shade back sheet. */
function Pipe(props: { x: number; y: number; width: number; height: number; rx?: number }) {
  return (
    <>
      <rect {...props} x={props.x + 3} y={props.y + 4} fill={palette.cloudShade} />
      <rect {...props} fill={palette.foam} />
    </>
  )
}

function StationSign({ cx, stop }: { cx: number; stop: Stop }) {
  const [prevKana, prevName] = stop.prev
  const [nextKana, nextName] = stop.next
  return (
    // geometricPrecision lays the text out at its own size rather than its
    // on-screen one; without it Chrome laid the signs' text out again on every
    // scrolled frame, holding the book section under 20 fps
    <g className="font-sans" textAnchor="middle" textRendering="geometricPrecision">
      {/* platform: narrower than the gap between stops, so open shore shows between */}
      <rect x={cx - 300} y={545} width={600} height={55} fill={palette.platform} />
      <rect x={cx - 300} y={545} width={600} height={8} fill={palette.tactile} />
      <rect x={cx - 300} y={600} width={600} height={6} fill={palette.navy} />

      {/* pipe frame */}
      <Pipe x={cx - 170} y={280} width={12} height={265} />
      <Pipe x={cx + 158} y={280} width={12} height={265} />
      <Pipe x={cx - 170} y={280} width={340} height={12} rx={6} />
      <Pipe x={cx - 158} y={500} width={316} height={10} />

      {/* board */}
      <rect x={cx - 147} y={304} width={300} height={190} fill={palette.cloudShade} />
      <rect x={cx - 150} y={300} width={300} height={190} fill={palette.foam} />

      <text
        x={cx}
        y={352}
        // sized to clear the station-number badge at the right
        fontSize={Math.min(44, 190 / [...stop.kana].length)}
        fontWeight={700}
        fill={palette.navy}
      >
        {stop.kana}
      </text>
      <text x={cx} y={386} fontSize={18} fontWeight={500} fill={palette.navy}>
        {stop.name}
      </text>

      {/* station number badge */}
      <circle cx={cx + 118} cy={334} r={20} fill={palette.lamp} />
      <circle cx={cx + 118} cy={334} r={16} fill={palette.foam} />
      <g fontWeight={700} fill={palette.navy}>
        <text x={cx + 118} y={330} fontSize={11}>
          R
        </text>
        <text x={cx + 118} y={346} fontSize={13}>
          {stop.code}
        </text>
      </g>

      {/* line band with the role */}
      <polygon
        points={`${cx - 138},420 ${cx - 122},405 ${cx + 122},405 ${cx + 138},420 ${cx + 122},435 ${cx - 122},435`}
        fill={palette.lineGreen}
      />
      <circle cx={cx - 112} cy={420} r={6} fill={palette.foam} />
      <circle cx={cx + 112} cy={420} r={6} fill={palette.foam} />
      <text x={cx} y={426} fontSize={16} fontWeight={700} fill={palette.foam}>
        {stop.role}
      </text>

      {/* previous and next stations */}
      <g fill={palette.navy}>
        <g textAnchor="start">
          <text x={cx - 138} y={458} fontSize={13}>
            {prevKana}
          </text>
          <text x={cx - 138} y={474} fontSize={10}>
            {prevName}
          </text>
        </g>
        <g textAnchor="end">
          <text x={cx + 138} y={458} fontSize={13}>
            {nextKana}
          </text>
          <text x={cx + 138} y={474} fontSize={10}>
            {nextName}
          </text>
        </g>
      </g>

      {/* dates plate */}
      <rect x={cx - 90} y={512} width={180} height={26} fill={palette.navy} />
      <text x={cx} y={530} fontSize={13} fill={palette.foam}>
        {stop.dates}
      </text>
    </g>
  )
}

/**
 * The platforms sliding past the window. `run` moves them right as the train
 * pulls in (the train travels screen-left); no filters, since they move.
 */
export function Stations({ run }: { run: MotionValue<number> }) {
  return (
    <SceneSvg paper={false}>
      <motion.g style={{ x: run }}>
        {stops.map((stop) => (
          <StationSign key={stop.code} cx={windowCentre - stop.run} stop={stop} />
        ))}
      </motion.g>
    </SceneSvg>
  )
}
