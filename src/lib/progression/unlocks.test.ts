import { describe, expect, it } from 'vitest'
import { computeUnlocksAfterClear, levelFromXp } from './unlocks'

describe('unlocks', () => {
  it('unlocks next topic in foundations', () => {
    const next = computeUnlocksAfterClear(1, [1], new Set([1]))
    expect(next).toContain(2)
  })

  it('unlocks boss arena tutorial after topic 3', () => {
    const next = computeUnlocksAfterClear(3, [1, 2, 3], new Set([1, 2, 3]))
    expect(next).toContain(74)
    expect(next).not.toContain(75)
  })

  it('the last lesson of Unit 9 opens Unit 10, not the boss track', () => {
    const next = computeUnlocksAfterClear(73, [73], new Set([73]))
    expect(next).toContain(115)
    expect(next).not.toContain(74)
  })

  it('the last boss does not unlock a lesson unit', () => {
    const next = computeUnlocksAfterClear(114, [114], new Set([114]))
    expect(next).not.toContain(115)
  })

  it('levels from xp', () => {
    expect(levelFromXp(0)).toBe(1)
    expect(levelFromXp(500)).toBe(2)
  })
})
