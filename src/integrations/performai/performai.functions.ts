import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { z } from 'zod'

import {
  ChunithmProfileResponseSchema,
  ChunithmRatingResponseSchema,
  ErrorResponseSchema,
  LoginResponseSchema,
  MaimaiProfileResponseSchema,
  MaimaiRatingResponseSchema,
} from './performai.schemas'

import type {
  ChunithmData,
  ChunithmProfileExtended,
  MaimaiData,
  MaimaiProfileExtended,
  PerformaiResult,
} from './performai.types'

const PERFORMAI_API_BASE = 'https://performai.pastelrain.com/v1'
const PERFORMAI_SERVER = 'intl'

/**
 * Custom error class to distinguish API response failures with HTTP status codes.
 */
class PerformaiFetchError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'PerformaiFetchError'
  }
}

/**
 * Helper to get the current time and day in JST (Japan Standard Time, UTC+9).
 */
export function getJstTime(): { hour: number; day: number } {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return {
    hour: jst.getUTCHours(),
    day: jst.getUTCDay(), // 0 = Sunday, 1 = Monday, ..., 3 = Wednesday
  }
}

/**
 * Checks if Maimai is in its maintenance window:
 * - Wednesdays: 01:00 to 04:00 JST
 * - Other days: 01:00 to 02:00 JST
 */
export function isMaimaiMaintenanceHour(): boolean {
  const { hour, day } = getJstTime()
  if (day === 3) {
    return hour >= 1 && hour < 4
  }
  return hour >= 1 && hour < 2
}

/**
 * Checks if Chunithm is in its maintenance window:
 * - Daily: 02:00 to 06:00 JST
 */
export function isChunithmMaintenanceHour(): boolean {
  const { hour } = getJstTime()
  return hour >= 2 && hour < 6
}

/**
 * General helper to check if a specific game (or any game) is in maintenance.
 */
export function isMaintenanceHour(game?: 'maimai' | 'chunithm'): boolean {
  if (game === 'maimai') return isMaimaiMaintenanceHour()
  if (game === 'chunithm') return isChunithmMaintenanceHour()
  return isMaimaiMaintenanceHour() || isChunithmMaintenanceHour()
}

/**
 * Authenticates with SEGA ID via performai-api and retrieves the session cookie.
 */
