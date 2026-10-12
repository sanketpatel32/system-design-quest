import { describe, expect, it } from 'vitest'
import type { Question } from '../../content/types'
import { incompleteReason } from './questions'

const order: Question = {
  id: 'o', type: 'drag_order', prompt: 'p', explanation: 'e',
  items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], correctOrder: ['a', 'b'],
} as Question

describe('incompleteReason', () => {
  it('blocks blank and partial ordering answers', () => {
    expect(incompleteReason(order, undefined)).toMatch(/Complete all positions/)
    expect(incompleteReason(order, ['a', ''])).toMatch(/Complete all positions/)
    expect(incompleteReason(order, ['a', 'a'])).toMatch(/Complete all positions/)
    expect(incompleteReason(order, ['b', 'a'])).toBeNull()
  })
  it('blocks a blank estimate but not a wrong one', () => {
    const q = { id: 'e', type: 'estimation', prompt: '', explanation: '', unit: 'QPS', target: 10, assumptions: [], formula: '', workedAnswer: '' } as unknown as Question
    expect(incompleteReason(q, '')).not.toBeNull()
    expect(incompleteReason(q, '999')).toBeNull()
  })
})
