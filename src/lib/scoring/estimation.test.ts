import { describe, expect, it } from 'vitest'
import { describeTolerance, gradeEstimation, normalizeEstimationInput } from './estimation'

describe('estimation', () => {
  it('rejects invalid inputs', () => {
    expect(normalizeEstimationInput('')).toBeNull()
    expect(normalizeEstimationInput('abc')).toBeNull()
    expect(normalizeEstimationInput('-1')).toBeNull()
  })

  it('grades within 50% inclusive', () => {
    expect(gradeEstimation(12, 12)).toBe(true)
    expect(gradeEstimation(18, 12)).toBe(true)
    expect(gradeEstimation(19, 12)).toBe(false)
  })
})

describe('per-question tolerance', () => {
  it('exact tolerance accepts only the target', () => {
    expect(gradeEstimation(3, 3, 0)).toBe(true)
    expect(gradeEstimation(2, 3, 0)).toBe(false)
    expect(gradeEstimation(4, 3, 0)).toBe(false)
  })
  it('tight tolerance rejects a near miss that 50% would accept', () => {
    expect(gradeEstimation(300, 450)).toBe(true)
    expect(gradeEstimation(300, 450, 0.1)).toBe(false)
    expect(gradeEstimation(440, 450, 0.1)).toBe(true)
  })
  it('describes the tolerance', () => {
    expect(describeTolerance(0)).toBe('Exactly right')
    expect(describeTolerance(0.1)).toBe('Within 10%')
    expect(describeTolerance()).toBe('Within 50%')
  })
})
