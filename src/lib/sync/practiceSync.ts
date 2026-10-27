import { MAX_MISTAKES, type LastTopic, type Mistake, type Practice } from '../fun/practice'

/**
 * Cloud format for the practice log (field `pr` of the v1 progress blob). Compact so it fits in
 * Clerk metadata next to the rest: times are whole minutes since 1970, the missed queue is capped.
 * Day counts and the "goal reached" flag stay on the device.
 */
export interface CloudPractice {
  /** daily goal */
  g: number
  /** when the goal was picked (minutes), or null for the default */
  ga: number | null
  /** welcome card dismissed or used */
  w: 0 | 1
  /** missed questions: [topicId, questionId, dueAt (minutes), step, misses] */
  m: [number, string, number, number, number][]
  /** last topic: [topicId, 0 lesson / 1 quiz, at (minutes)] */
  la: [number, 0 | 1, number] | null
}

export const MAX_SYNC_MISTAKES = 100
const toMin = (iso: string) => Math.max(0, Math.round(new Date(iso).getTime() / 60_000) || 0)
const fromMin = (m: number) => new Date(m * 60_000).toISOString()

export function toCloudPractice(p: Practice): CloudPractice {
  // Soonest-due first, so the questions that matter next are the ones that travel
  const m = [...p.mistakes]
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, MAX_SYNC_MISTAKES)
    .map((x): CloudPractice['m'][number] => [x.topicId, x.questionId, toMin(x.dueAt), x.step, x.misses])
  return {
    g: p.goal,
    ga: p.goalAt ? toMin(p.goalAt) : null,
    w: p.welcomeDone ? 1 : 0,
    m,
    la: p.last ? [p.last.id, p.last.where === 'quiz' ? 1 : 0, toMin(p.last.at)] : null,
  }
}

/** The cloud side as a partial practice log (device-only fields left at their defaults) */
export function fromCloudPractice(c: CloudPractice): Pick<Practice, 'goal' | 'goalAt' | 'welcomeDone' | 'mistakes' | 'last'> {
  return {
    goal: c.g,
    goalAt: c.ga === null ? null : fromMin(c.ga),
    welcomeDone: c.w === 1,
    mistakes: c.m.map(([topicId, questionId, due, step, misses]) => ({ topicId, questionId, dueAt: fromMin(due), step, misses })),
    last: c.la ? { id: c.la[0], where: c.la[1] === 1 ? 'quiz' : 'lesson', at: fromMin(c.la[2]) } : null,
  }
}

const later = (a: string | null, b: string | null) => (!a ? b : !b ? a : new Date(b) > new Date(a) ? b : a)

/**
 * Merge two devices' logs: union of missed questions (the later due date wins, misses add up to the max),
 * the newer last topic, the goal picked most recently (a picked goal beats the default), welcome done on either.
 */
export function mergePractice(local: Practice, cloud: ReturnType<typeof fromCloudPractice>): Practice {
  const byKey = new Map<string, Mistake>()
  for (const m of [...local.mistakes, ...cloud.mistakes]) {
    const k = `${m.topicId}|${m.questionId}`
    const prev = byKey.get(k)
    if (!prev) { byKey.set(k, m); continue }
    const keep = new Date(m.dueAt) > new Date(prev.dueAt) || (m.dueAt === prev.dueAt && m.step > prev.step) ? m : prev
    byKey.set(k, { ...keep, misses: Math.max(m.misses, prev.misses) })
  }
  let last: LastTopic | null = local.last
  if (cloud.last && (!local.last || new Date(cloud.last.at) > new Date(local.last.at))) last = cloud.last
  const goalFromCloud = cloud.goalAt !== null && later(local.goalAt, cloud.goalAt) === cloud.goalAt && cloud.goalAt !== local.goalAt
  return {
    ...local,
    goal: goalFromCloud ? cloud.goal : local.goal,
    goalAt: goalFromCloud ? cloud.goalAt : local.goalAt,
    welcomeDone: local.welcomeDone || cloud.welcomeDone,
    mistakes: [...byKey.values()].slice(-MAX_MISTAKES),
    last,
  }
}
