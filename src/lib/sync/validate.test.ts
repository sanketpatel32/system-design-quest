import { describe, expect, it } from 'vitest'
import { validateProgress } from '../../../api/_validate.js'
import { toCloud } from './merge'
import { defaultPersistedState } from '../storage/schema'

describe('cloud progress validation (api/progress PUT)', () => {
  it('accepts what the client sends', () => {
    const s = defaultPersistedState()
    s.xp = 420
    s.topicProgress[3] = { completed: true, bestScorePercent: 83, attempts: 2, firstClearXpAwarded: true }
    s.lessonProgress[3] = { card: 4, viewed: true, updatedAt: '' }
    s.srs = [{ topicId: 3, flashcardId: 'f1', ease: 2.5, intervalDays: 3, dueAt: new Date().toISOString(), history: [] }]
    s.streak = { lastActiveDay: '2026-10-26', history: ['2026-10-25', '2026-10-26'] }
    const r = validateProgress(toCloud(s))
    expect(r.ok).toBe(true)
  })
  it('rejects bad shapes and strips unknown fields', () => {
    const good = toCloud(defaultPersistedState())
    expect(validateProgress({ ...good, xp: -5 }).ok).toBe(false)
    expect(validateProgress({ ...good, t: { abc: [1, 2, 3, 4] } }).ok).toBe(false)
    expect(validateProgress({ ...good, r: [[1, 'x'.repeat(500), 2, 1, 'd', 0]] }).ok).toBe(false)
    expect(validateProgress({ ...good, b: new Array(500).fill('x') }).ok).toBe(false)
    expect(validateProgress(null).ok).toBe(false)
    const r = validateProgress({ ...good, extra: 'x'.repeat(1000) })
    expect(r.ok && 'extra' in r.value).toBe(false)
  })
})
