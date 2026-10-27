import { describe, expect, it } from 'vitest'
import { validateProgress } from '../../../api/_validate.js'
import { defaultPersistedState } from '../storage/schema'
import type { Mistake, Practice } from '../fun/practice'
import { toCloud } from './merge'
import { fromCloudPractice, MAX_SYNC_MISTAKES, mergePractice, toCloudPractice } from './practiceSync'

const log = (over: Partial<Practice> = {}): Practice => ({ goal: 10, goalAt: null, days: {}, mistakes: [], last: null, welcomeDone: false, goalCelebrated: null, ...over })
const miss = (topicId: number, questionId: string, dueAt: string, step = 0, misses = 1): Mistake => ({ topicId, questionId, dueAt, step, misses })
const roundTrip = (p: Practice) => fromCloudPractice(JSON.parse(JSON.stringify(toCloudPractice(p))))

describe('practice log cloud sync', () => {
  it('round-trips goal, missed queue and last topic (to the minute)', () => {
    const p = log({ goal: 20, goalAt: '2026-10-20T10:00:00.000Z', welcomeDone: true, mistakes: [miss(3, 't3-a1', '2026-10-28T05:30:00.000Z', 1, 2)], last: { id: 3, where: 'quiz', at: '2026-10-26T08:15:00.000Z' } })
    const back = roundTrip(p)
    expect(back).toEqual({ goal: 20, goalAt: p.goalAt, welcomeDone: true, mistakes: p.mistakes, last: p.last })
  })

  it('unions the missed queues and keeps the later due date for the same question', () => {
    const local = log({ mistakes: [miss(1, 'a', '2026-10-28T00:00:00.000Z', 0, 1), miss(2, 'b', '2026-10-29T00:00:00.000Z')] })
    const cloud = roundTrip(log({ mistakes: [miss(1, 'a', '2026-11-01T00:00:00.000Z', 2, 3), miss(4, 'c', '2026-10-30T00:00:00.000Z')] }))
    const m = mergePractice(local, cloud).mistakes
    expect(m.map((x) => x.questionId).sort()).toEqual(['a', 'b', 'c'])
    expect(m.find((x) => x.questionId === 'a')).toMatchObject({ dueAt: '2026-11-01T00:00:00.000Z', step: 2, misses: 3 })
    // and the other way round: the later local copy wins
    const m2 = mergePractice(log({ mistakes: [miss(1, 'a', '2026-12-01T00:00:00.000Z', 1, 1)] }), cloud).mistakes
    expect(m2.find((x) => x.questionId === 'a')).toMatchObject({ dueAt: '2026-12-01T00:00:00.000Z', step: 1, misses: 3 })
  })

  it('keeps the newer last topic', () => {
    const older = { id: 1, where: 'lesson' as const, at: '2026-10-20T00:00:00.000Z' }
    const newer = { id: 7, where: 'quiz' as const, at: '2026-10-25T00:00:00.000Z' }
    expect(mergePractice(log({ last: older }), roundTrip(log({ last: newer }))).last).toEqual(newer)
    expect(mergePractice(log({ last: newer }), roundTrip(log({ last: older }))).last).toEqual(newer)
    expect(mergePractice(log({ last: null }), roundTrip(log({ last: older }))).last).toEqual(older)
  })

  it("keeps the user's picked goal over a new device's default, and the newer pick across devices", () => {
    // fresh device (default 10, never picked) signs in: the cloud's picked goal wins
    expect(mergePractice(log(), roundTrip(log({ goal: 5, goalAt: '2026-10-01T00:00:00.000Z' })))).toMatchObject({ goal: 5 })
    // "No goal" (0) is a real choice and survives too
    expect(mergePractice(log(), roundTrip(log({ goal: 0, goalAt: '2026-10-01T00:00:00.000Z' })))).toMatchObject({ goal: 0 })
    // a cloud default never overrides a local pick
    expect(mergePractice(log({ goal: 20, goalAt: '2026-10-01T00:00:00.000Z' }), roundTrip(log()))).toMatchObject({ goal: 20 })
    // both picked: newer wins
    expect(mergePractice(log({ goal: 20, goalAt: '2026-10-05T00:00:00.000Z' }), roundTrip(log({ goal: 5, goalAt: '2026-10-01T00:00:00.000Z' })))).toMatchObject({ goal: 20 })
    expect(mergePractice(log({ goal: 20, goalAt: '2026-10-01T00:00:00.000Z' }), roundTrip(log({ goal: 5, goalAt: '2026-10-05T00:00:00.000Z' })))).toMatchObject({ goal: 5 })
  })

  it('keeps device-only fields (day counts, celebration) from this device', () => {
    const local = log({ days: { '2026-10-27': 4 }, goalCelebrated: '2026-10-27' })
    expect(mergePractice(local, roundTrip(log({ welcomeDone: true })))).toMatchObject({ days: { '2026-10-27': 4 }, goalCelebrated: '2026-10-27', welcomeDone: true })
  })

  it('sends at most the soonest-due missed questions, and the server accepts it', () => {
    const many = Array.from({ length: 300 }, (_, i) => miss(1 + (i % 330), `t${i}-a${i % 9}`, new Date(Date.UTC(2026, 10, 1) + (300 - i) * 3_600_000).toISOString()))
    const c = toCloudPractice(log({ mistakes: many }))
    expect(c.m).toHaveLength(MAX_SYNC_MISTAKES)
    expect(c.m[0]![2]).toBeLessThanOrEqual(c.m[1]![2])
    const r = validateProgress({ ...toCloud(defaultPersistedState()), pr: c })
    expect(r.ok && r.value.pr).toEqual(c)
  })

  it('server rejects malformed practice logs and still accepts blobs without one', () => {
    const good = { ...toCloud(defaultPersistedState()), pr: toCloudPractice(log()) }
    expect(validateProgress(good).ok).toBe(true)
    expect(validateProgress(toCloud(defaultPersistedState())).ok).toBe(true)
    const bad = (pr: unknown) => validateProgress({ ...good, pr }).ok
    expect(bad(null)).toBe(false)
    expect(bad({ ...good.pr, g: 500 })).toBe(false)
    expect(bad({ ...good.pr, w: 2 })).toBe(false)
    expect(bad({ ...good.pr, m: [[1, 'x'.repeat(500), 1, 0, 1]] })).toBe(false)
    expect(bad({ ...good.pr, m: [[1, '', 1, 0, 1]] })).toBe(false)
    expect(bad({ ...good.pr, m: Array.from({ length: 101 }, () => [1, 'a', 1, 0, 1]) })).toBe(false)
    expect(bad({ ...good.pr, la: [1, 'quiz', 5] })).toBe(false)
    const r = validateProgress({ ...good, pr: { ...good.pr, junk: 'x'.repeat(1000) } })
    expect(r.ok && 'junk' in (r.value.pr as object)).toBe(false)
  })

  it('a fully completed game plus a full missed queue still fits Clerk metadata once gzipped', async () => {
    const ids = Array.from({ length: 330 }, (_, i) => i + 1)
    const s = defaultPersistedState()
    s.xp = 99999
    s.unlockedTopicIds = ids
    s.topicProgress = Object.fromEntries(ids.map((i) => [i, { completed: true, bestScorePercent: 100, attempts: 3, firstClearXpAwarded: true }]))
    s.lessonProgress = Object.fromEntries(ids.map((i) => [i, { card: 6, viewed: true, updatedAt: 'x' }]))
    const history = Array.from({ length: 365 }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10))
    s.streak = { lastActiveDay: history.at(-1)!, history }
    const mistakes = Array.from({ length: 300 }, (_, i) => miss(1 + ((i * 37) % 330), `t${(i * 37) % 330}-a${i % 9}`, new Date(Date.UTC(2026, 10, 1) + i * 7_777_777).toISOString(), i % 3, 1 + (i % 5)))
    const blob = { ...toCloud(s), pr: toCloudPractice(log({ goal: 20, goalAt: new Date().toISOString(), mistakes, last: { id: 330, where: 'quiz', at: new Date().toISOString() } })) }
    const gz = await new Response(new Response(JSON.stringify(blob)).body!.pipeThrough(new CompressionStream('gzip'))).arrayBuffer()
    expect(Math.ceil(gz.byteLength / 3) * 4).toBeLessThan(7000) // base64 size, same LIMIT as api/progress.js
  })
})
