import { createFileRoute } from '@tanstack/react-router'

import Title from '@/components/Title'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="m-auto max-w-2xl p-4">
      <Title />
    </main>
  )
}
