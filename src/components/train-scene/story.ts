/** The toolbox page lists these; append to add a skill. */
export const skills = [
  'TypeScript',
  'React',
  'Next.js',
  'TanStack Start',
  'TanStack Router',
  'TanStack Query',
  'Tailwind CSS',
  'Motion',
  'React Native',
  'Bun',
  'Hono',
  'Elysia',
  'PostgreSQL',
  'Cloudflare Workers',
] as const

/** A paragraph of prose, or the skills list. */
export type Paragraph = string | { skills: true }

/** One spread of the book: the chapter heading sits on the left page, the prose on the right. */
export type Page = {
  numeral: string
  chapter: string
  paragraphs: readonly Paragraph[]
}

/** The book's spreads, in reading order. Each takes one `pageScreens` of scroll. */
export const pages: readonly Page[] = [
  {
    numeral: 'I',
    chapter: 'The Passenger',
    paragraphs: [
      'The carriage hums along the coast, and the noon light lies across the floor in long, pale squares. My name is Rezaa.',
      'I am a software developer. I build the quiet things on your screen — buttons that answer, pages that unfold as you scroll — things you touch for a moment, then forget.',
    ],
  },
  {
    numeral: 'II',
    chapter: 'The Craft',
    paragraphs: [
      'I work at the front of the web, where the code ends and the people begin. Some nights I follow it further: into a phone, or a server no one ever sees.',
      'I care about the parts no one notices unless they break: a layout that holds on a small phone, a page ready before you blink. When they work, no one remembers them. I make them carefully anyway.',
    ],
  },
  {
    numeral: 'III',
    chapter: 'The Toolbox',
    paragraphs: [
      'Every traveller packs a bag. Mine is light and worn, and I know every pocket:',
      { skills: true },
      'Java, SQL Server, a little Unity: things I left behind along the way.',
    ],
  },
  {
    numeral: 'IV',
    chapter: 'The Road So Far',
    paragraphs: [
      'I didn’t start here. Every journey has its stations: places you stay a while, learn the names of things, and leave before you are ready.',
      'They are still out there, past the window. Let me close the book; we’ll pass them one last time.',
    ],
  },
]

/**
 * Plain text of a paragraph, for the screen-reader copy and the page. The
 * skills are joined with a no-break space before each middle dot, so a line
 * never starts with one.
 */
export const paragraphText = (paragraph: Paragraph) =>
  typeof paragraph === 'string' ? paragraph : skills.join('\u00a0· ')
