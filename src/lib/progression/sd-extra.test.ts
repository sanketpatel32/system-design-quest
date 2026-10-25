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
  it('open once the lesson right before them is cleared, even without a stored unlock', () => {
    expect(isTopicUnlocked(501, [], new Set())).toBe(false)
    expect(isTopicUnlocked(501, [], new Set([53]))).toBe(false)
    expect(isTopicUnlocked(501, [], new Set([53, 54]))).toBe(true)
  })
  it('never open ahead of the unit just because their prerequisites are cleared', () => {
    // 508 builds on 41 and 50 but sits after 506 in Unit 8
    expect(isTopicUnlocked(508, [], new Set([41, 50]))).toBe(false)
    expect(isTopicUnlocked(508, [], new Set([41, 50, 506]))).toBe(true)
  })
  it('do not lock out an existing player who cleared every original lesson before they existed', () => {
    const done = new Set(lessonsInOrder.filter((id) => id <= 120))
    const left = new Set(EXTRAS)
    // keep clearing whichever extra lesson is open until none is left; a lockout would stall the loop
    for (let guard = 0; left.size > 0 && guard < 20; guard++) {
      for (const id of left) if (isTopicUnlocked(id, [], done)) { done.add(id); left.delete(id) }
    }
    expect([...left]).toEqual([])
  })
  it('a new player meets each one in sequence, and the old next lesson still follows it', () => {
    for (let i = 1; i < lessonsInOrder.length; i++) {
      const id = lessonsInOrder[i]!
      if (!EXTRAS.includes(id)) continue
      const before = new Set(lessonsInOrder.slice(0, i - 1))
      expect(isTopicUnlocked(id, [], before)).toBe(false)
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
