import type { Topic } from '../../content/types'
import { regions, topicsById, orderedTopicsInRegion } from '../../content/catalog'
import { BOSS_N, bosses, FUND_FIRST, FUND_N, LESSON_N, learningRegions, PLAYBOOK_ID, topicLabel, unitOf } from '../../content/numbering'

export type TopicStatus = 'locked' | 'available' | 'in_progress' | 'completed'

/**
 * Dev-only: open any URL with ?unlockAll=1 to unlock every topic for this tab (for screenshots and QA).
 * `import.meta.env.DEV` is false in production builds, so this is compiled out of the deployed app.
 */
export function devUnlockAll(): boolean {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false
  try {
    const flag = new URLSearchParams(window.location.search).get('unlockAll')
    if (flag === '1') window.sessionStorage.setItem('sdq-dev-unlock-all', '1')
    if (flag === '0') window.sessionStorage.removeItem('sdq-dev-unlock-all')
    return window.sessionStorage.getItem('sdq-dev-unlock-all') === '1'
  } catch {
    return false
  }
}

export function isTopicUnlocked(topicId: number, unlockedIds: number[]): boolean {
  // Fundamentals: each area's first topic is open from the start (no stored unlock needed, so old saves just work)
  return devUnlockAll() || unlockedIds.includes(topicId) || FUND_FIRST.has(topicId)
}

export function getUnlockHint(topicId: number, _completedIds: Set<number>): string {
  const topic = topicsById.get(topicId)
  if (!topic) return 'Topic not found.'
  const unit1Last = orderedTopicsInRegion('r1-foundations').at(-1)
  // Arena entrance: the playbook opens when Unit 1 is cleared
  if (topicId === PLAYBOOK_ID) {
    return `Clear Unit 1 (finish Lesson ${unit1Last ? LESSON_N.get(unit1Last.id) : 3}: ${unit1Last?.title ?? 'the last lesson'}) to open the boss practice track (Architecture Colosseum).`
  }
  if (BOSS_N.has(topicId)) {
    const n = BOSS_N.get(topicId)!
    if (n === 1) return 'Finish the Interview Playbook to fight Boss 1.'
    const prevBoss = bosses[n - 2]!
    return `Defeat Boss ${n - 1} (${prevBoss.title}) to unlock Boss ${n}.`
  }
  if (FUND_N.has(topicId)) {
    const line = orderedTopicsInRegion(topic.region)
    const prev = line[line.findIndex((t) => t.id === topicId) - 1]
    return prev ? `Clear ${topicLabel(prev.id)} (${prev.title}) to unlock ${topicLabel(topicId)}.` : 'Open from the start.'
  }
  const region = regions.find((r) => r.id === topic.region)
  if (!region) return 'Complete the previous lesson to unlock this one.'
  const ordered = orderedTopicsInRegion(region.id)
  const idx = ordered.findIndex((t) => t.id === topicId)
  if (idx > 0) {
    const prev = ordered[idx - 1]!
    return `Clear Lesson ${LESSON_N.get(prev.id)} (${prev.title}) to unlock Lesson ${LESSON_N.get(topicId)}.`
  }
  const unit = unitOf(topicId) ?? 1
  const prevRegion = learningRegions[unit - 2]
  const last = prevRegion ? orderedTopicsInRegion(prevRegion.id).at(-1) : undefined
  if (last) return `Clear Unit ${unit - 1} (finish Lesson ${LESSON_N.get(last.id)}: ${last.title}) to open Unit ${unit}.`
  return 'Complete the previous lesson to unlock this one.'
}

export function computeUnlocksAfterClear(
  clearedTopicId: number,
  unlocked: number[],
  _completed: Set<number>,
): number[] {
  const next = new Set(unlocked)
  const topic = topicsById.get(clearedTopicId)
  if (!topic) return [...next]

  const region = regions.find((r) => r.id === topic.region)
  if (!region) return [...next]

  const ordered = orderedTopicsInRegion(region.id)
  const idx = ordered.findIndex((t) => t.id === clearedTopicId)
  if (idx >= 0 && idx < ordered.length - 1) {
    const nxt = ordered[idx + 1]
    if (nxt) next.add(nxt.id)
  } else if (idx === ordered.length - 1) {
    // Units run in order; the boss arena is a parallel practice track (opened after Unit 1), so skip over it
    const unitIndex = learningRegions.findIndex((r) => r.id === region.id)
    if (unitIndex >= 0 && unitIndex < learningRegions.length - 1) {
      const nextRegion = learningRegions[unitIndex + 1]
      if (nextRegion) {
        const first = orderedTopicsInRegion(nextRegion.id)[0]
        if (first) next.add(first.id)
      }
    }
  }

  if (topic.region === 'r1-foundations' && clearedTopicId === 3) {
    next.add(74)
  }

  if (topic.region === 'boss-arena' && clearedTopicId === 74) {
    next.add(75)
  }

  if (topic.kind === 'boss' && clearedTopicId >= 75 && clearedTopicId < 114) {
    next.add(clearedTopicId + 1)
  }

  return [...next]
}

export function topicStatus(
  topic: Topic,
  unlocked: number[],
  completed: Set<number>,
  inProgress: boolean,
): TopicStatus {
  if (completed.has(topic.id)) return 'completed'
  if (!isTopicUnlocked(topic.id, unlocked)) {
    return 'locked'
  }
  if (inProgress) return 'in_progress'
  return 'available'
}

export function levelFromXp(xp: number): number {
  return 1 + Math.floor(xp / 500)
}
