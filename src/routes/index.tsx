import { createFileRoute } from '@tanstack/react-router'

import Footer from '@/components/Footer'
import NowPlayingSpotify from '@/components/NowPlayingSpotify'
import Projects from '@/components/Projects'
import Title from '@/components/Title'
import WhoAmI from '@/components/WhoAmI'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="m-auto max-w-2xl p-4">
      <Title />
      <div className="w-full space-y-8 rounded-3xl border border-gray-100 bg-gray-700/20 p-4 backdrop-blur-xl backdrop-filter">
        <WhoAmI />
        <Projects />
        <NowPlayingSpotify />
        <Footer />
      </div>
    </main>
  )
}
