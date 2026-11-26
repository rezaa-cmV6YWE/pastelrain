import { createFileRoute, type MetaDescriptor } from '@tanstack/react-router'
import { useMotionValue } from 'motion/react'

import { useMilestone } from '#/analytics'
import { BeachScene } from '#/components/beach-scene'
import { contacts } from '#/components/beach-scene/contacts'
import { contactsStart, throughSpan } from '#/components/beach-scene/timeline'
import { CrossingScene } from '#/components/crossing-scene'
import { PlatformScene } from '#/components/platform-scene'
import { PaperGrain, SceneDefs } from '#/components/scene-kit/scene-svg'
import { useStableScreen } from '#/components/scene-kit/screen'
import { TrainScene } from '#/components/train-scene'
import { stops } from '#/components/train-scene/stations'
import { skills } from '#/components/train-scene/story'

import { description, image, site, title } from './__root'

/** Structured data for search engines: the site, this page, and who it is about. */
const person = `${site}/#person`
const website = `${site}/#website`
const profile = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': website,
      url: `${site}/`,
      name: 'pastelrain',
      inLanguage: 'en',
      author: { '@id': person },
    },
    {
      '@type': 'ProfilePage',
      '@id': `${site}/#profile`,
      url: `${site}/`,
      name: title,
      description,
      inLanguage: 'en',
      isPartOf: { '@id': website },
      mainEntity: { '@id': person },
      primaryImageOfPage: { '@type': 'ImageObject', url: image, width: 1200, height: 630 },
    },
    {
      '@type': 'Person',
      '@id': person,
      name: 'Rezaa',
      alternateName: 'Reza Ageng Trihandoko',
      url: `${site}/`,
      jobTitle: stops[0].role,
      worksFor: { '@type': 'Organization', name: stops[0].name },
      address: { '@type': 'PostalAddress', addressCountry: 'ID' },
      email: 'mailto:rezaa@pastelrain.com',
      sameAs: contacts.filter((c) => c.href.startsWith('https://')).map((c) => c.href),
      knowsAbout: skills,
    },
  ],
}

// react-router types `meta` as <meta> props only, but its HeadContent renders
// router-core's `script:ld+json` entries as an escaped JSON-LD <script>
const ldJson: MetaDescriptor = { 'script:ld+json': profile }

export const Route = createFileRoute('/')({
  head: () => ({ meta: [ldJson as React.JSX.IntrinsicElements['meta']] }),
  component: Home,
})

function Home() {
  // The crossing → train hand-off's progress (`scene-kit/handoff.ts`): the
  // crossing plays it, the train scene's glass follows it. `arrival` is the
  // train → platform hand-off: the train scene plays it. `pullIn` is the
  // platform rolling into the train's windows (0 → 1), driven by the train
  // scene's scroll. `shore` is the beach scene's scroll progress (0 → 1); it
  // drives the platform view's camera, night and beach layers.
  const handoff = useMotionValue(0)
  const arrival = useMotionValue(0)
  const pullIn = useMotionValue(0)
  const shore = useMotionValue(0)
  useStableScreen()
  // how far visitors get: inside the train, on the platform, at the beach
  // (once its planes replace the platform's), at the contacts
  useMilestone('reach-train', handoff, 1)
  useMilestone('reach-platform', arrival, 1)
  useMilestone('reach-beach', shore, throughSpan[1])
  useMilestone('reach-contacts', shore, contactsStart)
  return (
    <main>
      <SceneDefs />
      <CrossingScene handoff={handoff} />
      <TrainScene handoff={handoff} arrival={arrival} pullIn={pullIn} />
      <PlatformScene pullIn={pullIn} arrival={arrival} shore={shore} />
      <BeachScene shore={shore} />
      <PaperGrain />
    </main>
  )
}
