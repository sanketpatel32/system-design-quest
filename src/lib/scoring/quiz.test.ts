import { describe, expect, it } from 'vitest'
import type { MultipleChoiceQuestion } from '../../content/types'
import { INITIAL_HEARTS, computeQuizSummary } from './quiz'
import { applyAnswer } from './quiz'

const q: MultipleChoiceQuestion = {
  id: 'q1',
  type: 'multiple_choice',
  prompt: 'p',
  choices: [{ id: 'a', label: 'a' }, { id: 'b', label: 'b' }],
  correctChoiceIds: ['b'],
  explanation: 'e',
}

describe('quiz hearts', () => {
  it('loses heart on wrong answer', () => {
    const r = applyAnswer(q, ['a'], INITIAL_HEARTS)
    expect(r.hearts).toBe(2)
    expect(r.result.correct).toBe(false)
  })

  it('passes at 70% with hearts', () => {
    const questions = [q, { ...q, id: 'q2' }, { ...q, id: 'q3' }]
    const summary = computeQuizSummary(questions, { q1: true, q2: true, q3: false }, 2)
    expect(summary.percent).toBe(67)
    expect(summary.passed).toBe(false)
  })
})
