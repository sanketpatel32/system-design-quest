import { describe, expect, it } from 'vitest'
import { allTopics } from '../../content/catalog'
import { LESSON_N } from '../../content/numbering'
import { computeUnlocksAfterClear, isTopicUnlocked, levelFromXp, suggestedNext, suggestionHint, topicStatus } from './unlocks'

describe('nothing is locked', () => {
  it('every topic, quiz and boss is open for a brand-new guest', () => {
    for (const t of allTopics) {
      expect(isTopicUnlocked(t.id, [], new Set())).toBe(true)
      expect(topicStatus(t, [], new Set(), false)).toBe('available')
    }
  })

  it('status only says cleared, in progress or open', () => {
    const t = allTopics[0]!
    expect(topicStatus(t, [], new Set([t.id]), false)).toBe('completed')
    expect(topicStatus(t, [], new Set(), true)).toBe('in_progress')
  })

  it('suggests the first uncleared topic in the suggested order, even after skipping ahead', () => {
    const order = [...LESSON_N.keys()]
    expect(suggestedNext(order, new Set())).toBe(order[0])
    expect(suggestedNext(order, new Set([order[0]!, order[5]!]))).toBe(order[1])
    expect(suggestedNext(order, new Set(order))).toBeUndefined()
  })

  it('hints at prerequisites as an optional suggestion, and goes quiet once they are cleared', () => {
    const t = allTopics.find((x) => (x.prereqIds?.length ?? 0) > 0)!
    expect(suggestionHint(t.id, new Set())).toMatch(/Jump in anyway/)
    expect(suggestionHint(t.id, new Set(t.prereqIds))).toBe('')
  })
})

describe('suggested-order bookkeeping (no gating, kept for Review and old saves)', () => {
  it('records the next topic in foundations', () => {
    expect(computeUnlocksAfterClear(1, [1], new Set([1]))).toContain(2)
  })
  it('records the boss arena entrance after topic 3', () => {
    const next = computeUnlocksAfterClear(3, [1, 2, 3], new Set([1, 2, 3]))
    expect(next).toContain(74)
    expect(next).not.toContain(75)
  })
  it('the last lesson of Unit 9 points to Unit 10, not the boss track', () => {
    const next = computeUnlocksAfterClear(73, [73], new Set([73]))
    expect(next).toContain(115)
    expect(next).not.toContain(74)
  })
  it('the last boss does not point at a lesson unit', () => {
    expect(computeUnlocksAfterClear(114, [114], new Set([114]))).not.toContain(115)
  })
  it('levels from xp', () => {
    expect(levelFromXp(0)).toBe(1)
    expect(levelFromXp(500)).toBe(2)
  })
})
