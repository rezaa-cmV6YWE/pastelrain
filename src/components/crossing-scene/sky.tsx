import { palette } from './palette'
import { SceneSvg } from './scene-svg'

export function Sky() {
  return (
    <SceneSvg paper={false}>
      <rect width="1600" height="900" fill={palette.sky} />
      <path
        d="M0 560 V502 C120 482 240 512 380 494 S640 470 800 488 S1080 506 1240 486 S1480 470 1600 494 V560 Z"
        fill={palette.skyHaze}
        opacity={0.6}
      />
    </SceneSvg>
  )
}
