export type SrsRating = 'again' | 'hard' | 'good' | 'easy'

export interface SrsState {
  ease: number
  intervalDays: number
  dueAt: string
}

/** Minutes until a card rated Again is due again */
export const AGAIN_MINUTES = 10

export function initialSrs(): SrsState {
  const due = new Date()
  return { ease: 2.5, intervalDays: 0, dueAt: due.toISOString() }
}

export function scheduleNext(
  state: SrsState,
  rating: SrsRating,
  now = new Date(),
): SrsState {
  let { ease, intervalDays } = state
  switch (rating) {
    case 'again':
      // Relearn: the card comes back in ~10 minutes (and later in the same review session), not tomorrow
      ease = Math.max(1.3, ease - 0.2)
      return { ease, intervalDays: 0, dueAt: new Date(now.getTime() + AGAIN_MINUTES * 60_000).toISOString() }
    case 'hard':
      intervalDays = Math.max(1, Math.round(intervalDays * 1.2) || 1)
      ease = Math.max(1.3, ease - 0.05)
      break
    case 'good':
      intervalDays = intervalDays === 0 ? 1 : Math.round(intervalDays * ease)
      break
    case 'easy':
      ease += 0.15
      intervalDays = intervalDays === 0 ? 2 : Math.round(intervalDays * ease * 1.3)
      break
    default:
      break
  }
  const due = new Date(now)
  due.setDate(due.getDate() + intervalDays)
  return { ease, intervalDays, dueAt: due.toISOString() }
}

export function isDue(dueAt: string, now = new Date()): boolean {
  return new Date(dueAt).getTime() <= now.getTime()
}
