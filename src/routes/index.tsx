import { createFileRoute } from '@tanstack/react-router'

import Title from '@/components/Title'
import WhoAmI from '@/components/WhoAmI'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="m-auto max-w-2xl p-4">
      <Title />
      <div className="w-full rounded-3xl border border-gray-100 bg-gray-500/20 p-4 backdrop-blur-xl backdrop-filter">
        <WhoAmI />
      </div>
    </main>
  )
}
