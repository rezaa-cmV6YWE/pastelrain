import { gates, pillarSize, poleWidth, signals } from './crossing'
import { palette } from './palette'
import { SceneSvg } from './scene-svg'

/** A post's cast shadow: its foot skewed toward the lower left (light from the upper right). */
function footShadow(x: number, base: number, w: number, s: number) {
  return `M${x - w / 2} ${base} H${x + w / 2} L${x + w / 2 - 30 * s} ${base + 18 * s} H${x - w / 2 - 30 * s} Z`
}

/**
 * Road, grass, rails and the shadows of the crossing fixtures. Shares the
 * crossing's parallax depth so the fixtures stay planted on it.
 */
export function Ground() {
  return (
    <SceneSvg>
      <g filter="url(#pr-cut)">
        <rect y="662" width="1600" height="238" fill={palette.road} />
        <path d="M600 640 H940 L1600 900 H0 Z" fill={palette.road} />

        <g fill={palette.grass}>
          <path d="M0 652 L130 655 L260 650 L400 657 L520 652 L598 658 L585 680 L560 705 L530 732 L480 756 L400 782 L300 806 L210 818 L110 830 L0 834 Z" />
          <path d="M1000 660 L1120 658 L1260 662 L1400 668 L1520 663 L1600 666 V802 L1480 796 L1350 800 L1290 772 L1200 738 L1100 700 L1025 672 Z" />
        </g>
        <g fill={palette.grassShade}>
          <path d="M40 700 L140 694 L220 704 L180 716 L70 714 Z" />
          <path d="M1380 744 L1490 738 L1600 744 V766 L1460 766 Z" />
          <path d="M1180 680 L1260 676 L1300 690 L1220 694 Z" />
        </g>

        <g fill={palette.navy}>
          {/* rails run past both viewBox edges, behind the guardrails */}
          <rect x="-20" y="683" width="1640" height="6" />
          <rect x="-20" y="695" width="1640" height="5" />
          {/* shadows fall to the lower left */}
          <path d="M232 662 H382 L370 672 H220 Z" />
          {signals.map(({ x, base, scale }) => (
            <path key={`signal-${x}`} d={footShadow(x, base, poleWidth * scale, scale)} />
          ))}
          {gates.map(({ x, base, scale }) => (
            <path key={`gate-${x}`} d={footShadow(x, base, pillarSize.w * scale, scale)} />
          ))}
        </g>

        {/* cast shadow from something behind the viewer, tinting grass and road alike */}
        <path
          d="M0 765 L120 761 L260 767 L400 763 L520 771 L640 785 L700 807 L690 900 H0 Z"
          fill={palette.castShadow}
          style={{ mixBlendMode: 'multiply' }}
        />
      </g>
    </SceneSvg>
  )
}

/** Beam top, beam bottom and post foot, shared so both guardrails sit level. */
const rail = { top: 655, bottom: 690, foot: 720 }

function Guardrail({ from, to, posts }: { from: number; to: number; posts: readonly number[] }) {
  const width = to - from
  return (
    <>
      <g fill={palette.navy}>
        <path
          d={`M${from} ${rail.bottom + 10} H${to} L${to - 8} ${rail.bottom + 22} H${from - 8} Z`}
        />
        {posts.map((x) => (
          <path
            key={x}
            d={`M${x} ${rail.foot} H${x + 12} L${x + 2} ${rail.foot + 12} H${x - 10} Z`}
          />
        ))}
      </g>
      <g fill={palette.foam}>
        {posts.map((x) => (
          <rect key={x} x={x} y={rail.bottom} width="12" height={rail.foot - rail.bottom} />
        ))}
        <rect x={from} y={rail.top} width={width} height={rail.bottom - rail.top} />
      </g>
      <rect x={from} y={rail.bottom} width={width} height="6" fill={palette.grassShade} />
      <rect x={from} y={rail.top + 15} width={width} height="4" fill={palette.road} />
    </>
  )
}

/**
 * Near guardrails, nearest the viewer, both at the same height. Each runs past
 * its viewBox edge so the parallax overscan never reveals the end. The right
 * one starts past the back signal so the back fixtures' feet stay visible.
 */
export function Foreground() {
  return (
    <SceneSvg>
      <g filter="url(#pr-cut)">
        <Guardrail from={-20} to={385} posts={[30, 160, 310]} />
        <Guardrail from={1175} to={1640} posts={[1230, 1380, 1530]} />
      </g>
    </SceneSvg>
  )
}
