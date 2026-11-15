/*
 * The projects, each a card in the phone's feed (`phone.tsx`), in this
 * order; a card's "More" opens the project's page in the phone
 * (`project-page.tsx`). Add a project by
 * appending an entry: the feed's scroll lengthens by `feedPerProject`
 * (`timeline.ts`).
 *
 * Screenshots go in `./images/` and are imported, so Vite fingerprints them
 * (there is no `public/` directory):
 *   import shot from './images/x.webp'
 *   image: { src: shot, alt: '…' }
 * A card without an image shows a small seaside vignette.
 */

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

const sampleLinks: readonly ProjectLink[] = [
  { label: 'Visit', href: 'https://example.com' },
  { label: 'Code', href: 'https://github.com' },
]

export const projects: readonly Project[] = [
  {
    title: 'Sample project one',
    kind: 'Web app',
    year: '2026',
    summary: 'A placeholder web app, standing in for a real project.',
    description: [
      'This entry is a placeholder. Replace it in projects.ts with a real project: what it is, who it is for, and what problem it solves.',
      'A second paragraph can tell how it was built and what was learned along the way.',
    ],
    stack: ['React', 'TypeScript', 'Cloudflare Workers'],
    links: sampleLinks,
  },
  {
    title: 'Oh this is something',
    kind: 'Web app',
    year: '2026',
    summary: 'A placeholder web app, standing in for a real project.',
    description: [
      'This entry is a placeholder. Replace it in projects.ts with a real project: what it is, who it is for, and what problem it solves.',
      'A second paragraph can tell how it was built and what was learned along the way.',
    ],
    stack: ['React', 'TypeScript', 'Cloudflare Workers'],
    links: sampleLinks,
  },
  {
    title: 'Sample project two',
    kind: 'Library',
    year: '2025',
    summary: 'A placeholder library, small and well documented.',
    description: [
      'This entry is a placeholder too. A library might describe its API in a sentence or two and the use case that started it.',
      'Mention who uses it, or what it made easier.',
    ],
    stack: ['TypeScript', 'Vitest'],
    links: sampleLinks,
  },
  {
    title: 'Oh this is something',
    kind: 'Web app',
    year: '2026',
    summary: 'A placeholder web app, standing in for a real project.',
    description: [
      'This entry is a placeholder. Replace it in projects.ts with a real project: what it is, who it is for, and what problem it solves.',
      'A second paragraph can tell how it was built and what was learned along the way.',
    ],
    stack: ['React', 'TypeScript', 'Cloudflare Workers'],
    links: sampleLinks,
  },
  {
    title: 'Oh this is something',
    kind: 'Web app',
    year: '2026',
    summary: 'A placeholder web app, standing in for a real project.',
    description: [
      'This entry is a placeholder. Replace it in projects.ts with a real project: what it is, who it is for, and what problem it solves.',
      'A second paragraph can tell how it was built and what was learned along the way.',
    ],
    stack: ['React', 'TypeScript', 'Cloudflare Workers'],
    links: sampleLinks,
  },
  {
    title: 'Sample project three',
    kind: 'Website',
    year: '2024',
    summary: 'A placeholder website, built for a client.',
    description: [
      'The last placeholder. A website entry might name the client and the brief.',
      'Then the interesting parts: the design, the motion, the performance work.',
    ],
    stack: ['Astro', 'Tailwind CSS', 'Motion', 'Figma'],
    links: sampleLinks,
  },
]
