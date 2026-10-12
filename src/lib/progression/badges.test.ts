import { describe, expect, it } from 'vitest'
import { badgesAfterTopicClear, badgeAfterMock } from './badges'

describe('badges', () => {
  it('awards first_steps on first topic clear', () => {
    const next = badgesAfterTopicClear(1, new Set([1]), [])
    expect(next).toContain('first_steps')
  })

  it('returns merged badge list without shrinking existing', () => {
    const next = badgesAfterTopicClear(1, new Set([1]), ['first_steps'])
    expect(next.filter((b) => b === 'first_steps').length).toBe(1)
  })

  it('adds interview_ready after mock', () => {
    expect(badgeAfterMock([])).toContain('interview_ready')
  })
})
