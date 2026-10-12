import { describe, expect, it } from 'vitest'
import { currentStreakCount, kolkataDayKey, recordStreakActivity } from './kolkata'

describe('streak kolkata', () => {
  it('counts unique day once', () => {
    const day = kolkataDayKey(new Date('2026-10-12T10:00:00+05:30'))
    const r1 = recordStreakActivity([], null, new Date('2026-10-12T10:00:00+05:30'))
    const r2 = recordStreakActivity(r1.history, r1.lastActiveDay, new Date('2026-10-12T20:00:00+05:30'))
    expect(r2.history.filter((d) => d === day).length).toBe(1)
  })

  it('computes consecutive streak', () => {
    const history = ['2026-10-10', '2026-10-11', '2026-10-12']
    expect(currentStreakCount(history, new Date('2026-10-12T18:00:00+05:30'))).toBe(3)
  })
})
