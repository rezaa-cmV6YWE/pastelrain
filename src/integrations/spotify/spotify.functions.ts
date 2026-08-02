import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'

export type SpotifyNowPlaying = {
  isPlaying: boolean
  track: {
    name: string
    artist: string
    albumArt: string | null
    url: string
  } | null
}

export const getSpotifyNowPlaying = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SpotifyNowPlaying> => {
    const clientId = env.SPOTIFY_CLIENT_ID
    const clientSecret = env.SPOTIFY_CLIENT_SECRET
    const refreshToken = env.SPOTIFY_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        'Spotify credentials are not configured. Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REFRESH_TOKEN in Cloudflare secrets.',
      )
    }

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!tokenRes.ok) {
      const body = await tokenRes.text()
      throw new Error(
        `Failed to refresh Spotify access token: ${tokenRes.status} ${body}`,
      )
    }

    const tokenData: { access_token: string } = await tokenRes.json()

    const playerRes = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    )

    if (playerRes.status === 204) {
      return { isPlaying: false, track: null }
    }

    if (!playerRes.ok) {
      const body = await playerRes.text()
      throw new Error(
        `Failed to fetch Spotify now playing: ${playerRes.status} ${body}`,
      )
    }

    const playerData: {
      is_playing: boolean
      item: {
        name: string
        artists: Array<{ name: string }>
        album: { images: Array<{ url: string }> }
        external_urls: { spotify: string }
      }
    } = await playerRes.json()

    return {
      isPlaying: playerData.is_playing,
      track: {
        name: playerData.item.name,
        artist: playerData.item.artists.map((a) => a.name).join(', '),
        albumArt: playerData.item.album.images[0]?.url ?? null,
        url: playerData.item.external_urls.spotify,
      },
    }
  },
)
