import { describe, expect, it } from 'vitest'
import type { ArchitectureRubric } from '../../content/types'
import { gradeArchitecture, type UserGraph } from './graph'

const rubric: ArchitectureRubric = {
  requiredCapabilities: ['client', 'load_balancer', 'service', 'sql_db'],
  acceptableAlternatives: { sql_db: ['nosql_db'] },
  requiredPaths: [
    { from: 'client', to: 'load_balancer' },
    { from: 'load_balancer', to: 'service' },
    { from: 'service', to: 'sql_db' },
  ],
  unsafeFlows: [{ from: 'client', to: 'sql_db' }],
  minSeparation: [{ types: ['service', 'sql_db'], reason: 'layering' }],
  reliabilityChecks: [],
}

describe('graph grading', () => {
  it('penalizes unsafe client to db flow', () => {
    const graph: UserGraph = {
      nodes: [
        { id: 'c', type: 'client', label: 'c' },
        { id: 'db', type: 'sql_db', label: 'db' },
      ],
      edges: [{ source: 'c', target: 'db' }],
    }
    const g = gradeArchitecture(graph, rubric)
    expect(g.score).toBeLessThan(15)
  })

  it('does not max score when adding every component', () => {
    const graph: UserGraph = {
      nodes: [
        { id: 'c', type: 'client', label: 'c' },
        { id: 'lb', type: 'load_balancer', label: 'lb' },
        { id: 's', type: 'service', label: 's' },
        { id: 'db', type: 'sql_db', label: 'db' },
        { id: 'x', type: 'worker', label: 'w' },
      ],
      edges: [
        { source: 'c', target: 'lb' },
        { source: 'lb', target: 's' },
        { source: 's', target: 'db' },
      ],
    }
    const g = gradeArchitecture(graph, rubric)
    expect(g.score).toBeLessThanOrEqual(30)
    expect(g.score).toBeGreaterThan(10)
  })
})
