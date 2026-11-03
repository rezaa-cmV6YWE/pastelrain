import { createFileRoute } from '@tanstack/react-router'
import { useMotionValue } from 'motion/react'

import { CrossingScene } from '#/components/crossing-scene'
import { PaperGrain, SceneDefs } from '#/components/scene-kit/scene-svg'
import { TrainScene } from '#/components/train-scene'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  // The crossing → train hand-off's progress (`scene-kit/handoff.ts`): the
  // crossing plays it, the train scene's glass follows it.
  const handoff = useMotionValue(0)
  return (
    <main>
      <SceneDefs />
      <CrossingScene handoff={handoff} />
      <TrainScene handoff={handoff} />
      <PaperGrain />
    </main>
  )
}
