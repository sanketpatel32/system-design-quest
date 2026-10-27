import { describe, expect, it } from 'vitest'
import { defaultPersistedState } from '../storage/schema'
import { continueTarget, dueCardCount, suggestedOrder } from './today'

describe('home continue target', () => {
  it('starts at lesson 1 for a new learner', () => {
    const s = defaultPersistedState()
    const t = continueTarget(s, null, 'system-design')!
    expect(t.topic.id).toBe(suggestedOrder('system-design')[0]!.id)
    expect(t.cta).toBe('Start lesson')
    expect(t.resumed).toBe(false)
  })
  it('resumes the topic touched last, mid quiz', () => {
    const s = defaultPersistedState()
    const topic = suggestedOrder('system-design')[5]!
    s.quizAttempts[`topic-${topic.id}`] = { hearts: 3, answers: {}, completed: false, results: { [topic.questions[0]!.id]: true } } as never
    const t = continueTarget(s, { id: topic.id, where: 'quiz', at: '' }, 'system-design')!
    expect(t.topic.id).toBe(topic.id)
    expect(t.cta).toBe('Continue quiz')
    expect(t.to).toBe(`/quiz/${topic.slug}`)
  })
  it('skips a cleared last topic and suggests the next lesson', () => {
    const s = defaultPersistedState()
    const [a, b] = suggestedOrder('system-design')
    s.topicProgress[a!.id] = { completed: true, bestScorePercent: 100, attempts: 1, firstClearXpAwarded: true }
    expect(continueTarget(s, { id: a!.id, where: 'quiz', at: '' }, 'system-design')!.topic.id).toBe(b!.id)
  })
  it('counts due flashcards only for studied topics', () => {
    const s = defaultPersistedState()
    const before = dueCardCount(s)
    const t = suggestedOrder('frontend')[0]!
    s.lessonProgress[t.id] = { card: 1, viewed: true, updatedAt: '' }
    expect(dueCardCount(s)).toBe(before + t.flashcards.length)
  })
})
