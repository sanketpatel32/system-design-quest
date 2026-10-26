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

  it('every boss rubric is reachable: the reference design scores full marks with no unsafe flow', () => {
    for (const b of bosses) {
      const rubric = b.boss!.rubric
      const types = new Set([
        ...rubric.requiredCapabilities,
        ...rubric.requiredPaths.flatMap((p) => [p.from, p.to]),
      ])
      const graph = {
        nodes: [...types].map((t) => ({ id: t, type: t, label: t })),
        edges: rubric.requiredPaths.map((p) => ({ source: p.from, target: p.to })),
      }
      const g = gradeArchitecture(graph, rubric, 30)
      expect(g.feedback, `boss ${b.id}`).toEqual(['Architecture covers required paths without unsafe shortcuts.'])
      expect(g.score, `boss ${b.id}`).toBe(30)
    }
  })

  it('unsafe flows in boss rubrics never contradict a required path', () => {
    for (const b of bosses) {
      const r = b.boss!.rubric
      for (const u of r.unsafeFlows) {
        expect(r.requiredPaths.some((p) => p.from === u.from && p.to === u.to), `boss ${b.id} ${u.from}->${u.to}`).toBe(false)
      }
    }
  })
})
