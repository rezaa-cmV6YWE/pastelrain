/*
 * The projects, each a card in the phone's feed (`phone.tsx`), in this
 * order; a card's "More" opens the project's page in the phone
 * (`project-page.tsx`). Add a project by
 * appending an entry: the feed's scroll lengthens by `feedPerProject`
 * (`timeline.ts`).
 *
 * Screenshots go in `./images/` and are imported, so Vite fingerprints them
 * (`public/` is only for files that need a fixed root URL, the favicons):
 *   import shot from './images/x.webp'
 *   image: { src: shot, alt: '…' }
 * A card without an image shows a small seaside vignette.
 */

import elix from './images/elix.webp'
import me from './images/me.webp'
import pastelrainLite from './images/pastelrain-lite.webp'
import performaiApi from './images/performai-api.webp'

export type ProjectLink = { label: string; href: string }

export type Project = {
  /** the card's and the project page's heading */
  title: string
  /** the tag with the year, e.g. 'Web app' */
  kind: string
  year: string
  /** one or two lines, under the title */
  summary: string
  /** paragraphs, shown on the project page only */
  description: readonly string[]
  /** chips */
  stack: readonly string[]
  /** buttons; they open in a new tab */
  links: readonly ProjectLink[]
  /** an optional screenshot */
  image?: { src: string; alt: string }
}

export const projects: readonly Project[] = [
  {
    title: 'pastelrain-lite',
    kind: 'Website',
    year: '2026',
    summary: 'The portfolio before this one: pastel rain falling over a single glass card.',
    description: [
      'A small site for anyone who wanted to know who I was: a Japanese title drifting with the pointer under falling pastel rain, and one glass card holding my skills, my projects and the song I was playing on Spotify.',
      'It also shows my maimai DX and CHUNITHM player profiles, fetched on the server through performai-api, and it knows when SEGA’s servers are down for maintenance, so it doesn’t knock on a closed door.',
      'Built with TanStack Start and Tailwind CSS, and running on Cloudflare Workers.',
    ],
    stack: ['TanStack Start', 'React', 'Tailwind CSS', 'Motion', 'Cloudflare Workers'],
    links: [
      { label: 'Visit', href: 'https://pastelrain.com' },
      { label: 'Code', href: 'https://github.com/rezaa-cmV6YWE/pastelrain-lite' },
    ],
    image: {
      src: pastelrainLite,
      alt: 'The pastelrain-lite home page: the title パステルレイン under falling pastel raindrops.',
    },
  },
  {
    title: 'performai-api',
    kind: 'API',
    year: '2026',
    summary: 'Scores and ratings from maimai DX and CHUNITHM, as an API their own sites never had.',
    description: [
      'SEGA’s arcade rhythm games keep your scores on their websites as pages to read, never as data to use. performai-api signs in with your SEGA ID, reads maimai NET and CHUNITHM-NET for you, and returns your profile and every score as JSON.',
      'It works out your rating itself from OtogeDB’s chart data: Best 50 for maimai, Best 30 and New 20 for CHUNITHM. It keeps nothing; every request starts clean.',
      'Built with Bun and Elysia, with Zod for validation, Cheerio for reading the pages, and OpenAPI docs.',
    ],
    stack: ['Bun', 'Elysia', 'TypeScript', 'Zod', 'Cheerio'],
    links: [{ label: 'Code', href: 'https://github.com/rezaa-cmV6YWE/performai-api' }],
    image: {
      src: performaiApi,
      alt: 'A frame from the performai-api promo video: a large pink 50, for maimai’s Best 50, on a dark background.',
    },
  },
  {
    title: 'Elix',
    kind: 'Mobile app',
    year: '2026',
    summary: 'A self-management app that turns your days into an RPG: quests, XP, gold and guilds.',
    description: [
      'Elix treats a to-do list like a role-playing game. Pick a class, take on main, side, daily and weekly quests, and earn XP, levels, streaks and gold to spend in the shop. Join a guild to chat and climb its leaderboard together.',
      'You prove a quest is done with a note or a photo, and an AI validator built on Gemini checks it, so the only one left to cheat is yourself.',
      'It is also my thesis: productivity apps tend to lose the people who use them, so Elix is designed around Self-Determination Theory and the Octalysis framework.',
      'The app is built with Expo and React Native; its server with Bun and Hono, Drizzle on PostgreSQL, Better Auth and Socket.IO.',
    ],
    stack: ['React Native', 'Expo', 'Bun', 'Hono', 'Drizzle', 'PostgreSQL'],
    links: [
      { label: 'App code', href: 'https://github.com/rezaa-cmV6YWE/elix-mobile' },
      { label: 'Server code', href: 'https://github.com/rezaa-cmV6YWE/elix-server' },
    ],
    image: {
      src: elix,
      alt: 'Two Elix screens: the quest list with XP and gold rewards, and a guild page with chat, leaderboard and members.',
    },
  },
  {
    title: 'rezaa.me',
    kind: 'Website',
    year: '2023–2024',
    summary: 'My first portfolio, with a terminal you could type into.',
    description: [
      'My first real portfolio, designed in Figma and built with Next.js: a terminal you could type into, 3D scenes, live coding stats from WakaTime, GitHub and LeetCode, and a Kawaii Mode for whoever found it.',
      'Its projects, skills and experience came from my own Strapi server. It is no longer maintained, and that server has gone quiet, but the front page still says hello.',
    ],
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Three.js', 'Strapi'],
    links: [
      { label: 'Visit', href: 'https://rezaa.me' },
      { label: 'Code', href: 'https://github.com/rezaa-cmV6YWE/me' },
    ],
    image: {
      src: me,
      alt: 'The rezaa.me home page: “Hello, I’m rezaa.” in large white letters over a dark teal glow, above a terminal window.',
    },
  },
]
