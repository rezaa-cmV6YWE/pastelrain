import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'

import { palette } from '#/components/scene-kit/palette'
import { Circle, Path, Rect } from '#/components/scene-kit/rough'
import { PaperGrain, SceneDefs, SceneSvg } from '#/components/scene-kit/scene-svg'
import { platformStop, StationSign, type Sign } from '#/components/train-scene/stations'

const horizon = 470
/** Right of the board, so the sun shows beside it in landscape. */
const sunX = 1180
/** The platform lamp's centre, left of the board. */
const lampX = 470
/** The board's platform's top, and its edge's bottom (`StationSign`). */
const platformTop = 545
const platformEdge = 606

/** The platform past the board's own 600 units, plain like the board's. */
function Platform() {
  return (
    <>
      <rect x={0} y={platformTop} width={1600} height={55} fill={palette.platform} />
      <rect x={0} y={platformTop} width={1600} height={8} fill={palette.tactile} />
      <rect x={0} y={600} width={1600} height={6} fill={palette.navy} />
    </>
  )
}

/** [x]: the sleepers' centres along the track bed. */
const sleepers = Array.from({ length: 16 }, (_, i) => 50 + 100 * i)

/**
 * The quiet halt, a still paper-cut scene at dusk: the sky fading to the
 * glow at the horizon, the sun half under the sea, the board's platform
 * across the whole width, and the empty track in front of it, where the
 * page's text stands. Static, so it is rough paper with the `pr-paper`
 * shadow; the board is the train scene's (`StationSign`).
 */
function Backdrop({ sign }: { sign: Sign }) {
  return (
    <SceneSvg>
      <linearGradient
        id="pr-halt-sky"
        gradientUnits="userSpaceOnUse"
        x1={0}
        y1={0}
        x2={0}
        y2={horizon}
      >
        <stop offset={0.2} stopColor={palette.duskSkyTop} />
        <stop offset={0.7} stopColor={palette.duskSkyMid} />
        <stop offset={1} stopColor={palette.duskHorizon} />
      </linearGradient>
      <rect x={0} y={-60} width={1600} height={horizon + 60} fill="url(#pr-halt-sky)" />
      <circle cx={sunX} cy={horizon} r={110} fill={palette.duskSun} opacity={0.12} />
      <circle cx={sunX} cy={horizon} r={70} fill={palette.duskSun} opacity={0.25} />
      <Circle cx={sunX} cy={horizon} r={46} fill={palette.duskSun} />
      {[
        `M180 120 C260 98 430 90 540 96 C610 100 660 110 680 122 C560 132 300 134 180 120 Z`,
        `M1000 70 C1080 54 1220 48 1340 52 C1420 55 1480 64 1500 74 C1380 84 1120 86 1000 70 Z`,
        `M${sunX - 160} 410 C${sunX - 110} 398 ${sunX - 10} 392 ${sunX + 50} 396 C${sunX + 84} 399 ${sunX + 100} 404 ${sunX + 104} 410 C${sunX + 40} 418 ${sunX - 90} 418 ${sunX - 160} 410 Z`,
      ].map((d) => (
        <g key={d}>
          <g transform="translate(6 5)">
            <Path d={d} fill={palette.duskCloudShade} />
          </g>
          <Path d={d} fill={palette.duskCloud} />
        </g>
      ))}
      <Rect x={-20} y={horizon} width={1640} height={100} fill={palette.duskSea} />

      {/*
       * the track bed, sleepers and rails in front of the platform, kept dark
       * and dim: the text stands on them
       */}
      <Rect x={-20} y={platformEdge} width={1640} height={320} fill={palette.duskRoof} />
      <g fill={palette.nightRockLight}>
        {sleepers.map((x) => (
          <Path key={x} d={`M${x - 14} 660 H${x + 14} L${x + 22} 820 H${x - 22} Z`} />
        ))}
      </g>
      {[672, 790].map((y, i) => (
        <g key={y}>
          <Rect x={-20} y={y} width={1640} height={8 + 3 * i} fill={palette.duskFascia} />
          {/* the rail's head, catching the last light */}
          <rect x={-20} y={y} width={1640} height={2} fill={palette.duskWainscot} />
        </g>
      ))}

      {/* a lamp post on the platform, left of the board, clear of the sunset */}
      <Rect x={lampX - 4} y={300} width={8} height={245} fill={palette.duskFascia} />
      <Rect x={lampX - 30} y={292} width={60} height={12} rx={4} fill={palette.duskRoof} />
      <Platform />
      <StationSign cx={800} stop={sign} />
    </SceneSvg>
  )
}

/** [cx, cy, r]: the first stars. */
const stars = Array.from({ length: 11 }, (_, i) => [
  70 + 150 * i + ((i * 53) % 70),
  20 + ((i * 37) % 120),
  1.5 + (i % 3) * 0.5,
])

/** [cx, cy, rx, ry]: the sun's path on the sea. */
const glow = [
  [sunX, 482, 44, 2.6],
  [sunX - 12, 497, 36, 2.2],
  [sunX + 10, 512, 28, 2],
  [sunX - 6, 527, 20, 1.7],
]

