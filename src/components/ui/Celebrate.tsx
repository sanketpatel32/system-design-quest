import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, AnimatePresence } from 'motion/react'
import { spring, useCalm } from '../../lib/motion'
import { IconGem } from '../icons/HudIcons'
import { Mascot } from '../art/Mascot'

/** Counts a number up from 0. Under reduced motion it shows the final value at once. */
export function CountUp({ to, prefix = '', duration = 1.1 }: { to: number; prefix?: string; duration?: number }) {
  const calm = useCalm()
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || calm) return
    const c = animate(0, to, { duration, ease: [0.2, 0.8, 0.3, 1], onUpdate: (v) => (el.textContent = `${prefix}${Math.round(v)}`) })
    return () => c.stop()
  }, [to, prefix, duration, calm])
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {to}
    </span>
  )
}

/** Gems fly from `from` (an element) into the HUD xp chip (#hud-xp). Decorative only. */
export function GemFlight({ from, count = 7 }: { from: React.RefObject<HTMLElement | null>; count?: number }) {
  const calm = useCalm()
  const [path, setPath] = useState<{ x0: number; y0: number; dx: number; dy: number } | null>(null)
  useLayoutEffect(() => {
    if (calm || !from.current) return
    const target = [...document.querySelectorAll<HTMLElement>('#hud-xp')].find((e) => e.getBoundingClientRect().width > 0)
    if (!target) return
    const a = from.current.getBoundingClientRect()
    const b = target.getBoundingClientRect()
    const x0 = a.left + a.width / 2 - 12
    const y0 = a.top + a.height / 2 - 12
    setPath({ x0, y0, dx: b.left + b.width / 2 - 12 - x0, dy: b.top + b.height / 2 - 12 - y0 })
  }, [calm, from])
  if (!path) return null
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
      {Array.from({ length: count }).map((_, i) => {
        const spread = (i - (count - 1) / 2) * 18
        return (
          <motion.span
            key={i}
            className="absolute"
            style={{ left: path.x0, top: path.y0 }}
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
            animate={{ x: [0, spread, path.dx], y: [0, -60 - Math.abs(spread), path.dy], scale: [0.4, 1.2, 0.6], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.95, delay: 0.25 + i * 0.07, ease: 'easeInOut', times: [0, 0.35, 1] }}
          >
            <IconGem size={24} />
          </motion.span>
        )
      })}
    </div>
  )
}

/** A short "Level up!" moment. Not a dialog: it never takes focus or pointer events and fades on its own. */
export function LevelUp({ level, onDone }: { level: number | null; onDone: () => void }) {
  const calm = useCalm()
  useEffect(() => {
    if (level === null) return
    const t = setTimeout(onDone, calm ? 2500 : 2400)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])
  return (
    <AnimatePresence>
      {level !== null && (
        <motion.div
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-24 z-[95] -translate-x-1/2"
          initial={calm ? { opacity: 0 } : { opacity: 0, scale: 0.4, y: -40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={spring.pop}
        >
          <div className="levelup relative flex items-center gap-3 overflow-hidden rounded-3xl bg-[#ce82ff] px-6 py-3 text-white shadow-[0_6px_0_#a560e8]">
            <Mascot mood="happy" size={56} />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-white">Level up!</p>
              <p className="font-display whitespace-nowrap text-3xl leading-none">Level {level}</p>
            </div>
            <span className="bar-shine" aria-hidden />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
