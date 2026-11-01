import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="flex h-svh w-full items-center justify-center">
      <h1 className="text-title text-9xl font-semibold">pastelrain</h1>
    </div>
  )
}
