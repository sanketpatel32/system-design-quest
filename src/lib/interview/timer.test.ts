import { describe, expect, it } from 'vitest'
import { overallDeadlineMs, remainingMs, stageDeadlineMs } from './timer'

describe('interview timer', () => {
  it('keeps deadlines across reload math', () => {
    const started = 1_000_000
    const stageStart = started + 60_000
    const deadline = stageDeadlineMs(started, 0, stageStart)
    expect(remainingMs(deadline, stageStart + 4 * 60_000)).toBe(60_000)
    expect(overallDeadlineMs(started)).toBe(started + 45 * 60_000)
  })
})
