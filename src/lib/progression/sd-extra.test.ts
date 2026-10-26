import { describe, expect, it } from 'vitest'
import { computeUnlocksAfterClear, isTopicUnlocked } from './unlocks'
import { LESSON_N, unitOf } from '../../content/numbering'

const EXTRAS = [501, 502, 503, 504, 505, 506, 507, 508]
const byN = new Map([...LESSON_N].map(([id, n]) => [n, id]))
const lessonsInOrder = [...byN.keys()].sort((a, b) => a - b).map((n) => byN.get(n)!)

describe('System Design extra lessons (501+)', () => {
  it('are numbered lessons inside their units', () => {
    for (const id of EXTRAS) expect(LESSON_N.has(id)).toBe(true)
    expect(unitOf(507)).toBe(1)
  })
  it('are open from the start, with or without a stored unlock', () => {
    for (const id of EXTRAS) expect(isTopicUnlocked(id, [], new Set())).toBe(true)
  })
  it('sit in the suggested order, and the old next lesson still follows them', () => {
    for (let i = 1; i < lessonsInOrder.length; i++) {
      const id = lessonsInOrder[i]!
      if (!EXTRAS.includes(id)) continue
      const before = new Set(lessonsInOrder.slice(0, i - 1))
      const prev = lessonsInOrder[i - 1]!
      expect(computeUnlocksAfterClear(prev, [], new Set([...before, prev]))).toContain(id)
      const next = lessonsInOrder[i + 1]
      if (next !== undefined) expect(computeUnlocksAfterClear(id, [], new Set([...before, prev, id]))).toContain(next)
    }
  })
  it('keep the arena entrance after Unit 1', () => {
    expect(computeUnlocksAfterClear(2, [1, 2], new Set([1, 2]))).toContain(507)
    expect(computeUnlocksAfterClear(507, [1, 2, 507], new Set([1, 2, 507]))).toContain(3)
    expect(computeUnlocksAfterClear(3, [1, 2, 507, 3], new Set([1, 2, 507, 3]))).toContain(74)
  })
})
