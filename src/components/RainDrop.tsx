import type { SVGProps } from 'react'

interface RainDropProps extends SVGProps<SVGSVGElement> {
  color?: string
  size?: number
  outline?: string
}

export function RainDrop({
  color = '#38bdf8',
  size = 48,
  outline = '#1e3a5f',
  className,
  ...rest
}: RainDropProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <path
        d="M50 0C50 0 95 45 95 75C95 100 75 120 50 120C25 120 5 100 5 75C5 45 50 0 50 0Z"
        fill={color}
        stroke={outline}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface RainDotProps extends SVGProps<SVGCircleElement> {
  color?: string
  size?: number
  outline?: string
}

export function RainDot({
  color = '#fb7185',
  size = 16,
  outline = '#1e3a5f',
  className,
  ...rest
}: RainDotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill={color}
        stroke={outline}
        strokeWidth="2"
        {...rest}
      />
    </svg>
  )
}

interface RainPuddleProps extends SVGProps<SVGEllipseElement> {
  color?: string
  width?: number
  height?: number
  outline?: string
}

export function RainPuddle({
  color = '#14b8a6',
  width = 64,
  height = 24,
  outline = '#1e3a5f',
  className,
  ...rest
}: RainPuddleProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <ellipse
        cx="50"
        cy="18"
        rx="46"
        ry="14"
        fill={color}
        stroke={outline}
        strokeWidth="2.5"
        {...rest}
      />
    </svg>
  )
}
