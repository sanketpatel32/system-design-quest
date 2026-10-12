// Rules from the third review round. Each block guards one fixed issue so it cannot come back.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const STAGES = ['Requirements', 'Estimation', 'API', 'High-level design', 'Deep dive', 'Wrap-up']

export function checkR3(topics, root) {
  const errors = []
  const info = []
  const byId = new Map(topics.map((t) => [t.id, t]))

  // 1. One interview framework: six stages including API, everywhere
  {
    const page = readFileSync(join(root, 'src/pages/InterviewPage.tsx'), 'utf8')
    const labels = [...page.slice(page.indexOf('const STAGES'), page.indexOf('] as const')).matchAll(/label: '([^']+)'/g)].map((m) => m[1])
    if (labels.join('|') !== STAGES.join('|')) errors.push(`Interview mode stages are [${labels.join(', ')}], expected the six-stage plan`)
    const t1 = byId.get(1)
    const stageCard = t1.cards.find((c) => c.steps?.length)
    if (!stageCard || stageCard.steps.length !== 6 || !stageCard.steps.every((s, i) => s.startsWith(STAGES[i]))) errors.push('Topic 1: the stage card must list the six stages in order')
    for (const id of [1, 74]) {
      for (const q of byId.get(id).questions) {
        if (q.type === 'drag_order' && /stage|phase|budget/i.test(q.prompt) && q.items.length !== 6) errors.push(`Topic ${id} ${q.id}: interview-stage ordering must have six stages`)
      }
    }
    const blob = JSON.stringify(topics)
    if (/Trade-offs (&|and) wrap-up|five stages|5 stages|5 steps from “Clarify/i.test(blob)) errors.push('Content still teaches a five-stage interview plan')
  }

  return { errors, info }
}
