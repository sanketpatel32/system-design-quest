import { defaultPersistedState, type PersistedState, type SrsCardState, type TopicProgress } from '../storage/schema'

/**
 * Cloud progress format (v1): only the fields that matter across devices, in a compact shape
 * so the blob fits in Clerk privateMetadata (8 KB limit, gzipped server-side).
 * In-progress quiz attempts, interview sessions, boss drafts and preferences stay on the device.
 */
export interface CloudProgress {
  v: 1
  xp: number
  b: string[]
  u: number[]
  /** topicId → [completed 0/1, bestScorePercent, attempts, firstClearXpAwarded 0/1] */
  t: Record<string, [number, number, number, number]>
  /** topicId → [card, viewed 0/1] */
  l: Record<string, [number, number]>
  s: { d: string | null; h: string[] }
  /** [topicId, flashcardId, ease, intervalDays, dueAt, reviews] */
  r: [number, string, number, number, string, number][]
  bo: { c: number; s: number; f: number; sub: Record<string, number> }
}

export const STREAK_HISTORY_CAP = 120

export function toCloud(s: PersistedState): CloudProgress {
  const t: CloudProgress['t'] = {}
  for (const [id, p] of Object.entries(s.topicProgress ?? {})) {
    if (!p) continue
    t[id] = [p.completed ? 1 : 0, Math.round(p.bestScorePercent ?? 0), p.attempts ?? 0, p.firstClearXpAwarded ? 1 : 0]
  }
  const l: CloudProgress['l'] = {}
  for (const [id, p] of Object.entries(s.lessonProgress ?? {})) if (p) l[id] = [p.card ?? 0, p.viewed ? 1 : 0]
  const sub: Record<string, number> = {}
  for (const [id, x] of Object.entries(s.bossProgress?.submissions ?? {})) if (x) sub[id] = x.score
  return {
    v: 1,
    xp: s.xp ?? 0,
    b: [...(s.badges ?? [])],
    u: [...(s.unlockedTopicIds ?? [])],
    t,
    l,
    s: { d: s.streak?.lastActiveDay ?? null, h: [...(s.streak?.history ?? [])].sort().slice(-STREAK_HISTORY_CAP) },
    r: (s.srs ?? []).map((c) => [c.topicId, c.flashcardId, c.ease, c.intervalDays, c.dueAt, c.history?.length ?? 0]),
    bo: { c: s.bossProgress?.completed ? 1 : 0, s: s.bossProgress?.bestScore ?? 0, f: s.bossProgress?.firstClearXpAwarded ? 1 : 0, sub },
  }
}

export function isCloudProgress(x: unknown): x is CloudProgress {
  return !!x && typeof x === 'object' && (x as CloudProgress).v === 1 && typeof (x as CloudProgress).t === 'object'
}

/** Expand cloud progress into a full state (device-only fields take defaults). */
export function fromCloud(c: CloudProgress): PersistedState {
  const base = defaultPersistedState()
  const topicProgress: Record<number, TopicProgress> = {}
  for (const [id, [done, best, attempts, fx]] of Object.entries(c.t ?? {}))
    topicProgress[Number(id)] = { completed: !!done, bestScorePercent: best, attempts, firstClearXpAwarded: !!fx }
  const lessonProgress: PersistedState['lessonProgress'] = {}
  for (const [id, [card, viewed]] of Object.entries(c.l ?? {})) lessonProgress[Number(id)] = { card, viewed: !!viewed, updatedAt: '' }
  const submissions: PersistedState['bossProgress']['submissions'] = {}
  for (const [id, score] of Object.entries(c.bo?.sub ?? {})) submissions[Number(id)] = { score, breakdown: {}, at: '' }
  return {
    ...base,
    xp: c.xp ?? 0,
    badges: c.b ?? [],
    unlockedTopicIds: c.u?.length ? c.u : base.unlockedTopicIds,
    topicProgress,
    lessonProgress,
    streak: { lastActiveDay: c.s?.d ?? null, history: c.s?.h ?? [] },
    srs: (c.r ?? []).map(([topicId, flashcardId, ease, intervalDays, dueAt, n]) => ({
      topicId, flashcardId, ease, intervalDays, dueAt,
      history: Array.from({ length: n }, () => ({ at: '', rating: 'good' as const })),
    })),
    bossProgress: { ...base.bossProgress, completed: !!c.bo?.c, bestScore: c.bo?.s ?? 0, firstClearXpAwarded: !!c.bo?.f, submissions },
  }
}

const union = <T,>(a: T[], b: T[]) => [...new Set([...a, ...b])]
const maxStr = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b)

function mergeSrs(a: SrsCardState[], b: SrsCardState[]): SrsCardState[] {
  const out = new Map<string, SrsCardState>()
  for (const c of [...a, ...b]) {
    const k = `${c.topicId}|${c.flashcardId}`
    const prev = out.get(k)
    // Keep the card that has been reviewed more; on a tie, the later due date
    if (!prev || c.history.length > prev.history.length || (c.history.length === prev.history.length && c.dueAt > prev.dueAt)) {
      out.set(k, c)
    }
  }
  return [...out.values()]
}

/**
 * Merge local and cloud progress without losing anything either side earned:
 * max per topic, union of badges and unlocks, higher XP. Device-only fields come from `local`.
 */
export function mergeProgress(local: PersistedState, cloud: PersistedState): PersistedState {
  const topicProgress: Record<number, TopicProgress> = { ...local.topicProgress }
  for (const [k, c] of Object.entries(cloud.topicProgress ?? {})) {
    const id = Number(k), l = topicProgress[id]
    topicProgress[id] = !l ? c : {
      ...l,
      completed: l.completed || c.completed,
      bestScorePercent: Math.max(l.bestScorePercent, c.bestScorePercent),
      attempts: Math.max(l.attempts, c.attempts),
      firstClearXpAwarded: l.firstClearXpAwarded || c.firstClearXpAwarded,
    }
  }
  const lessonProgress = { ...local.lessonProgress }
  for (const [k, c] of Object.entries(cloud.lessonProgress ?? {})) {
    const id = Number(k), l = lessonProgress[id]
    lessonProgress[id] = !l ? c : { ...l, card: Math.max(l.card, c.card), viewed: l.viewed || c.viewed }
  }
  const submissions = { ...local.bossProgress.submissions }
  for (const [k, c] of Object.entries(cloud.bossProgress?.submissions ?? {})) {
    const id = Number(k), l = submissions[id]
    if (!l || c.score > l.score) submissions[id] = l ? { ...l, score: c.score } : c
  }
  return {
    ...local,
    xp: Math.max(local.xp, cloud.xp),
    badges: union(local.badges, cloud.badges),
    unlockedTopicIds: union(local.unlockedTopicIds, cloud.unlockedTopicIds).sort((a, b) => a - b),
    topicProgress,
    lessonProgress,
    streak: {
      lastActiveDay: maxStr(local.streak.lastActiveDay, cloud.streak.lastActiveDay),
      history: union(local.streak.history, cloud.streak.history).sort(),
    },
    srs: mergeSrs(local.srs, cloud.srs),
    bossProgress: {
      ...local.bossProgress,
      completed: local.bossProgress.completed || cloud.bossProgress.completed,
      bestScore: Math.max(local.bossProgress.bestScore, cloud.bossProgress.bestScore),
      firstClearXpAwarded: local.bossProgress.firstClearXpAwarded || cloud.bossProgress.firstClearXpAwarded,
      submissions,
    },
  }
}
