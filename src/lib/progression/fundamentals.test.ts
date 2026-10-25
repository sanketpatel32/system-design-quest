import { describe, expect, it } from 'vitest'
import { orderedTopicsInRegion, topicsById } from '../../content/catalog'
import { FUND_FIRST, FUND_N, fundamentalRegions, LESSON_COUNT, LESSON_N, topicLabel } from '../../content/numbering'
import { migrateState as migrate } from '../storage/migrate'
import { computeUnlocksAfterClear, getUnlockHint, isTopicUnlocked } from './unlocks'

describe('Fundamentals track', () => {
  it('leaves System Design numbering and IDs untouched', () => {
    expect(LESSON_COUNT).toBe(87)
    for (const id of LESSON_N.keys()) expect(id <= 120 || (id >= 501 && id <= 599)).toBe(true)
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
        expect(next).toEqual(expect.arrayContaining([1, line[i + 1]!.id]))
        // anything else it opens must have its prerequisites met
        for (const id of next) if (id !== 1 && id !== line[i + 1]!.id) expect(topicsById.get(id)!.prereqIds).toEqual(expect.arrayContaining([t.id]))
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

  it('opens a fundamentals topic once its real prerequisites are cleared, without the strict line', () => {
    const t = topicsById.get(251)!
    expect(t.prereqIds).toContain(247)
    expect(isTopicUnlocked(251, [1], new Set())).toBe(false)
    expect(isTopicUnlocked(251, [1], new Set(t.prereqIds))).toBe(true)
    // topics without prerequisites are open from the start
    const open = [...FUND_N.keys()].filter((id) => (topicsById.get(id)!.prereqIds ?? []).length === 0)
    for (const id of open) expect(isTopicUnlocked(id, [1], new Set())).toBe(true)
    // prerequisites always point backwards inside the same area
    for (const id of FUND_N.keys()) for (const p of topicsById.get(id)!.prereqIds ?? []) {
      expect(p).toBeLessThan(id)
      expect(topicsById.get(p)!.region).toBe(topicsById.get(id)!.region)
    }
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
