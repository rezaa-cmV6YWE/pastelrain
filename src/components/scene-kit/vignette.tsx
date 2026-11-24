import { palette } from './palette'
import { Circle, Path } from './rough'

/** A small seaside picture: the sun over two bands of waves (the book's chapter pages, plain flyers). */
export function SeaVignette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" aria-hidden="true" className={className}>
      <Circle cx={60} cy={30} r={18} fill={palette.sun} />
      <Path d="M0 50 C20 42 40 58 60 50 S100 42 120 50 V80 H0 Z" fill={palette.sea} />
      <Path d="M0 62 C20 56 40 68 60 62 S100 56 120 62 V80 H0 Z" fill={palette.seaBright} />
    </svg>
  )
}
