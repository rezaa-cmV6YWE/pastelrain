/** The toolbox page lists these; append to add a skill. */
export const skills = [
  'TypeScript',
  'JavaScript',
  'React',
  'Next.js',
  'TanStack Start, Router & Query',
  'Tailwind CSS',
  'Motion',
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
      'The carriage hums along the coast, and the noon light lies across the floor in long pale squares. My name is Rezaa.',
      'If you have ever wondered who builds the quiet things on your screen — the buttons that answer, the pages that unfold as you scroll — that is me. I am a software developer.',
    ],
  },
  {
    numeral: 'II',
    chapter: 'The Craft',
    paragraphs: [
      'I work at the front of the web, where code meets the people who use it.',
      'I care about the parts you only notice when they go wrong: a layout that holds on a small phone, a transition that feels like breathing, a page that is ready before you blink. Most days, I am chasing that feeling.',
    ],
  },
  {
    numeral: 'III',
    chapter: 'The Toolbox',
    paragraphs: [
      'Every traveller packs a bag. Mine is light, and I know every pocket of it:',
      { skills: true },
      'There is always room for one more.',
    ],
  },
  {
    numeral: 'IV',
    chapter: 'The Road So Far',
    paragraphs: [
      'I didn’t start here. Every journey has its stations — places you stop for a while, learn the names of things, and leave a little different.',
      'Mine are still out there, past the window. Let me close the book and show you.',
    ],
  },
]

/** Plain text of a paragraph, for the screen-reader copy and the page. */
export const paragraphText = (paragraph: Paragraph) =>
  typeof paragraph === 'string' ? paragraph : skills.join(' · ')
