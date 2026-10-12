import { describe, expect, it } from 'vitest'
import { gradeEstimation, normalizeEstimationInput } from './estimation'

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
