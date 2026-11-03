import { createContext, use, type ReactNode, type SVGProps } from 'react'

/**
 * Paper-cut edges baked into the geometry. `Rect`, `Circle` and `Path` draw
 * their shape as a `<path>` whose outline is sampled every few units and
 * nudged by smooth 2D noise: the wobble the `#pr-cut` displacement filter
 * gives the HTML text, at the same strength. A filter re-runs over every pixel
 * whenever its layer repaints or is drawn at a new zoom, which made the
 * crossing's zoom and the rush into the train window stutter; a path costs
 * nothing extra to redraw.
 *
 * The noise depends on position (in the frame of the nearest `Shift`, else the
 * SVG's own units), so shapes that touch wobble together, and identical input
 * gives an identical outline (a clip path matches the shape it cuts). It uses
 * only integer hashing and plain arithmetic, so the server and the browser
 * write the same path data. Outlines are cached by input: use these for art
 * whose geometry is fixed, not for shapes re-rendered with new geometry every
 * frame (move a group around them instead).
 */

/** Units between samples along an edge: half the finer noise octave's wavelength. */
const step = 7
/** How far, in units, the sampled outline may stray from a curve before the noise. */
const tolerance = 0.15
/** Peak-to-peak wobble and noise frequency, as the filter's `scale` and `baseFrequency`. */
const amplitude = 4
const frequency = 0.035

type Point = readonly [number, number]

function hash(x: number, y: number, seed: number) {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(seed, 0x9e3779b1)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return ((h ^ (h >>> 16)) >>> 0) / 0x100000000
}

const smooth = (t: number) => t * t * (3 - 2 * t)

function valueNoise(x: number, y: number, seed: number) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const u = smooth(x - x0)
  const v = smooth(y - y0)
  const a = hash(x0, y0, seed)
  const b = hash(x0 + 1, y0, seed)
  const c = hash(x0, y0 + 1, seed)
  const d = hash(x0 + 1, y0 + 1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

/** Two octaves of value noise, centred on 0: within ±amplitude / 2. */
function wobble(x: number, y: number, seed: number) {
  const coarse = valueNoise(x * frequency, y * frequency, seed)
  const fine = valueNoise(x * frequency * 2, y * frequency * 2, seed + 1)
  return amplitude * ((2 * coarse + fine) / 3 - 0.5)
}

/*
 * Flattening: each segment is sampled on its own (its end point included), so
 * corners stay sharp, every `step` units and densely enough on curves to stay
 * within `tolerance`.
 */

function line(out: Point[], [x0, y0]: Point, to: Point) {
  const n = Math.max(1, Math.ceil(Math.hypot(to[0] - x0, to[1] - y0) / step))
  for (let i = 1; i < n; i++) out.push([x0 + ((to[0] - x0) * i) / n, y0 + ((to[1] - y0) * i) / n])
  out.push(to)
}

const dist = (a: Point, b: Point) => Math.hypot(b[0] - a[0], b[1] - a[1])

/** Second difference of three control points: how hard a Bézier bends. */
const bend = (a: Point, b: Point, c: Point) =>
  Math.hypot(a[0] - 2 * b[0] + c[0], a[1] - 2 * b[1] + c[1])

function cubic(out: Point[], p0: Point, p1: Point, p2: Point, p3: Point) {
  const length = (dist(p0, p1) + dist(p1, p2) + dist(p2, p3) + dist(p0, p3)) / 2
  const curvature = Math.max(bend(p0, p1, p2), bend(p1, p2, p3))
  const n = Math.max(
    1,
    Math.ceil(length / step),
    Math.ceil(Math.sqrt((0.75 * curvature) / tolerance)),
  )
  for (let i = 1; i < n; i++) {
    const t = i / n
    const s = 1 - t
    const [a, b, c, d] = [s * s * s, 3 * s * s * t, 3 * s * t * t, t * t * t]
    out.push([
      a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
      a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    ])
  }
  out.push(p3)
}

function quad(out: Point[], p0: Point, p1: Point, p2: Point) {
  const length = (dist(p0, p1) + dist(p1, p2) + dist(p0, p2)) / 2
  const n = Math.max(
    1,
    Math.ceil(length / step),
    Math.ceil(Math.sqrt(bend(p0, p1, p2) / (4 * tolerance))),
  )
  for (let i = 1; i < n; i++) {
    const t = i / n
    const s = 1 - t
    const [a, b, c] = [s * s, 2 * s * t, t * t]
    out.push([a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]])
  }
  out.push(p2)
}

