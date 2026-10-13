import { describe, expect, it } from 'vitest'
import { orderedTopicsInRegion, topicsById } from '../../content/catalog'
import { FUND_FIRST, FUND_N, fundamentalRegions, LESSON_COUNT, LESSON_N, topicLabel } from '../../content/numbering'
import { migrateState as migrate } from '../storage/migrate'
import { computeUnlocksAfterClear, getUnlockHint, isTopicUnlocked } from './unlocks'

describe('Fundamentals track', () => {
  it('leaves System Design numbering and IDs untouched', () => {
    expect(LESSON_COUNT).toBe(79)
    for (const id of LESSON_N.keys()) expect(id).toBeLessThanOrEqual(120)
    for (const id of FUND_N.keys()) expect(id).toBeGreaterThanOrEqual(200)
  })

  it('opens the first topic of every area without any stored unlock', () => {
    for (const r of fundamentalRegions) {
      const [first, second] = orderedTopicsInRegion(r.id)
      expect(isTopicUnlocked(first!.id, [1])).toBe(true)
      expect(isTopicUnlocked(second!.id, [1])).toBe(false)
    }
    expect(FUND_FIRST.size).toBe(fundamentalRegions.length)
  })

  it('unlocks topics one after another inside an area and never touches System Design', () => {
    for (const r of fundamentalRegions) {
      const line = orderedTopicsInRegion(r.id)
      line.slice(0, -1).forEach((t, i) => {
        const next = computeUnlocksAfterClear(t.id, [1], new Set([t.id]))
        expect(next.sort()).toEqual([1, line[i + 1]!.id].sort())
      })
      expect(computeUnlocksAfterClear(line.at(-1)!.id, [1], new Set())).toEqual([1])
    }
  })

  it('labels topics by area and gives a specific unlock hint', () => {
    const r = fundamentalRegions[0]!
    const [a, b] = orderedTopicsInRegion(r.id)
    expect(topicLabel(a!.id)).toBe(`${r.name} 1`)
    expect(getUnlockHint(b!.id, new Set())).toContain(a!.title)
  })

  it('keeps an existing System Design save intact (no version bump needed)', () => {
    const old = { version: 3, xp: 120, unlockedTopicIds: [1, 2], topicProgress: { 1: { completed: true, bestScorePercent: 100, attempts: 1, firstClearXpAwarded: true } } }
    const m = migrate(old) as { xp: number; unlockedTopicIds: number[]; topicProgress: Record<string, { completed: boolean }> }
    expect(m.xp).toBe(120)
    expect(m.unlockedTopicIds).toEqual(expect.arrayContaining([1, 2]))
    expect(m.topicProgress[1]!.completed).toBe(true)
  })

  it('every fundamentals topic links only to real System Design lessons', () => {
    for (const id of FUND_N.keys()) for (const s of topicsById.get(id)!.seeAlso ?? []) expect(topicsById.get(s.topicId)?.kind).toBe('lesson')
  })
})
