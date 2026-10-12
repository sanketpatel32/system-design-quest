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

  // 2. Card headings are topic-specific: no stock headings, no heading reused across topics, no template bodies
  {
    const GENERIC = new Set(['Key idea', 'The core idea', 'How a request flows', 'Watch out for', 'The formulas', 'Why interviewers ask', 'Common trap', 'The brief', 'Quality bar', 'Reference sketch', 'Failure modes', 'Say aloud', 'Overview', 'Summary', 'Introduction'])
    const seen = new Map()
    for (const t of topics) {
      for (const c of t.cards) {
        if (GENERIC.has(c.title)) errors.push(`Topic ${t.id} ${c.id}: generic card heading "${c.title}"`)
        if (seen.has(c.title) && seen.get(c.title) !== t.id) errors.push(`Topic ${t.id} ${c.id}: heading "${c.title}" also used by topic ${seen.get(c.title)}`)
        seen.set(c.title, t.id)
        if (/^\d+ steps from “/.test(c.body)) errors.push(`Topic ${t.id} ${c.id}: templated "N steps from …" body`)
        if (/^Boss \d+ (·|non-functionals|reference path|risks|close)/.test(c.body)) errors.push(`Topic ${t.id} ${c.id}: templated boss card body`)
      }
    }
  }

  // 3. No card repeats the intro (objectives) or another card in the same topic
  {
    const words = (x) => new Set(x.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3 || /^\d+$/.test(w)))
    const jac = (a, b) => {
      const A = words(a), B = words(b)
      if (!A.size || !B.size) return 0
      let i = 0
      for (const w of A) if (B.has(w)) i++
      return i / (A.size + B.size - i)
    }
    const LIMIT = 0.5
    let worst = 0
    for (const t of topics) {
      const intro = t.objectives.join(' ')
      t.cards.forEach((c, i) => {
        const text = [c.body, ...(c.steps ?? [])].join(' ')
        const ji = jac(c.body, intro)
        worst = Math.max(worst, ji)
        if (ji >= LIMIT) errors.push(`Topic ${t.id} ${c.id}: card repeats the lesson intro (similarity ${ji.toFixed(2)})`)
        t.cards.slice(i + 1).forEach((d) => {
          const j = jac(text, [d.body, ...(d.steps ?? [])].join(' '))
          worst = Math.max(worst, j)
          if (j >= LIMIT) errors.push(`Topic ${t.id}: cards ${c.id} and ${d.id} are near-duplicates (similarity ${j.toFixed(2)})`)
        })
      })
    }
    info.push(`Card repetition: highest same-topic similarity ${worst.toFixed(2)} (limit ${LIMIT})`)
  }

  // 7. No categorical capacity claims; peak factors are example assumptions; Lesson 2 shows its reasoning
  {
    const BANNED = /needs? a sharded|Writes at that rate need|too much for one (Postgres|primary|database)|bandwidth is not the bottleneck|which is impossible|Most systems never need sharding|one machine is often enough below|can serve well over|Peak ≈ 2–10× average|standard peak factor(?! for every system)/i
    const walk = (o, at, out) => {
      if (typeof o === 'string') { if (BANNED.test(o)) out.push(at); return }
      if (o && typeof o === 'object') for (const k of Object.keys(o)) if (k !== 'choices') walk(o[k], `${at}.${k}`, out)
    }
    for (const t of topics) {
      const hits = []
      walk({ cards: t.cards, deep: t.deep, bossDeep: t.bossDeep, questions: t.questions, flashcards: t.flashcards }, '', hits)
      for (const h of hits) errors.push(`Topic ${t.id}${h}: categorical claim (state the assumptions and when it holds)`)
    }
    const t2 = byId.get(2)
    const ex = t2.cards.find((c) => c.source === 'deep-numbers')
    if (!ex || (ex.steps ?? []).length < 4) errors.push('Topic 2: the short cards need one complete worked calculation')
    else {
      if (!/relatively modest under these assumptions/.test(ex.note ?? '')) errors.push('Topic 2: bandwidth conclusion must say raw ingress is relatively modest under these assumptions')
      for (const w of ['fan-out', 'replication', 'protocol overhead', 'media', 'hardware', 'indexes', 'durability', 'batching', 'engine']) if (!(ex.note ?? '').includes(w)) errors.push(`Topic 2: worked example should mention ${w}`)
    }
  }

  // 8. Numeric feedback: 'Why' must add a sanity check or design implication, not repeat the worked answer
  {
    const norm = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, '')
    const seen = new Set()
    let n = 0
    for (const t of topics) {
      for (const q of [...t.questions, ...(t.bossStages ?? []).flatMap((st) => st.questions)]) {
        if (q.type !== 'estimation' || seen.has(q.id)) continue
        seen.add(q.id); n++
        const w = norm(q.workedAnswer), e = norm(q.explanation)
        if (e === w || e.includes(w) || w.includes(e)) errors.push(`Topic ${t.id} ${q.id}: 'Why' repeats the worked answer`)
        if (!/^(Sanity check|Design implication)/.test(q.explanation)) errors.push(`Topic ${t.id} ${q.id}: 'Why' should open with a sanity check or design implication`)
      }
    }
    info.push(`Numeric feedback: ${n} estimation questions, each 'Why' is a sanity check or design implication`)
  }

  return { errors, info }
}