/** An SVG elliptical arc, via its centre parameterisation (SVG 2, appendix B.2.4). */
function arc(
  out: Point[],
  from: Point,
  radii: Point,
  rotation: number,
  large: boolean,
  sweep: boolean,
  to: Point,
) {
  let [rx, ry] = [Math.abs(radii[0]), Math.abs(radii[1])]
  if (from[0] === to[0] && from[1] === to[1]) return
  if (!rx || !ry) return line(out, from, to)
  const phi = (rotation * Math.PI) / 180
  const [cos, sin] = [Math.cos(phi), Math.sin(phi)]
  const dx = (from[0] - to[0]) / 2
  const dy = (from[1] - to[1]) / 2
  const x1 = cos * dx + sin * dy
  const y1 = -sin * dx + cos * dy
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)
  if (lambda > 1) {
    rx *= Math.sqrt(lambda)
    ry *= Math.sqrt(lambda)
  }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1
  const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den))
  const cx1 = (k * rx * y1) / ry
  const cy1 = (-k * ry * x1) / rx
  const cx = cos * cx1 - sin * cy1 + (from[0] + to[0]) / 2
  const cy = sin * cx1 + cos * cy1 + (from[1] + to[1]) / 2
  const start = Math.atan2((y1 - cy1) / ry, (x1 - cx1) / rx)
  let delta = Math.atan2((-y1 - cy1) / ry, (-x1 - cx1) / rx) - start
  if (sweep && delta < 0) delta += 2 * Math.PI
  if (!sweep && delta > 0) delta -= 2 * Math.PI
  const r = Math.max(rx, ry)
  const maxTurn = 2 * Math.acos(Math.max(-1, 1 - tolerance / r))
  const turn = Math.abs(delta)
  const n = Math.max(1, Math.ceil((turn * r) / step), Math.ceil(turn / maxTurn))
  for (let i = 1; i < n; i++) {
    const angle = start + (delta * i) / n
    const [ex, ey] = [rx * Math.cos(angle), ry * Math.sin(angle)]
    out.push([cos * ex - sin * ey + cx, sin * ex + cos * ey + cy])
  }
  out.push(to)
}

type Subpath = { points: Point[]; closed: boolean }

