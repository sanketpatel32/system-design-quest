import { describe, it, expect } from 'vitest'
import { defaultPersistedState, type PersistedState } from '../storage/schema'
import { fromCloud, isCloudProgress, mergeProgress, toCloud } from './merge'

const tp = (completed: boolean, best: number, attempts: number) => ({ completed, bestScorePercent: best, attempts, firstClearXpAwarded: completed })
function state(p: Partial<PersistedState>): PersistedState { return { ...defaultPersistedState(), ...p } }

describe('cloud progress merge', () => {
  it('takes the max per topic, union of badges/unlocks and the higher XP', () => {
    const local = state({ xp: 120, badges: ['first-clear'], unlockedTopicIds: [1, 2], topicProgress: { 1: tp(true, 80, 2), 2: tp(false, 40, 1) } })
    const cloud = state({ xp: 300, badges: ['streak-3'], unlockedTopicIds: [1, 3], topicProgress: { 1: tp(true, 70, 5), 3: tp(true, 100, 1) } })
    const m = mergeProgress(local, cloud)
    expect(m.xp).toBe(300)
    expect(m.badges.sort()).toEqual(['first-clear', 'streak-3'])
    expect(m.unlockedTopicIds).toEqual([1, 2, 3])
    expect(m.topicProgress[1]!).toMatchObject({ completed: true, bestScorePercent: 80, attempts: 5 })
    expect(m.topicProgress[2]!).toMatchObject({ completed: false, bestScorePercent: 40 })
    expect(m.topicProgress[3]!).toMatchObject({ completed: true, bestScorePercent: 100 })
  })

  it('never un-completes a topic or un-reads a lesson', () => {
    const local = state({ topicProgress: { 5: tp(false, 50, 3) }, lessonProgress: { 5: { card: 2, viewed: false, updatedAt: 'x' } } })
    const cloud = state({ topicProgress: { 5: tp(true, 90, 1) }, lessonProgress: { 5: { card: 4, viewed: true, updatedAt: '' } } })
    const m = mergeProgress(local, cloud)
    expect(m.topicProgress[5]!.completed).toBe(true)
    expect(m.lessonProgress[5]!).toMatchObject({ card: 4, viewed: true })
  })

  it('unions streak days and keeps device-only fields from local', () => {
    const local = state({ streak: { lastActiveDay: '2026-10-12', history: ['2026-10-11', '2026-10-12'] }, preferences: { soundEnabled: true, reducedMotion: true, hasGestureForSound: false } })
    const cloud = state({ streak: { lastActiveDay: '2026-10-13', history: ['2026-10-10', '2026-10-13'] } })
    const m = mergeProgress(local, cloud)
    expect(m.streak).toEqual({ lastActiveDay: '2026-10-13', history: ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13'] })
    expect(m.preferences.soundEnabled).toBe(true)
  })

  it('keeps the more-reviewed flashcard schedule and the best boss scores', () => {
    const card = (n: number, due: string) => ({ topicId: 1, flashcardId: 'f1', ease: 2.5, intervalDays: n, dueAt: due, history: Array.from({ length: n }, () => ({ at: 'a', rating: 'good' as const })) })
    const local = state({ srs: [card(1, '2026-10-15')], bossProgress: { ...defaultPersistedState().bossProgress, bestScore: 60, submissions: { 10: { score: 60, breakdown: {}, at: '' } } } })
    const cloud = state({ srs: [card(3, '2026-10-20')], bossProgress: { ...defaultPersistedState().bossProgress, bestScore: 75, completed: true, submissions: { 10: { score: 75, breakdown: {}, at: '' } } } })
    const m = mergeProgress(local, cloud)
    expect(m.srs).toHaveLength(1)
    expect(m.srs[0]!.intervalDays).toBe(3)
    expect(m.bossProgress).toMatchObject({ bestScore: 75, completed: true })
    expect(m.bossProgress.submissions[10]!.score).toBe(75)
  })

  it('round-trips through the compact cloud format', () => {
    const s = state({ xp: 999, badges: ['a'], unlockedTopicIds: [1, 2], topicProgress: { 2: tp(true, 88, 2) }, lessonProgress: { 2: { card: 3, viewed: true, updatedAt: 'x' } } })
    const c = JSON.parse(JSON.stringify(toCloud(s)))
    expect(isCloudProgress(c)).toBe(true)
    const back = fromCloud(c)
    expect(back.xp).toBe(999)
    expect(back.topicProgress[2]!).toMatchObject({ completed: true, bestScorePercent: 88, attempts: 2 })
    expect(back.lessonProgress[2]).toMatchObject({ card: 3, viewed: true })
    expect(mergeProgress(defaultPersistedState(), back).topicProgress[2]!.completed).toBe(true)
  })

  it('fits a fully completed game (all topics, a year of streak) in Clerk metadata once gzipped', async () => {
    const ids = Array.from({ length: 330 }, (_, i) => i + 1)
    const topicProgress = Object.fromEntries(ids.map((i) => [i, tp(true, 100, 3)]))
    const lessonProgress = Object.fromEntries(ids.map((i) => [i, { card: 6, viewed: true, updatedAt: 'x' }]))
    const history = Array.from({ length: 365 }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10))
    const s = state({ xp: 99999, unlockedTopicIds: ids, topicProgress, lessonProgress, streak: { lastActiveDay: history.at(-1)!, history } })
    const gz = await new Response(new Response(JSON.stringify(toCloud(s))).body!.pipeThrough(new CompressionStream('gzip'))).arrayBuffer()
    expect(Math.ceil(gz.byteLength / 3) * 4).toBeLessThan(7000) // base64 size
  })
})
