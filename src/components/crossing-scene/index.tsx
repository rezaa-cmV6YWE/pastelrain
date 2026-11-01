import { MotionConfig } from 'motion/react'

import { Clouds } from './clouds'
import { Crossing } from './crossing'
import { Foreground, Ground } from './foreground'
import { Land } from './land'
import { palette } from './palette'
import { ParallaxLayer, usePointerParallax } from './parallax'
import { PaperGrain, SceneDefs } from './scene-svg'
import { Sea } from './sea'
import { Sky } from './sky'
import { Title } from './title'

export function CrossingScene() {
  const p = usePointerParallax()

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-label="Seaside railway crossing"
        className="relative h-svh w-full overflow-hidden"
        style={{ backgroundColor: palette.sky }}
      >
        <SceneDefs />
        {/*
         * Portrait: frame ~820 viewBox units around both signals and gates
         * (centred near x=765), anchored to the bottom; the section's sky colour
         * fills the space above. The bottom inset leaves room for the 16px
         * vertical parallax swing.
         */}
        <div className="absolute inset-0 portrait:top-auto portrait:right-[-9vw] portrait:bottom-8 portrait:h-[min(calc(110vw-6rem),calc(100%-2rem))]">
          <ParallaxLayer pointer={p} depth={0}>
            <Sky />
          </ParallaxLayer>
          <ParallaxLayer pointer={p} depth={8}>
            {/*
             * Tall phones: grow the clouds about the horizon (y=560 of 900) so
             * the cumulus towers into the empty sky; their bases stay behind the
             * sea.
             */}
            <div className="absolute inset-0 origin-[50%_62.2%] [@media(max-aspect-ratio:3/5)]:scale-[2.4]">
              <Clouds />
            </div>
          </ParallaxLayer>
          <ParallaxLayer pointer={p} depth={14}>
            <Sea />
          </ParallaxLayer>
          <ParallaxLayer pointer={p} depth={20}>
            <Land />
          </ParallaxLayer>
          <ParallaxLayer pointer={p} depth={28}>
            <Ground />
            <Crossing />
          </ParallaxLayer>
          <ParallaxLayer pointer={p} depth={40}>
            <Foreground />
          </ParallaxLayer>
        </div>
        {/* outside the portrait wrapper so it stays in the top sky on phones */}
        <ParallaxLayer pointer={p} depth={6}>
          <Title />
        </ParallaxLayer>
        <PaperGrain />
      </section>
    </MotionConfig>
  )
}
