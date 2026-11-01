import { createFileRoute } from '@tanstack/react-router'

import { CrossingScene } from '#/components/crossing-scene'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main>
      <CrossingScene />
    </main>
  )
}
