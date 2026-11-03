/*
 * Colour blending in OKLab, a perceptual space. A blend there moves evenly in
 * lightness and never swings through unrelated hues; Motion's own RGB mixing
 * dims and greys the middle of a blend between distant colours.
 */

type Lab = { l: number; a: number; b: number }

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const fromLinear = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)

function hexToLab(hex: string): Lab {
  const [r, g, b] = [1, 3, 5].map((i) => toLinear(Number.parseInt(hex.slice(i, i + 2), 16) / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

/** A linear-light channel as a clipped 0–255 sRGB value (clipping keeps it in gamut). */
const channel = (v: number) =>
  Math.round(255 * Math.min(1, Math.max(0, fromLinear(Math.max(0, v)))))

function labToRgb({ l: L, a: A, b: B }: Lab) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  const r = channel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const g = channel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const b = channel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * A blend through `stops` (hex colours, evenly spaced), as a function of
 * t in [0, 1]. Each step is a straight line in OKLab. A straight line between
 * opposite hues (blue → gold) passes near grey, so route such blends through
 * a bright, pale stop: near-white reads as haze, not grey.
 */
export function mixOklab(stops: readonly string[]): (t: number) => string {
  const labs = stops.map(hexToLab)
  const last = labs.length - 1
  return (t) => {
    const at = Math.min(1, Math.max(0, t)) * last
    const i = Math.min(last - 1, Math.floor(at))
    const k = at - i
    const [x, y] = [labs[i], labs[i + 1]]
    return labToRgb({
      l: x.l + (y.l - x.l) * k,
      a: x.a + (y.a - x.a) * k,
      b: x.b + (y.b - x.b) * k,
    })
  }
}
