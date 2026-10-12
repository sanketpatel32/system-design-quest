export type SrsRating = 'again' | 'hard' | 'good' | 'easy'

export interface SrsState {
  ease: number
  intervalDays: number
  dueAt: string
}

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
      intervalDays = 1
      ease = Math.max(1.3, ease - 0.2)
      break
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
