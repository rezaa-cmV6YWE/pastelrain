import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { ReactLenis } from 'lenis/react'

import { umami } from '#/analytics'

import ogImage from '../assets/og.jpg?url'
import { palette } from '../components/scene-kit/palette'

import appCss from '../styles.css?url'

/** The deployed origin; social cards need absolute URLs. */
const site = 'https://pastelrain.com'
const title = 'Re: software developer'
const description =
  'A train ride along the coast, from noon to the last fireworks: Rezaa, a software developer who builds the quiet things on your screen.'
const image = new URL(ogImage, site).href
const imageAlt =
  'A paper-cut seaside railway crossing under a summer sky, with the title “Re:” over the clouds.'

export const Route = createRootRoute({
  // `_notFound` (router-core's only flag for it): no route matched, so the
  // root shows the not-found page
  head: ({ match: { _notFound: lost } }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: lost ? 'Not on this line · Re:' : title },
      ...(lost ? [{ name: 'robots', content: 'noindex' }] : []),
      { name: 'description', content: description },
      { name: 'author', content: 'Rezaa' },
      { name: 'theme-color', content: palette.sky },
      { name: 'color-scheme', content: 'light' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'pastelrain' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:url', content: `${site}/` },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:image:type', content: 'image/jpeg' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: imageAlt },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@rezaa_cmV6YWE' },
      { name: 'twitter:creator', content: '@rezaa_cmV6YWE' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { name: 'twitter:image:alt', content: imageAlt },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'canonical', href: `${site}/` },
      // `public/`; the .ico is for browsers without SVG icons (sizes keeps others on the SVG)
      { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
    // Umami (`#/analytics`), production only
    scripts: import.meta.env.DEV
      ? []
      : [
          {
            src: umami.src,
            defer: true,
            'data-website-id': umami.websiteId,
            'data-domains': umami.domains,
          },
        ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* window-level smooth scrolling; Lenis skips smoothing for prefers-reduced-motion */}
        <ReactLenis root />
        {children}
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{
              position: 'top-left',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
