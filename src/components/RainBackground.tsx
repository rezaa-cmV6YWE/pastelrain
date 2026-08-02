import { motion } from 'motion/react'
import { useMemo } from 'react'

import { RainDot, RainDrop, RainPuddle } from '@/components/RainDrop'
import { useParallax } from '@/hooks/useParallax'

const DROP_COLORS = [
  'var(--drop-sky)',
  'var(--drop-purple)',
  'var(--drop-teal)',
  'var(--drop-coral)',
  'var(--drop-yellow)',
  'var(--drop-orange)',
]

type ElementKind = 'drop' | 'dot' | 'puddle'

interface RainElementData {
  id: number
  kind: ElementKind
  left: number
  size: number
  opacity: number
  duration: number
  delay: number
  color: string
}

function makeElements(): Array<RainElementData> {
  const elements: Array<RainElementData> = []
  let id = 0

  for (let i = 0; i < 20; i++) {
    elements.push({
      id: id++,
      kind: 'drop',
      left: Math.random() * 100,
      size: 28 + Math.random() * 32,
      opacity: 0.35 + Math.random() * 0.55,
      duration: 2.5 + Math.random() * 2.5,
      delay: Math.random() * 8,
      color: DROP_COLORS[Math.floor(Math.random() * DROP_COLORS.length)],
    })
  }

  for (let i = 0; i < 5; i++) {
    elements.push({
      id: id++,
      kind: 'dot',
      left: Math.random() * 100,
      size: 10 + Math.random() * 12,
      opacity: 0.4 + Math.random() * 0.5,
      duration: 2.0 + Math.random() * 2.0,
      delay: Math.random() * 8,
      color: DROP_COLORS[Math.floor(Math.random() * DROP_COLORS.length)],
    })
  }

  for (let i = 0; i < 2; i++) {
    elements.push({
      id: id++,
      kind: 'puddle',
      left: Math.random() * 100,
      size: 48 + Math.random() * 40,
      opacity: 0.35 + Math.random() * 0.45,
      duration: 3.5 + Math.random() * 3.0,
      delay: Math.random() * 8,
      color: DROP_COLORS[Math.floor(Math.random() * DROP_COLORS.length)],
    })
  }

  return elements
}

function RainElement({ element }: { element: RainElementData }) {
  const outline = 'var(--rain-ink)'

  return (
    <motion.div
      className="absolute top-0"
      style={{
        left: `${element.left}%`,
        opacity: element.opacity,
      }}
      initial={{ y: '-15vh' }}
      animate={{ y: '115vh' }}
      transition={{
        duration: element.duration,
        delay: element.delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {element.kind === 'drop' && (
        <RainDrop size={element.size} color={element.color} outline={outline} />
      )}
      {element.kind === 'dot' && (
        <RainDot size={element.size} color={element.color} outline={outline} />
      )}
      {element.kind === 'puddle' && (
        <RainPuddle
          width={element.size}
          height={Math.round(element.size * 0.35)}
          color={element.color}
          outline={outline}
        />
      )}
    </motion.div>
  )
}

function ParallaxLayer({
  children,
  depth,
}: {
  children: React.ReactNode
  depth: number
}) {
  const { x, y } = useParallax(depth)

  return (
    <motion.div style={{ x, y }} className="absolute inset-0">
      {children}
    </motion.div>
  )
}

export function RainBackground() {
  const front = useMemo(() => makeElements(), [])
  const back = useMemo(() => makeElements(), [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <ParallaxLayer depth={0.6}>
        {back.map((el) => (
          <RainElement key={el.id} element={el} />
        ))}
      </ParallaxLayer>
      <ParallaxLayer depth={1.2}>
        {front.map((el) => (
          <RainElement key={el.id} element={el} />
        ))}
      </ParallaxLayer>
    </div>
  )
}