const token = /[a-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi

/** Path data as outlines of sampled points, with absolute coordinates. */
function outline(d: string): Subpath[] {
  const tokens = d.match(token) ?? []
  const subpaths: Subpath[] = []
  let at = 0
  const next = () => Number(tokens[at++])
  let command = ''
  let previous = ''
  let current: Point = [0, 0]
  let start: Point = [0, 0]
  // the last Bézier control point, reflected by S and T
  let control: Point = [0, 0]
  let path: Subpath | undefined
  while (at < tokens.length) {
    if (/[a-z]/i.test(tokens[at])) command = tokens[at++]
    else if (!command) {
      at++
      continue
    }
    const relative = command !== command.toUpperCase()
    const kind = command.toUpperCase()
    const [ox, oy] = relative ? current : [0, 0]
    const pointArg = (): Point => [ox + next(), oy + next()]
    if (kind === 'Z') {
      if (path) path.closed = true
      path = undefined
      current = start
      previous = kind
      // numbers after Z are malformed; skip them rather than loop on them
      command = ''
      continue
    }
    if (kind === 'M') {
      current = start = pointArg()
      path = { points: [current], closed: false }
      subpaths.push(path)
      // further coordinate pairs are lines
      command = relative ? 'l' : 'L'
      previous = kind
      continue
    }
    if (!path) {
      path = { points: [current], closed: false }
      subpaths.push(path)
    }
    const out = path.points
    let to: Point
    switch (kind) {
      case 'L':
        to = pointArg()
        line(out, current, to)
        break
      case 'H':
        to = [ox + next(), current[1]]
        line(out, current, to)
        break
      case 'V':
        to = [current[0], oy + next()]
        line(out, current, to)
        break
      case 'C': {
        const c1 = pointArg()
        control = pointArg()
        to = pointArg()
        cubic(out, current, c1, control, to)
        break
      }
      case 'S': {
        const c1: Point =
          previous === 'C' || previous === 'S'
            ? [2 * current[0] - control[0], 2 * current[1] - control[1]]
            : current
        control = pointArg()
        to = pointArg()
        cubic(out, current, c1, control, to)
        break
      }
      case 'Q':
        control = pointArg()
        to = pointArg()
        quad(out, current, control, to)
        break
      case 'T':
        control =
          previous === 'Q' || previous === 'T'
            ? [2 * current[0] - control[0], 2 * current[1] - control[1]]
            : current
        to = pointArg()
        quad(out, current, control, to)
        break
      case 'A': {
        const radii: Point = [next(), next()]
        const rotation = next()
        const large = next() !== 0
        const sweep = next() !== 0
        to = pointArg()
        arc(out, current, radii, rotation, large, sweep, to)
        break
      }
      default:
        throw new Error(`Unsupported path command "${command}" in "${d}"`)
    }
    current = to
    previous = kind
  }
  return subpaths
}

/** A coordinate in tenths of a unit, as compact path data: 15 → "1.5", -3 → "-.3". */
function format(tenths: number) {
  const digits = String(Math.abs(tenths) / 10)
  return (tenths < 0 ? '-' : '') + (digits.startsWith('0.') ? digits.slice(1) : digits)
}

/** `d` with every outline sampled and wobbled; coordinates relative, to a tenth. */
function roughen(d: string, [ox, oy]: Point) {
  let data = ''
  // numbers follow a command letter directly, a minus sign, or a space
  const put = (tenths: number, afterCommand: boolean) => {
    const text = format(tenths)
    data += afterCommand || text.startsWith('-') ? text : ` ${text}`
  }
  for (const { points, closed } of outline(d)) {
    if (closed) {
      // end on the start, then let `z` draw that last point
      const first = points[0]
      const last = points[points.length - 1]
      if (last[0] !== first[0] || last[1] !== first[1]) line(points, last, first)
      points.pop()
    }
    if (points.length < 2) continue
    let px = 0
    let py = 0
    let lineCommand = false
    points.forEach(([x, y], i) => {
      const tx = Math.round((x + wobble(x + ox, y + oy, 1)) * 10)
      const ty = Math.round((y + wobble(x + ox, y + oy, 3)) * 10)
      if (i === 0) {
        data += 'M'
        put(tx, true)
        put(ty, false)
      } else if (tx !== px || ty !== py) {
        if (!lineCommand) data += 'l'
        put(tx - px, !lineCommand)
        put(ty - py, false)
        lineCommand = true
      }
      px = tx
      py = ty
    })
    if (closed) data += 'z'
  }
  return data
}

/**
 * The vertices of an outline these shapes drew (a `Rect`, `Circle` or `Path`
 * element's `d`), per subpath, in the shape's own units: for cutting exactly
 * that shape out of something else (the rush's window holes). Accumulated in
 * tenths, as written, so the last vertex lands where the outline does.
 */
export function roughVertices(d: string): Point[][] {
  const subpaths: Point[][] = []
  let x = 0
  let y = 0
  for (const [, command, args] of d.matchAll(/([Mlz])([^Mlz]*)/g)) {
    const tenths = (args.match(/-?(?:\d+\.?\d*|\.\d+)/g) ?? []).map((v) =>
      Math.round(Number(v) * 10),
    )
    if (command === 'M') {
      ;[x, y] = tenths
      subpaths.push([[x / 10, y / 10]])
    } else if (command === 'l') {
      const points = subpaths[subpaths.length - 1]
      for (let i = 0; i + 1 < tenths.length; i += 2) {
        x += tenths[i]
        y += tenths[i + 1]
        points.push([x / 10, y / 10])
      }
    }
  }
  return subpaths
}

const outlines = new Map<string, string>()

const Origin = createContext<Point>([0, 0])

function useRough(d: string) {
  const origin = use(Origin)
  const key = `${origin[0]},${origin[1]} ${d}`
  let rough = outlines.get(key)
  if (rough === undefined) {
    rough = roughen(d, origin)
    outlines.set(key, rough)
  }
  return rough
}

/**
 * A `translate` group whose rough shapes keep the wobble of where they land,
 * so two copies of the same art (the train's cars) don't share their edges.
 */
export function Shift({ x = 0, y = 0, children }: { x?: number; y?: number; children: ReactNode }) {
  const [ox, oy] = use(Origin)
  return (
    <Origin value={[ox + x, oy + y]}>
      <g transform={`translate(${x} ${y})`}>{children}</g>
    </Origin>
  )
}

/** Presentation props, passed to the drawn `<path>`. */
type Paint = Omit<
  SVGProps<SVGPathElement>,
  'ref' | 'd' | 'x' | 'y' | 'width' | 'height' | 'rx' | 'cx' | 'cy' | 'r'
>
type Length = number | string

export function Path({ d, ...paint }: Paint & { d: string }) {
  return <path {...paint} d={useRough(d)} />
}

export function Rect({
  x = 0,
  y = 0,
  width,
  height,
  rx = 0,
  ...paint
}: Paint & { x?: Length; y?: Length; width: Length; height: Length; rx?: Length }) {
  const [left, top, w, h] = [Number(x), Number(y), Number(width), Number(height)]
  const r = Math.min(Number(rx), w / 2, h / 2)
  const d =
    r > 0
      ? `M${left + r} ${top}H${left + w - r}A${r} ${r} 0 0 1 ${left + w} ${top + r}` +
        `V${top + h - r}A${r} ${r} 0 0 1 ${left + w - r} ${top + h}` +
        `H${left + r}A${r} ${r} 0 0 1 ${left} ${top + h - r}` +
        `V${top + r}A${r} ${r} 0 0 1 ${left + r} ${top}Z`
      : `M${left} ${top}H${left + w}V${top + h}H${left}Z`
  return <path {...paint} d={useRough(d)} />
}

export function Circle({ cx, cy, r, ...paint }: Paint & { cx: Length; cy: Length; r: Length }) {
  const [x, y, radius] = [Number(cx), Number(cy), Number(r)]
  const d =
    `M${x - radius} ${y}A${radius} ${radius} 0 1 0 ${x + radius} ${y}` +
    `A${radius} ${radius} 0 1 0 ${x - radius} ${y}Z`
  return <path {...paint} d={useRough(d)} />
}
