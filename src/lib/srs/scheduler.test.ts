import { describe, expect, it } from 'vitest'
import { initialSrs, isDue, scheduleNext } from './scheduler'

describe('SRS scheduler', () => {
  it('marks fresh cards due immediately', () => {
    const s = initialSrs()
    expect(isDue(s.dueAt)).toBe(true)
  })

  it('pushes next review on good rating', () => {
    const base = { ...initialSrs(), dueAt: new Date().toISOString() }
    const next = scheduleNext(base, 'good')
    expect(next.intervalDays).toBeGreaterThan(0)
    expect(new Date(next.dueAt).getTime()).toBeGreaterThan(Date.now() - 1000)
  })

  it('resets interval on again', () => {
    const base = { ease: 2.4, intervalDays: 6, dueAt: new Date().toISOString() }
    const next = scheduleNext(base, 'again')
    expect(next.intervalDays).toBe(0)
    const mins = (new Date(next.dueAt).getTime() - Date.now()) / 60_000
    expect(mins).toBeGreaterThan(5)
    expect(mins).toBeLessThanOrEqual(10.1)
  })
})
