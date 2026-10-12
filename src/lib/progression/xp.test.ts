import { describe, expect, it } from 'vitest'
import { awardTopicClearXp } from './xp'

describe('xp idempotency', () => {
  it('awards first clear once', () => {
    expect(awardTopicClearXp(false).xp).toBe(100)
    expect(awardTopicClearXp(true).xp).toBe(0)
  })
})