/**
 * What glints and glows, unfiltered so the paper doesn't repaint with it:
 * the stars, the sun's path on the sea and the lamp's light. `flicker`
 * gives the lamp a failing tube (`pr-flicker`).
 */
function Lights({ flicker }: { flicker: boolean }) {
  return (
    <SceneSvg paper={false}>
      {stars.map(([cx, cy, r], i) => (
        <circle
          key={cx}
          className="pr-glint"
          style={
            {
              '--glint-duration': `${4 + (i % 4)}s`,
              '--glint-delay': `${-((i * 1.3) % 5)}s`,
            } as CSSProperties
          }
          cx={cx}
          cy={cy}
          r={r}
          fill={palette.foam}
        />
      ))}
      {glow.map(([cx, cy, rx, ry], i) => (
        <ellipse
          key={cy}
          className="pr-glint"
          style={
            {
              '--glint-duration': `${3 + (i % 3) * 0.8}s`,
              '--glint-delay': `${-i * 1.2}s`,
            } as CSSProperties
          }
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={palette.duskSeaGlow}
        />
      ))}
      <g className={flicker ? 'pr-flicker' : undefined}>
        <circle cx={lampX} cy={310} r={60} fill={palette.duskLampGlow} opacity={0.16} />
        <circle cx={lampX} cy={310} r={26} fill={palette.duskLampGlow} opacity={0.3} />
        <rect x={lampX - 24} y={304} width={48} height={6} rx={3} fill={palette.duskLampGlow} />
      </g>
    </SceneSvg>
  )
}

const action =
  'inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium outline-offset-3 outline-(--fg) transition duration-200 hover:-translate-y-0.5 focus-visible:outline-2 sm:text-base'

/** Back to the opening crossing: the page's way out. */
function Home() {
  return (
    <Link to="/" className={`${action} bg-(--fg) text-(--ink)`}>
      ◂ Back to the start
    </Link>
  )
}

/**
 * A page off the line: the halt's board (`sign`) over the empty track, with
 * the heading, a line of text and the way out on the track bed, where the
 * dark ground keeps the light text readable. It doesn't scroll, so the
 * fixed view is `--view-h` tall and the text keeps to one `--screen`.
 */
function Halt({
  sign,
  heading,
  flicker = false,
  children,
  actions,
}: {
  sign: Sign
  heading: string
  flicker?: boolean
  children: ReactNode
  actions: ReactNode
}) {
  return (
    <main
      className="relative font-sans text-(--fg)"
      style={{ '--fg': palette.foam, '--ink': palette.navy } as CSSProperties}
    >
      <SceneDefs />
      <div
        className="fixed top-0 left-0 h-(--view-h) w-full overflow-clip"
        style={{ background: palette.duskRoof }}
      >
        <Backdrop sign={sign} />
        <Lights flicker={flicker} />
      </div>
      <div className="relative z-10 flex min-h-(--screen) flex-col items-center justify-end gap-3 px-6 pb-[max(1.5rem,calc(var(--screen)*0.06))] text-center sm:gap-4">
        <h1 className="m-0 text-[clamp(1.4rem,3.6vw,2.5rem)] leading-tight font-semibold">
          {heading}
        </h1>
        <p className="m-0 max-w-[40ch] text-[clamp(0.9rem,1.5vw,1.1rem)] leading-relaxed opacity-85">
          {children}
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-3">{actions}</div>
      </div>
      <PaperGrain />
    </main>
  )
}

/** 迷子, "lost": a stop that isn't on the line. */
const lostSign: Sign = {
  code: '404',
  kana: 'まいご',
  name: 'Maigo',
  role: 'Not on this line',
  dates: 'Page not found',
  prev: ['はじまり', 'Start'],
  next: ['？', 'Nowhere'],
}

/** The router's not-found page (`defaultNotFoundComponent`). */
export function NotFoundPage() {
  return (
    <Halt sign={lostSign} heading="This stop isn’t on the line." actions={<Home />}>
      The page you were looking for doesn’t exist, or the line has moved on. The train back leaves
      from the start.
    </Halt>
  )
}

/** 運休, the railway's "service suspended" notice. */
const suspendedSign: Sign = {
  code: '500',
  kana: 'うんきゅう',
  name: 'Unkyū',
  role: 'Service suspended',
  dates: 'Please try again',
  prev: ['はじまり', 'Start'],
  next: platformStop,
}

/**
 * The router's error page (`defaultErrorComponent`). "Try again" invalidates
 * the router, which reloads the matches and resets the error boundary. The
 * error's message shows only in development.
 */
export function ErrorPage({ error }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <Halt
      sign={suspendedSign}
      heading="The train has stopped between stations."
      flicker
      actions={
        <>
          <button
            type="button"
            className={`${action} cursor-pointer border border-(--fg) bg-transparent text-(--fg)`}
            onClick={() => void router.invalidate()}
          >
            Try again
          </button>
          <Home />
        </>
      }
    >
      Something went wrong on our side. Service should resume shortly.
      {import.meta.env.DEV && (
        <code className="mt-2 block font-mono text-xs break-words opacity-75">
          {error instanceof Error ? error.message : String(error)}
        </code>
      )}
    </Halt>
  )
}
