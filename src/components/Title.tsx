import { motion } from 'motion/react'

import { useParallax } from '@/hooks/useParallax'

export default function Title() {
  const { x: titleX, y: titleY } = useParallax(-0.3)
  const { x: tealX, y: tealY } = useParallax(0.08)
  const { x: coralX, y: coralY } = useParallax(0.04)

  return (
    <motion.div
      className="relative flex h-[80svh] w-full items-center justify-center"
      style={{ x: titleX, y: titleY }}
    >
      <motion.h1
        className="font-display text-drop-teal absolute scale-110 text-5xl"
        style={{ x: tealX, y: tealY }}
      >
        パステルレイン
      </motion.h1>
      <motion.h1
        className="font-display text-drop-coral absolute scale-105 text-5xl"
        style={{ x: coralX, y: coralY }}
      >
        パステルレイン
      </motion.h1>
      <motion.h1 className="font-display absolute text-5xl">
        パステルレイン
      </motion.h1>
    </motion.div>
  )
}
