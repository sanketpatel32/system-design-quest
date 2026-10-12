import { describe, expect, it } from 'vitest'
import { migrateState, parseImportedJson } from './migrate'

describe('storage migrate', () => {
  it('recovers corrupted json', () => {
    expect(parseImportedJson('{not json').xp).toBe(0)
  })

  it('migrates older versions', () => {
    const s = migrateState({ version: 1, xp: 10 })
    expect(s.version).toBeGreaterThanOrEqual(2)
    expect(s.unlockedTopicIds).toContain(1)
  })
})
