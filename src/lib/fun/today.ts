import { allTopics, topicsById } from '../../content/catalog'
import { LESSON_N } from '../../content/numbering'
import { sectionOfTopic, sectionTopics, type SectionId } from '../../content/sections'
import type { Topic } from '../../content/types'
import type { PersistedState } from '../storage/schema'
import { isDue } from '../srs/scheduler'
import type { LastTopic } from './practice'

type Slice = Pick<PersistedState, 'topicProgress' | 'lessonProgress' | 'quizAttempts' | 'unlockedTopicIds' | 'srs'>

const answered = (s: Slice, id: number) => Object.keys((s.quizAttempts[`topic-${id}`] as { results?: object } | undefined)?.results ?? {}).length

/** Topics the learner has reached, read or tried: their flashcards are in Review */
export function studiedTopics(s: Slice): Topic[] {
  return allTopics.filter((t) => s.unlockedTopicIds.includes(t.id) || s.topicProgress[t.id]?.completed || s.lessonProgress[t.id]?.viewed || answered(s, t.id) > 0)
}

export function dueCardCount(s: Slice, now = new Date()): number {
  let n = 0
  for (const t of studiedTopics(s)) {
    for (const f of t.flashcards) {
      const st = s.srs.find((x) => x.topicId === t.id && x.flashcardId === f.id)
      if (!st || isDue(st.dueAt, now)) n++
    }
  }
  return n
}

/** Suggested order: the numbered System Design lessons, otherwise the section's own order */
export function suggestedOrder(section: SectionId): Topic[] {
  if (section !== 'system-design') return sectionTopics(section)
  return [...LESSON_N.keys()].map((id) => topicsById.get(id)).filter((t): t is Topic => Boolean(t))
}

export type ContinueTarget = { topic: Topic; to: string; cta: string; detail: string; resumed: boolean }

/**
 * What Continue on home should open: the topic the learner was last in (if not cleared yet),
 * else the next suggested lesson in the section they used last.
 */
export function continueTarget(s: Slice, last: LastTopic | null, section: SectionId): ContinueTarget | null {
  const lastTopic = last ? topicsById.get(last.id) : undefined
  const topic = lastTopic && !s.topicProgress[lastTopic.id]?.completed
    ? lastTopic
    : suggestedOrder(section).find((t) => !s.topicProgress[t.id]?.completed)
      ?? allTopics.find((t) => t.kind !== 'boss' && !s.topicProgress[t.id]?.completed)
  if (!topic) return null
  const n = answered(s, topic.id)
  const lp = s.lessonProgress[topic.id]
  const resumed = Boolean(n || (lp && (lp.card > 0 || lp.viewed)))
  if (n) return { topic, to: `/quiz/${topic.slug}`, cta: 'Continue quiz', detail: `Quiz in progress · ${n} of ${topic.questions.length} answered`, resumed }
  if (lp?.viewed) return { topic, to: `/quiz/${topic.slug}`, cta: 'Take the quiz', detail: 'Lesson read · the quiz is next', resumed }
  if (lp && lp.card > 0) return { topic, to: `/topic/${topic.slug}`, cta: 'Continue lesson', detail: `Lesson in progress · card ${lp.card + 1} of ${topic.cards.length}`, resumed }
  const sec = sectionOfTopic(topic.id)
  const pos = suggestedOrder(sec).findIndex((t) => t.id === topic.id)
  return { topic, to: `/topic/${topic.slug}`, cta: 'Start lesson', detail: `${topic.cards.length} short cards, then ${topic.questions.length} questions${pos >= 0 ? ` · lesson ${pos + 1}` : ''}`, resumed }
}
