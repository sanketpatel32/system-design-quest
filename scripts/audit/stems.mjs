// Near-duplicate question stems across topics.
// Signature = prompt + correct answer (multiple choice) or all items (drag order),
// stopwords removed, light suffix stemming. Score = overlap coefficient
// |A ∩ B| / min(|A|, |B|). Pairs at or above STEM_DUP_THRESHOLD fail the audit
// unless listed in stem-baseline.json (pre-existing pairs, to be burned down).
import { readFileSync, existsSync } from 'node:fs'

export const STEM_DUP_THRESHOLD = 0.6
const STOP = new Set('a an the of to in on for and or is are be by with what which how why when does do it its this that from at as can should most into each one per after before then than not no'.split(' '))
const stem = (w) => w.replace(/(ing|ed|es|s)$/, '')
const toks = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)).map(stem))
const answer = (q) =>
  q.type === 'multiple_choice' ? (q.choices ?? []).filter((c) => (q.correctChoiceIds ?? []).includes(c.id)).map((c) => c.label).join(' ')
  : q.type === 'drag_order' ? (q.items ?? []).map((i) => i.label).join(' ') : ''

export function stemPairs(topics, threshold = STEM_DUP_THRESHOLD) {
  const qs = []
  for (const t of topics) if (t.kind === 'lesson') for (const q of t.questions ?? []) if (q.type !== 'tradeoff') qs.push({ t: t.id, id: q.id, s: toks(`${q.prompt} ${answer(q)}`) })
  const out = []
  for (let i = 0; i < qs.length; i++) for (let j = i + 1; j < qs.length; j++) {
    const a = qs[i], b = qs[j]
    if (a.t === b.t || a.s.size < 4 || b.s.size < 4) continue
    let n = 0
    for (const x of a.s) if (b.s.has(x)) n++
    const v = n / Math.min(a.s.size, b.s.size)
    if (v >= threshold) out.push({ a: a.id, b: b.id, score: v })
  }
  return out
}

export const pairKey = (a, b) => [a, b].sort().join('|')

export function checkStems(topics, baselinePath) {
  const baseline = new Set(existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')).pairs : [])
  const errors = []
  for (const p of stemPairs(topics)) {
    if (!baseline.has(pairKey(p.a, p.b))) errors.push(`Near-duplicate question stems across topics: ${p.a} vs ${p.b} (overlap ${p.score.toFixed(2)}); reword one or test a different idea`)
  }
  return errors
}
