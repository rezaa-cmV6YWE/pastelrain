import { motion } from 'motion/react'
import { useEffect, useId, useRef } from 'react'

import { palette } from '#/components/scene-kit/palette'
import { SeaVignette } from '#/components/scene-kit/vignette'

import type { Project } from './projects'

/** The push between the feed and a project's page, like a phone app's. */
export const push = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }

/**
 * A project's page in the phone: it slides in from the right over the feed,
 * in its card's `paper` colour, with a back button to the feed. It scrolls
 * on its own (`data-lenis-prevent`; the page's scroll is held meanwhile), and
 * its end is padded by `endPadding` so it scrolls clear of the screen's
 * hidden bottom. Opening it focuses the back button.
 */
export function ProjectPage({
  project,
  paper,
  endPadding,
  onBack,
}: {
  project: Project
  paper: string
  endPadding: string
  onBack: () => void
}) {
  const titleId = useId()
  const back = useRef<HTMLButtonElement>(null)
  useEffect(() => back.current?.focus({ preventScroll: true }), [])

  return (
    <motion.section
      aria-labelledby={titleId}
      className="absolute inset-0 flex flex-col"
      style={{
        backgroundColor: paper,
        boxShadow: 'calc(var(--p) * -6) 0 calc(var(--p) * 18) rgb(13 40 80 / 0.18)',
      }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={push}
    >
      <div
        className="flex h-[calc(var(--p)*44)] shrink-0 items-center border-b-[length:calc(var(--p)*1)] border-solid px-[calc(var(--p)*8)]"
        style={{ borderColor: 'rgb(13 40 80 / 0.12)' }}
      >
        <button
          ref={back}
          type="button"
          onClick={onBack}
          className="inline-flex cursor-pointer items-center gap-[calc(var(--p)*2)] rounded-[calc(var(--p)*8)] border-0 bg-transparent px-[calc(var(--p)*6)] py-[calc(var(--p)*6)] font-sans text-[length:calc(var(--p)*15)] font-bold focus-visible:outline-2 focus-visible:outline-offset-0"
          style={{ color: palette.stripe, outlineColor: palette.navy }}
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="size-[calc(var(--p)*18)]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 3 5 8l5 5" />
          </svg>
          Projects
        </button>
      </div>
      <div
        data-lenis-prevent
        className="min-h-0 flex-1 [scrollbar-width:none] overflow-y-auto overscroll-contain"
        style={{ paddingBottom: endPadding }}
      >
        <div
          className="mx-[calc(var(--p)*14)] mt-[calc(var(--p)*14)] aspect-video overflow-hidden rounded-[calc(var(--p)*12)]"
          style={{ backgroundColor: palette.sky }}
        >
          {project.image ? (
            <img
              src={project.image.src}
              alt={project.image.alt}
              decoding="async"
              className="size-full object-cover"
            />
          ) : (
            <SeaVignette className="size-full" />
          )}
        </div>
        <div className="flex flex-col px-[calc(var(--p)*18)] pt-[calc(var(--p)*18)]">
          <h3
            id={titleId}
            className="m-0 font-title text-[length:calc(var(--p)*28)] leading-[1.1] font-semibold text-balance"
          >
            {project.title}
          </h3>
          <p className="m-0 mt-[calc(var(--p)*6)] font-sans text-[length:calc(var(--p)*12)] tracking-wide uppercase opacity-80">
            {project.kind} · {project.year}
          </p>
          <p className="m-0 mt-[calc(var(--p)*14)] font-title text-[length:calc(var(--p)*18)] leading-snug italic">
            {project.summary}
          </p>
          <div className="mt-[calc(var(--p)*16)] flex flex-col gap-[calc(var(--p)*12)] font-sans text-[length:calc(var(--p)*16)] leading-relaxed">
            {project.description.map((paragraph, i) => (
              <p key={i} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>
          {project.stack.length > 0 && (
            <>
              <h4 className="m-0 mt-[calc(var(--p)*24)] font-sans text-[length:calc(var(--p)*12)] font-bold tracking-wide uppercase opacity-80">
                Built with
              </h4>
              <ul className="m-0 mt-[calc(var(--p)*8)] flex list-none flex-wrap gap-[calc(var(--p)*6)] p-0">
                {project.stack.map((item) => (
                  <li
                    key={item}
                    className="rounded-sm px-[calc(var(--p)*7)] py-[calc(var(--p)*3)] font-mono text-[length:calc(var(--p)*12)]"
                    style={{ backgroundColor: palette.paperShade }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}
          {project.links.length > 0 && (
            <div className="mt-[calc(var(--p)*24)] flex flex-wrap gap-[calc(var(--p)*8)]">
              {project.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-[calc(var(--p)*5)] rounded-sm px-[calc(var(--p)*14)] py-[calc(var(--p)*8)] font-sans text-[length:calc(var(--p)*15)] font-bold no-underline transition-[translate] hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    backgroundColor: palette.stripe,
                    color: palette.foam,
                    outlineColor: palette.navy,
                  }}
                >
                  {link.label}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}
