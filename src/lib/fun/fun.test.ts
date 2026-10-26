import { describe, expect, it } from 'vitest'
import { allTopics } from '../../content/catalog'
import { bestRun, byteReaction, pickRound, readingMinutes } from './fun'

describe('fun helpers', () => {
  it('reading time is at least a minute and grows with words', () => {
    expect(readingMinutes({ cards: [] })).toBe(1)
    const long = { cards: [{ id: 'a', kind: 'text' as const, title: 'T', body: 'word '.repeat(450) }] }
    expect(readingMinutes(long)).toBe(3)
    for (const t of allTopics) expect(readingMinutes(t)).toBeGreaterThanOrEqual(1)
  })
  it('best run counts the longest streak of correct answers', () => {
    expect(bestRun([])).toBe(0)
    expect(bestRun([true, true, false, true, true, true, false])).toBe(3)
  })
  it('Byte reacts to combos and is deterministic per key', () => {
    expect(byteReaction(true, 3, 'x')).toBe('3 in a row!')
    expect(byteReaction(true, 6, 'x')).toMatch(/6 in a row/)
    expect(byteReaction(false, 0, 'k')).toBe(byteReaction(false, 0, 'k'))
  })
  it('a round mixes distinct non-boss topics and is stable for a seed', () => {
    const a = pickRound(allTopics, 8, 's1')
    expect(a).toHaveLength(8)
    expect(new Set(a.map((x) => x.topicId)).size).toBe(8)
    expect(a.every((x) => allTopics.find((t) => t.id === x.topicId)!.kind !== 'boss')).toBe(true)
    expect(pickRound(allTopics, 8, 's1').map((x) => x.question.id)).toEqual(a.map((x) => x.question.id))
  })
})
