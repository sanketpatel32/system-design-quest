import type { Transition } from 'motion/react'
import { useReducedMotion as useOsReducedMotion } from 'motion/react'
import { useGameStore } from '../../stores/gameStore'

/**
 * Shared spring presets — see DESIGN.md "Motion system". Only transform and opacity are animated.
 * pop:    things appearing (nodes, badges, popovers). Bouncy, settles fast.
 * snappy: presses, bumps and tile lifts. Stiff, almost no overshoot.
 * gentle: page and question transitions. Soft, no bounce.
 * sheet:  bottom sheets and big panels sliding in. A little overshoot.
 * bar:    progress fills. Overshoots slightly then settles.
 */
export const spring = {
  pop: { type: 'spring', stiffness: 520, damping: 22, mass: 0.8 },
  snappy: { type: 'spring', stiffness: 700, damping: 30 },
  gentle: { type: 'spring', stiffness: 260, damping: 30 },
  sheet: { type: 'spring', stiffness: 420, damping: 30 },
  bar: { type: 'spring', stiffness: 160, damping: 14 },
} satisfies Record<string, Transition>

/** True when the OS asks for reduced motion OR the in-app setting is on. Use it to skip non-essential motion. */
export function useCalm() {
  const os = useOsReducedMotion()
  const app = useGameStore((s) => s.preferences.reducedMotion)
  return Boolean(os || app)
}
