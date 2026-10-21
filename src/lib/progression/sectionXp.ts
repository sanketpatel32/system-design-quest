import { sectionTopics, type SectionId } from '../../content/sections'
import { XP_BOSS_FIRST_CLEAR, XP_TOPIC_FIRST_CLEAR } from './xp'
import type { PersistedState } from '../storage/schema'

/** XP earned from first clears of this section's topics (the global XP total is unchanged) */
export function sectionXp(id: SectionId, topicProgress: PersistedState['topicProgress']) {
  return sectionTopics(id).reduce((n, t) => n + (topicProgress[t.id]?.firstClearXpAwarded ? (t.kind === 'boss' ? XP_BOSS_FIRST_CLEAR : XP_TOPIC_FIRST_CLEAR) : 0), 0)
}
