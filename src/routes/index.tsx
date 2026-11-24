import { createFileRoute } from '@tanstack/react-router'
import { useMotionValue } from 'motion/react'

import { BeachScene } from '#/components/beach-scene'
import { CrossingScene } from '#/components/crossing-scene'
import { PlatformScene } from '#/components/platform-scene'
import { PaperGrain, SceneDefs } from '#/components/scene-kit/scene-svg'
import { useStableScreen } from '#/components/scene-kit/screen'
import { TrainScene } from '#/components/train-scene'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  // The crossing → train hand-off's progress (`scene-kit/handoff.ts`): the
  // crossing plays it, the train scene's glass follows it. `arrival` is the
  // train → platform hand-off: the train scene plays it. `pullIn` is the
  // platform rolling into the train's windows (0 → 1), driven by the train
  // scene's scroll. `shore` is the beach scene's scroll progress (0 → 1); it
  // drives the platform view's camera, night and beach layers.
  const handoff = useMotionValue(0)
  const arrival = useMotionValue(0)
  const pullIn = useMotionValue(0)
  const shore = useMotionValue(0)
  useStableScreen()
  return (
    <main>
      <SceneDefs />
      <CrossingScene handoff={handoff} />
      <TrainScene handoff={handoff} arrival={arrival} pullIn={pullIn} />
      <PlatformScene pullIn={pullIn} arrival={arrival} shore={shore} />
      <BeachScene shore={shore} />
      <PaperGrain />
    </main>
  )
}
