import { createFileRoute } from '@tanstack/react-router'
import { useMotionValue } from 'motion/react'

import { CrossingScene } from '#/components/crossing-scene'
import { PlatformScene } from '#/components/platform-scene'
import { PaperGrain, SceneDefs } from '#/components/scene-kit/scene-svg'
import { TrainScene } from '#/components/train-scene'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  // The crossing → train hand-off's progress (`scene-kit/handoff.ts`): the
  // crossing plays it, the train scene's glass follows it. `arrival` is the
  // train → platform hand-off: the train scene plays it. `pullIn` is the
  // platform rolling into the train's windows (0 → 1), driven by the train
  // scene's scroll.
  const handoff = useMotionValue(0)
  const arrival = useMotionValue(0)
  const pullIn = useMotionValue(0)
  return (
    <main>
      <SceneDefs />
      <CrossingScene handoff={handoff} />
      <TrainScene handoff={handoff} arrival={arrival} pullIn={pullIn} />
      <PlatformScene pullIn={pullIn} arrival={arrival} />
      <PaperGrain />
    </main>
  )
}
