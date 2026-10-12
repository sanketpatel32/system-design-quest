import type { Topic } from '../../content/types'
import { regions, topicsById, orderedTopicsInRegion } from '../../content/catalog'

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
  return devUnlockAll() || unlockedIds.includes(topicId)
}

export function getUnlockHint(topicId: number, completedIds: Set<number>): string {
  const topic = topicsById.get(topicId)
  if (!topic) return 'Topic not found.'
  const region = regions.find((r) => r.id === topic.region)
  if (!region) return 'Complete prerequisites to unlock.'

  const ordered = orderedTopicsInRegion(region.id)
  const idx = ordered.findIndex((t) => t.id === topicId)
  if (idx <= 0) {
    const prevRegion = regions.find((r) => r.topicIds.includes(topicId))
    if (prevRegion) {
      const regionIndex = regions.indexOf(prevRegion)
      if (regionIndex > 0) {
        const prevRegion = regions[regionIndex - 1]
        if (!prevRegion) return 'Complete earlier topics in this region.'
        const lastTopic = orderedTopicsInRegion(prevRegion.id).at(-1)
        if (lastTopic && !completedIds.has(lastTopic.id)) {
          return `Finish ${lastTopic.title} in ${prevRegion.name} to unlock this region.`
        }
      }
    }
    return 'Complete earlier topics in this region.'
  }
  const prev = ordered[idx - 1]
  if (prev && !completedIds.has(prev.id)) {
    return `Clear "${prev.title}" (topic ${prev.id}) to unlock this topic.`
  }
  if (topic.region === 'boss-arena' && topic.id === 75) {
    if (!completedIds.has(74)) {
      return 'Complete Interview Playbook (topic 74) to fight your first boss.'
    }
  }
  if (topic.region === 'boss-arena' && topic.id > 75) {
    const prevBoss = topicsById.get(topic.id - 1)
    if (prevBoss && !completedIds.has(prevBoss.id)) {
      return `Defeat "${prevBoss.title}" (topic ${prevBoss.id}) first.`
    }
  }
  if (topic.prereqIds.length > 0) {
    const missing = topic.prereqIds.filter((id) => !completedIds.has(id))
    if (missing.length > 0) {
      const names = missing
        .map((id) => topicsById.get(id)?.title ?? `Topic ${id}`)
        .join(', ')
      return `Recommended: review ${names} before this boss.`
    }
  }
  return 'Complete the previous topic in sequence.'
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
    const regionIndex = regions.indexOf(region)
    if (regionIndex >= 0 && regionIndex < regions.length - 1) {
      const nextRegion = regions[regionIndex + 1]
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
