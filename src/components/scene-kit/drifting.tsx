import type { CSSProperties, ReactNode } from 'react'

type Drift = { drift: string; duration: string; delay: string }

/**
 * Scene art drifting side to side by `drift` (`pr-drift`), e.g. a cloud: its
 * children, usually one `SceneSvg`, fill the wrapper.
 */
export function Drifting({ drift, duration, delay, children }: Drift & { children: ReactNode }) {
  const style = {
    '--drift': drift,
    '--drift-duration': duration,
    '--drift-delay': delay,
  } as CSSProperties
  return (
    <div className="pr-drift absolute inset-0" style={style}>
      {children}
    </div>
  )
}
