import { describe, expect, it } from 'vitest'
import { computeUnlocksAfterClear, isTopicUnlocked } from './unlocks'
import { LESSON_N, unitOf } from '../../content/numbering'

describe('System Design extra lessons (501+)', () => {
  it('are numbered lessons inside their units', () => {
    for (const id of [501, 502, 503, 504, 505, 506, 507, 508]) expect(LESSON_N.has(id)).toBe(true)
    expect(unitOf(507)).toBe(1)
  })
  it('open once their prerequisites are cleared, even without a stored unlock', () => {
    expect(isTopicUnlocked(501, [], new Set())).toBe(false)
    expect(isTopicUnlocked(501, [], new Set([53]))).toBe(false)
    expect(isTopicUnlocked(501, [], new Set([53, 54]))).toBe(true)
  })
  it('sit in the unit sequence: clearing the lesson before one unlocks it', () => {
    expect(computeUnlocksAfterClear(2, [1, 2], new Set([1, 2]))).toContain(507)
    expect(computeUnlocksAfterClear(507, [1, 2, 507], new Set([1, 2, 507]))).toContain(3)
    expect(computeUnlocksAfterClear(3, [1, 2, 507, 3], new Set([1, 2, 507, 3]))).toContain(74)
  })
})
