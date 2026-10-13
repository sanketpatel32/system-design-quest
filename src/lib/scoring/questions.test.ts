import { describe, expect, it } from 'vitest'
import type { TradeoffQuestion } from '../../content/types'
import { gradeMultipleChoice, gradeQuestion, gradeTradeoff } from './questions'

describe('gradeMultipleChoice', () => {
  it('accepts alternative correct sets', () => {
    const q = {
      id: 'q',
      type: 'multiple_choice' as const,
      prompt: 'p',
      choices: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      correctChoiceIds: ['a'],
      alternativeChoiceIds: ['b'],
      explanation: 'e',
    }
    expect(gradeMultipleChoice(q, ['b']).correct).toBe(true)
  })
})

describe('gradeTradeoff structured', () => {
  const q: TradeoffQuestion = {
    id: 't1',
    type: 'tradeoff',
    prompt: 'pick',
    approaches: [
      { id: 'scale', label: 'Scale out', description: 'Add nodes' },
      { id: 'buy', label: 'Bigger box', description: 'Vertical scale' },
    ],
    correctApproachId: 'scale',
    constraints: ['Multi-AZ', 'p95 < 300ms'],
    rationaleOptions: [
      { id: 'r1', label: 'Horizontal adds fault isolation' },
      { id: 'r2', label: 'Cheaper than one giant machine' },
      { id: 'bad', label: 'Ignore monitoring' },
    ],
    correctRationaleIds: ['r1', 'r2'],
    distractorRationaleIds: ['bad'],
    explanation: 'e',
  }

  it('passes when approach and rationales match', () => {
    const r = gradeTradeoff(q, 'scale', ['r1', 'r2'])
    expect(r.correct).toBe(true)
  })

  it('fails on distractor rationale', () => {
    const r = gradeTradeoff(q, 'scale', ['r1', 'bad'])
    expect(r.correct).toBe(false)
    expect(r.feedback).toMatch(/does not hold/)
  })
})

describe('gradeQuestion tradeoff', () => {
  it('routes tradeoff answers', () => {
    const q: TradeoffQuestion = {
      id: 't2',
      type: 'tradeoff',
      prompt: 'p',
      approaches: [{ id: 'a', label: 'A', description: 'd' }],
      correctApproachId: 'a',
      constraints: ['c'],
      rationaleOptions: [{ id: 'r', label: 'R' }],
      correctRationaleIds: ['r'],
      explanation: 'e',
    }
    expect(
      gradeQuestion(q, { approachId: 'a', rationaleIds: ['r'] }).correct,
    ).toBe(true)
  })
})

describe('gradeDragOrder alternatives', () => {
  const q = {
    id: 'x', concept: 'c', type: 'drag_order' as const, prompt: 'p', explanation: 'e',
    items: [{ id: 's1', label: 'a' }, { id: 's2', label: 'b' }, { id: 's3', label: 'c' }],
    correctOrder: ['s1', 's2', 's3'],
    alternativeOrders: [['s2', 's1', 's3']],
  }
  it('accepts the main order and listed alternatives only', () => {
    expect(gradeQuestion(q, ['s1', 's2', 's3']).correct).toBe(true)
    expect(gradeQuestion(q, ['s2', 's1', 's3']).correct).toBe(true)
    expect(gradeQuestion(q, ['s3', 's1', 's2']).correct).toBe(false)
  })
})

describe('gradeEstimationQuestion tolerance', () => {
  const q = { id: 'e', concept: 'c', type: 'estimation' as const, prompt: 'p', explanation: 'e', unit: 'ms', target: 450, assumptions: [], formula: '', workedAnswer: '', tolerance: 0.1 }
  it('uses the question tolerance', () => {
    expect(gradeQuestion(q, '300').correct).toBe(false)
    expect(gradeQuestion(q, '450').correct).toBe(true)
  })
})