async function loginToPerformai(game: 'maimai' | 'chunithm'): Promise<string> {
  const segaId = env.SEGA_ID
  const password = env.SEGA_PASSWORD

  if (!segaId || !password) {
    throw new Error(
      'SEGA credentials are not configured. Please set SEGA_ID and SEGA_PASSWORD in Cloudflare secrets or .dev.vars.',
    )
  }

  const loginRes = await fetch(
    `${PERFORMAI_API_BASE}/${PERFORMAI_SERVER}/${game}/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ segaId, password }),
    },
  )

  if (!loginRes.ok) {
    const errorJson: unknown = await loginRes.json().catch(() => null)
    const parsedError = ErrorResponseSchema.safeParse(errorJson)
    const message = parsedError.success
      ? parsedError.data.error.message
      : `Failed to login to ${game} (${loginRes.status})`
    throw new PerformaiFetchError(message, loginRes.status)
  }

  const rawLoginJson: unknown = await loginRes.json()
  const parsedLogin = LoginResponseSchema.safeParse(rawLoginJson)

  if (!parsedLogin.success) {
    throw new PerformaiFetchError(
      `Invalid login response schema from ${game}: ${parsedLogin.error.message}`,
      loginRes.status,
    )
  }

  return parsedLogin.data.data.cookie
}

/**
 * Fetches only player profile from performai-api with Zod validation.
 */
async function fetchProfileFromPerformai(
  game: 'maimai' | 'chunithm',
): Promise<MaimaiProfileExtended | ChunithmProfileExtended> {
  const cookie = await loginToPerformai(game)
  const cookieHeaderName = `x-${game}-cookie`

  const profileRes = await fetch(
    `${PERFORMAI_API_BASE}/${PERFORMAI_SERVER}/${game}/profile`,
    {
      headers: { [cookieHeaderName]: cookie },
    },
  )

  if (!profileRes.ok) {
    const errorJson: unknown = await profileRes.json().catch(() => null)
    const parsedError = ErrorResponseSchema.safeParse(errorJson)
    const message = parsedError.success
      ? parsedError.data.error.message
      : `Failed to fetch ${game} profile (${profileRes.status})`
    throw new PerformaiFetchError(message, profileRes.status)
  }

  const rawProfileJson: unknown = await profileRes.json()

  if (game === 'maimai') {
    const parsedProfile = MaimaiProfileResponseSchema.safeParse(rawProfileJson)
    if (!parsedProfile.success) {
      throw new PerformaiFetchError(
        `Invalid maimai profile schema: ${parsedProfile.error.message}`,
        profileRes.status,
      )
    }
    return parsedProfile.data.data
  }

  const parsedProfile = ChunithmProfileResponseSchema.safeParse(rawProfileJson)
  if (!parsedProfile.success) {
    throw new PerformaiFetchError(
      `Invalid chunithm profile schema: ${parsedProfile.error.message}`,
      profileRes.status,
    )
  }

  return parsedProfile.data.data
}

/**
 * Internal helper to authenticate and safely fetch game profile and rating data from performai-api with Zod validation.
 * (Kept for full rating/top-50 song queries in the future)
 */
async function fetchFromPerformai(
  game: 'maimai' | 'chunithm',
): Promise<MaimaiData | ChunithmData> {
  const cookie = await loginToPerformai(game)
  const cookieHeaderName = `x-${game}-cookie`

  // Fetch profile & rating in parallel
  const [profileRes, ratingRes] = await Promise.all([
    fetch(`${PERFORMAI_API_BASE}/${PERFORMAI_SERVER}/${game}/profile`, {
      headers: { [cookieHeaderName]: cookie },
    }),
    fetch(`${PERFORMAI_API_BASE}/${PERFORMAI_SERVER}/${game}/rating`, {
      headers: { [cookieHeaderName]: cookie },
    }),
  ])

  if (!profileRes.ok) {
    const errorJson: unknown = await profileRes.json().catch(() => null)
    const parsedError = ErrorResponseSchema.safeParse(errorJson)
    const message = parsedError.success
      ? parsedError.data.error.message
      : `Failed to fetch ${game} profile (${profileRes.status})`
    throw new PerformaiFetchError(message, profileRes.status)
  }

  if (!ratingRes.ok) {
    const errorJson: unknown = await ratingRes.json().catch(() => null)
    const parsedError = ErrorResponseSchema.safeParse(errorJson)
    const message = parsedError.success
      ? parsedError.data.error.message
      : `Failed to fetch ${game} rating (${ratingRes.status})`
    throw new PerformaiFetchError(message, ratingRes.status)
  }

  const rawProfileJson: unknown = await profileRes.json()
  const rawRatingJson: unknown = await ratingRes.json()

  if (game === 'maimai') {
    const parsedProfile = MaimaiProfileResponseSchema.safeParse(rawProfileJson)
    if (!parsedProfile.success) {
      throw new PerformaiFetchError(
        `Invalid maimai profile schema: ${parsedProfile.error.message}`,
        profileRes.status,
      )
    }

    const parsedRating = MaimaiRatingResponseSchema.safeParse(rawRatingJson)
    if (!parsedRating.success) {
      throw new PerformaiFetchError(
        `Invalid maimai rating schema: ${parsedRating.error.message}`,
        ratingRes.status,
      )
    }

    return {
      profile: parsedProfile.data.data,
      rating: parsedRating.data.data,
    }
  }

  const parsedProfile = ChunithmProfileResponseSchema.safeParse(rawProfileJson)
  if (!parsedProfile.success) {
    throw new PerformaiFetchError(
      `Invalid chunithm profile schema: ${parsedProfile.error.message}`,
      profileRes.status,
    )
  }

  const parsedRating = ChunithmRatingResponseSchema.safeParse(rawRatingJson)
  if (!parsedRating.success) {
    throw new PerformaiFetchError(
      `Invalid chunithm rating schema: ${parsedRating.error.message}`,
      ratingRes.status,
    )
  }

  return {
    profile: parsedProfile.data.data,
    rating: parsedRating.data.data,
  }
}

/**
 * Server function to fetch Maimai DX profile only.
 * Implements ISG caching headers and maintenance detection.
 */
export const getMaimaiProfile = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PerformaiResult<MaimaiProfileExtended>> => {
    if (isMaimaiMaintenanceHour()) {
      const { day } = getJstTime()
      const windowStr =
        day === 3
          ? '01:00 - 04:00 JST (Wednesday extended)'
          : '01:00 - 02:00 JST'
      setResponseHeader('Cache-Control', 'public, max-age=300')
      return {
        maintenance: true,
        data: null,
        reason: `Maimai maintenance window (${windowStr})`,
      }
    }

    try {
      const profile = (await fetchProfileFromPerformai(
        'maimai',
      )) as MaimaiProfileExtended

      setResponseHeader(
        'Cache-Control',
        'public, s-maxage=3600, stale-while-revalidate=86400',
      )

      return {
        maintenance: false,
        data: profile,
      }
    } catch (err) {
      if (
        err instanceof PerformaiFetchError &&
        (err.status === 502 ||
          err.status === 503 ||
          /maintenance|temporarily unavailable/i.test(err.message))
      ) {
        setResponseHeader('Cache-Control', 'public, max-age=300')
        return {
          maintenance: true,
          data: null,
          reason: `SEGA server unavailable: ${err.message}`,
        }
      }

      setResponseHeader('Cache-Control', 'no-store')
      console.error('[performai] Error fetching maimai profile:', err)
      throw err
    }
  },
)

/**
 * Server function to fetch Chunithm profile only.
 * Implements ISG caching headers and maintenance detection.
 */
export const getChunithmProfile = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PerformaiResult<ChunithmProfileExtended>> => {
    if (isChunithmMaintenanceHour()) {
      setResponseHeader('Cache-Control', 'public, max-age=300')
      return {
        maintenance: true,
        data: null,
        reason: 'Chunithm maintenance window (02:00 - 06:00 JST)',
      }
    }

    try {
      const profile = (await fetchProfileFromPerformai(
        'chunithm',
      )) as ChunithmProfileExtended

      setResponseHeader(
        'Cache-Control',
        'public, s-maxage=3600, stale-while-revalidate=86400',
      )

      return {
        maintenance: false,
        data: profile,
      }
    } catch (err) {
      if (
        err instanceof PerformaiFetchError &&
        (err.status === 502 ||
          err.status === 503 ||
          /maintenance|temporarily unavailable/i.test(err.message))
      ) {
        setResponseHeader('Cache-Control', 'public, max-age=300')
        return {
          maintenance: true,
          data: null,
          reason: `SEGA server unavailable: ${err.message}`,
        }
      }

      setResponseHeader('Cache-Control', 'no-store')
      console.error('[performai] Error fetching chunithm profile:', err)
      throw err
    }
  },
)

/**
 * Server function to fetch Maimai DX profile and rating data together.
 * Implements ISG caching headers and maintenance detection.
 * (Preserved for future top-50 song queries)
 */
export const getMaimaiData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PerformaiResult<MaimaiData>> => {
    // Check Maimai maintenance window (01:00 - 02:00 JST, or 01:00 - 04:00 JST on Wednesdays)
    if (isMaimaiMaintenanceHour()) {
      const { day } = getJstTime()
      const windowStr =
        day === 3
          ? '01:00 - 04:00 JST (Wednesday extended)'
          : '01:00 - 02:00 JST'
      setResponseHeader('Cache-Control', 'public, max-age=300')
      return {
        maintenance: true,
        data: null,
        reason: `Maimai maintenance window (${windowStr})`,
      }
    }

    try {
      const result = (await fetchFromPerformai('maimai')) as MaimaiData

      // ISG cache control: fresh at edge for 1 hour, serve stale up to 24h while revalidating
      setResponseHeader(
        'Cache-Control',
        'public, s-maxage=3600, stale-while-revalidate=86400',
      )

      return {
        maintenance: false,
        data: result,
      }
    } catch (err) {
      if (
        err instanceof PerformaiFetchError &&
        (err.status === 502 ||
          err.status === 503 ||
          /maintenance|temporarily unavailable/i.test(err.message))
      ) {
        setResponseHeader('Cache-Control', 'public, max-age=300')
        return {
          maintenance: true,
          data: null,
          reason: `SEGA server unavailable: ${err.message}`,
        }
      }

      // Configuration / auth failure: do not cache
      setResponseHeader('Cache-Control', 'no-store')
      console.error('[performai] Error fetching maimai data:', err)
      throw err
    }
  },
)

/**
 * Server function to fetch Chunithm profile and rating data together.
 * Implements ISG caching headers and maintenance detection.
 * (Preserved for future top-50 song queries)
 */
export const getChunithmData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PerformaiResult<ChunithmData>> => {
    // Check Chunithm maintenance window (02:00 - 06:00 JST daily)
    if (isChunithmMaintenanceHour()) {
      setResponseHeader('Cache-Control', 'public, max-age=300')
      return {
        maintenance: true,
        data: null,
        reason: 'Chunithm maintenance window (02:00 - 06:00 JST)',
      }
    }

    try {
      const result = (await fetchFromPerformai('chunithm')) as ChunithmData

      // ISG cache control: fresh at edge for 1 hour, serve stale up to 24h while revalidating
      setResponseHeader(
        'Cache-Control',
        'public, s-maxage=3600, stale-while-revalidate=86400',
      )

      return {
        maintenance: false,
        data: result,
      }
    } catch (err) {
      if (
        err instanceof PerformaiFetchError &&
        (err.status === 502 ||
          err.status === 503 ||
          /maintenance|temporarily unavailable/i.test(err.message))
      ) {
        setResponseHeader('Cache-Control', 'public, max-age=300')
        return {
          maintenance: true,
          data: null,
          reason: `SEGA server unavailable: ${err.message}`,
        }
      }

      // Configuration / auth failure: do not cache
      setResponseHeader('Cache-Control', 'no-store')
      console.error('[performai] Error fetching chunithm data:', err)
      throw err
    }
  },
)

/**
 * Unified server function taking game parameter ('maimai' | 'chunithm').
 * (Preserved for future use)
 */
export const getPerformaiData = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      game: z.enum(['maimai', 'chunithm']),
    }),
  )
  .handler(
    async ({
      data: { game },
    }): Promise<PerformaiResult<MaimaiData | ChunithmData>> => {
      if (game === 'maimai') {
        return getMaimaiData()
      }
      return getChunithmData()
    },
  )
