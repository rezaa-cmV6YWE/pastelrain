import { useQuery } from '@tanstack/react-query'
import { Image } from '@unpic/react'
import { SiSpotify } from 'react-icons/si'

import { getSpotifyNowPlaying } from '@/integrations/spotify/spotify.functions'

import type { SpotifyNowPlaying } from '@/integrations/spotify/spotify.functions'

export default function NowPlayingSpotify() {
  const { data, isLoading, error } = useQuery<SpotifyNowPlaying>({
    queryKey: ['spotify-now-playing'],
    queryFn: () => getSpotifyNowPlaying(),
    refetchInterval: 30000,
  })

  return (
    <section className="space-y-2">
      <h2 className="font-pixel flex items-center gap-2 text-2xl">
        <SiSpotify />
        Listening to
      </h2>

      {isLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-100/50 bg-white/5 p-3">
          <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-400/20" />
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-400/20" />
            <div className="h-3 w-24 animate-pulse rounded bg-gray-400/20" />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400">Could not load Spotify data.</p>
      )}

      {!isLoading && !error && !data?.track && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-100/50 bg-white/5 p-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800/50">
            <SiSpotify className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-400">Not playing anything right now.</p>
        </div>
      )}

      {data?.track && (
        <a
          href={data.track.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-xl border border-gray-100/50 bg-white/5 p-2 transition hover:bg-white/10"
        >
          {data.track.albumArt ? (
            <Image
              src={data.track.albumArt}
              width={48}
              height={48}
              alt={`${data.track.name} album art`}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800/50">
              <SiSpotify className="text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="group-hover:text-drop-teal truncate text-sm font-semibold transition">
                {data.track.name}
              </p>
              {data.isPlaying && (
                <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-400" />
              )}
            </div>
            <p className="truncate text-xs text-gray-300">
              {data.track.artist}
            </p>
          </div>
        </a>
      )}
    </section>
  )
}
