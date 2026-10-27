import { beforeEach, describe, expect, it } from 'vitest'
import { dueMistakes, recordAnswer, resetPractice, setGoal, todayCount, usePractice, MISTAKE_STEPS } from './practice'
import { renderHook } from '@testing-library/react'

const day = (d: string) => new Date(`${d}T06:00:00Z`)

describe('practice log', () => {
  beforeEach(() => resetPractice())
  const snap = () => renderHook(() => usePractice()).result.current

  it('counts answers per day and reports the goal once', () => {
    setGoal(2)
    expect(recordAnswer(1, 'a', true, day('2026-10-01'))).toBe(false)
    expect(recordAnswer(1, 'b', false, day('2026-10-01'))).toBe(true)
    expect(recordAnswer(1, 'c', true, day('2026-10-01'))).toBe(false)
    expect(todayCount(snap(), day('2026-10-01'))).toBe(3)
    expect(todayCount(snap(), day('2026-10-02'))).toBe(0)
  })

  it('brings a missed question back tomorrow, then later, then retires it', () => {
    recordAnswer(7, 'q1', false, day('2026-10-01'))
    expect(dueMistakes(snap(), day('2026-10-01'))).toHaveLength(0)
    expect(dueMistakes(snap(), day('2026-10-02'))).toHaveLength(1)
    let d = new Date(day('2026-10-02'))
    for (let s = 0; s < MISTAKE_STEPS.length; s++) {
      recordAnswer(7, 'q1', true, d)
      d = new Date(d.getTime() + MISTAKE_STEPS[Math.min(s + 1, MISTAKE_STEPS.length - 1)]! * 86_400_000)
    }
    expect(snap().mistakes).toHaveLength(0)
  })

  it('a correct answer before the due day does not advance it', () => {
    recordAnswer(7, 'q1', false, day('2026-10-01'))
    recordAnswer(7, 'q1', true, day('2026-10-01'))
    expect(snap().mistakes[0]!.step).toBe(0)
  })
})
