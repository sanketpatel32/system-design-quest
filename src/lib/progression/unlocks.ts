import type { Topic } from '../../content/types'
import { regions, topicsById, orderedTopicsInRegion } from '../../content/catalog'
import { BOSS_N, FUND_N, LESSON_N, learningRegions, PLAYBOOK_ID, topicLabel, unitOf } from '../../content/numbering'

/**
 * Nothing is ever locked: every section, lesson, quiz and boss is open from the start, for guests and signed-in
 * players alike. The order below is only a suggestion (the "Up next" card and the Start bubble on the map).
 */
export type TopicStatus = 'available' | 'in_progress' | 'completed'

/** Real prerequisites (or, for bosses, the lessons the brief builds on) that are not cleared yet. Advice, never a gate. */
export function missingFundPrereqs(topicId: number, completed?: Set<number>): number[] {
  const t = topicsById.get(topicId)
  const pre = t?.boss?.prerequisiteTopicIds ?? t?.prereqIds ?? []
  return pre.filter((id) => !completed?.has(id))
}

/** Always true. Kept so older call sites and saves keep working; nothing in the app is gated. */
export function isTopicUnlocked(_topicId?: number, _unlockedIds?: number[], _completed?: Set<number>): boolean {
  return true
}

/** The suggested next topic in a list given in suggested order: the first one not cleared yet. */
export function suggestedNext(idsInOrder: number[], completed: Set<number>): number | undefined {
  return idsInOrder.find((id) => !completed.has(id))
}

/** A friendly, optional pointer for a topic that builds on lessons you haven't cleared. Empty when there's nothing to suggest. */
export function suggestionHint(topicId: number, completed: Set<number>): string {
  const missing = missingFundPrereqs(topicId, completed)
  if (missing.length === 0) return ''
  const names = missing.slice(0, 2).map((id) => topicsById.get(id)?.title ?? topicLabel(id))
  return `Builds on ${names.join(' and ')}${missing.length > 2 ? ' and more' : ''}. Jump in anyway, or have a look at ${missing.length === 1 ? 'it' : 'them'} first.`
}

/** Where a topic sits in the suggested order, for the soft "suggested order" labels */
export function suggestedOrderLabel(topicId: number): string {
  const topic = topicsById.get(topicId)
  if (!topic) return ''
  if (topicId === PLAYBOOK_ID) return 'Suggested after Unit 1'
  if (BOSS_N.has(topicId)) return BOSS_N.get(topicId) === 1 ? 'Suggested after the Interview Playbook' : `Suggested after Boss ${BOSS_N.get(topicId)! - 1}`
  if (FUND_N.has(topicId)) return `${FUND_N.get(topicId)} in the suggested order`
  const unit = unitOf(topicId)
  return unit ? `Unit ${unit}, lesson ${LESSON_N.get(topicId)} in the suggested order` : ''
}

/**
 * Records the suggested-order neighbours of a cleared topic in `unlockedTopicIds`. That list no longer gates
 * anything; it is kept (and still merged across devices) because Review uses it as "topics you've reached".
 */
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

  // Fundamentals: clearing a topic also opens every topic in its area whose prerequisites are now all cleared
  if (FUND_N.has(clearedTopicId)) {
    const done = new Set([..._completed, clearedTopicId])
    for (const t of ordered) if (t.id !== clearedTopicId && (t.prereqIds?.length ?? 0) > 0 && missingFundPrereqs(t.id, done).length === 0) next.add(t.id)
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
  _unlocked: number[],
  completed: Set<number>,
  inProgress: boolean,
): TopicStatus {
  if (completed.has(topic.id)) return 'completed'
  if (inProgress) return 'in_progress'
  return 'available'
}

export function levelFromXp(xp: number): number {
  return 1 + Math.floor(xp / 500)
}
