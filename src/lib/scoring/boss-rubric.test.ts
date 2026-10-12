import { describe, expect, it } from 'vitest'
import topics from '../../content/generated/topics.json'
import type { Topic } from '../../content/types'
import { gradeArchitecture } from './graph'

describe('per-boss rubric paths', () => {
  const bosses = (topics as Topic[]).filter((t) => t.kind === 'boss')

  it('boss rubrics define at least one required path each', () => {
    for (const b of bosses) {
      expect(b.boss?.rubric.requiredPaths.length).toBeGreaterThan(0)
    }
  })

  it('URL shortener rubric expects service to nosql_db', () => {
    const url = bosses.find((b) => b.id === 75)!
    const paths = url.boss!.rubric.requiredPaths
    expect(paths.some((p) => p.from === 'service' && p.to === 'nosql_db')).toBe(true)
  })

  it('grades empty canvas at zero architecture points', () => {
    const boss = bosses[0]!
    const g = gradeArchitecture({ nodes: [], edges: [] }, boss.boss!.rubric, 30)
    expect(g.score).toBe(0)
  })
})
