import type { Topic } from './types'
import { orderedTopicsInRegion, regions, topicsById } from './catalog'

/** One numbering scheme for the whole app: Lesson 1-79 in Units 1-10, the Interview Playbook, then Boss 1-40. */
export const learningRegions = regions.filter((r) => r.id !== 'boss-arena' && r.track !== 'fundamentals')
/** Fundamentals areas that have content, in map order */
export const fundamentalRegions = regions.filter((r) => r.track === 'fundamentals' && orderedTopicsInRegion(r.id).length > 0)
/** Position of a fundamentals topic inside its area: "Frontend 3" */
export const FUND_N = new Map<number, number>()
fundamentalRegions.forEach((r) => orderedTopicsInRegion(r.id).forEach((t, i) => FUND_N.set(t.id, i + 1)))
/** The first topic of each area is open from the start; the rest unlock one after another */
export const FUND_FIRST = new Set(fundamentalRegions.map((r) => orderedTopicsInRegion(r.id)[0]!.id))
export function fundAreaName(topicId: number): string | null {
  const t = topicsById.get(topicId)
  return t ? fundamentalRegions.find((r) => r.id === t.region)?.name ?? null : null
}
export const PLAYBOOK_ID = 74
export const LESSON_N = new Map<number, number>()
learningRegions.forEach((r) => orderedTopicsInRegion(r.id).forEach((t) => LESSON_N.set(t.id, LESSON_N.size + 1)))
export const bosses: Topic[] = orderedTopicsInRegion('boss-arena').filter((t) => t.kind === 'boss')
export const BOSS_N = new Map<number, number>(bosses.map((t, i) => [t.id, i + 1]))
export const playbook = topicsById.get(PLAYBOOK_ID)
export const LESSON_COUNT = LESSON_N.size
export const BOSS_COUNT = bosses.length

export function unitOf(topicId: number): number | null {
  const t = topicsById.get(topicId)
  if (!t) return null
  const i = learningRegions.findIndex((r) => r.id === t.region)
  return i === -1 ? null : i + 1
}

/** "Lesson 12", "Interview Playbook", "Boss 3 of 40" */
export function topicLabel(topicId: number): string {
  if (LESSON_N.has(topicId)) return `Lesson ${LESSON_N.get(topicId)}`
  if (FUND_N.has(topicId)) return `${fundAreaName(topicId)} ${FUND_N.get(topicId)}`
  if (BOSS_N.has(topicId)) return `Boss ${BOSS_N.get(topicId)} of ${BOSS_COUNT}`
  if (topicId === PLAYBOOK_ID) return 'Interview Playbook'
  return 'Topic'
}
