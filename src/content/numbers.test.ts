import { describe, expect, it } from 'vitest'
import { allTopics } from './catalog'

/**
 * Recomputes the arithmetic written in lesson text, explanations and worked answers.
 * Fails when a sentence claims e.g. "2,800,000 / 86,400 ≈ 28" (it is ≈ 32.4).
 */
const NUM = String.raw`(\d[\d,]*(?:\.\d+)?)\s*([KMB]|k|million|billion|lakh|crore)?`
const SCALE: Record<string, number> = { K: 1e3, k: 1e3, M: 1e6, million: 1e6, B: 1e9, billion: 1e9, lakh: 1e5, crore: 1e7 }
const num = (n: string, u?: string) => Number(n.replace(/,/g, '')) * (u ? SCALE[u] ?? 1 : 1)

function texts(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = []
  for (const t of allTopics) {
    const push = (where: string, text?: string) => text && out.push({ where: `topic ${t.id} ${where}`, text })
    t.cards.forEach((c) => push(`card ${c.id}`, c.body))
    t.flashcards.forEach((f) => push(`flashcard ${f.id}`, f.back))
    const qs = [...t.questions, ...(t.bossStages ?? []).flatMap((s) => s.questions)]
    for (const q of qs) {
      push(`question ${q.id}`, q.explanation)
      if (q.type === 'estimation') {
        push(`question ${q.id} worked`, q.workedAnswer)
        q.assumptions.forEach((a) => push(`question ${q.id} assumption`, a))
      }
    }
    if (t.boss) push('boss estimate', t.boss.workedEstimate)
    if (t.deep) {
      const d = t.deep
      ;[...d.mechanism.steps, ...d.numbers.assumptions, ...d.numbers.steps, d.numbers.result, d.india.body, ...d.pitfalls.flatMap((p) => [p.trap, p.say]), ...d.takeaways, ...d.tradeoffs.rows.flat()].forEach((x, i) => push(`deep ${i}`, x))
    }
  }
  return out
}

export function arithmeticErrors(text: string): string[] {
  const errors: string[] = []
  const div = new RegExp(`(?<![÷/]\\s*)${NUM}(?:\\s+[a-z]+)?(?:/day)?(?:\\s*÷\\s*(\\d+))?\\s*[÷/]\\s*(86,?400|10\\^5|10⁵)\\s*(?:s)?\\s*≈\\s*${NUM}`, 'g')
  for (const m of text.matchAll(div)) {
    const a = num(m[1]!, m[2]) / (m[3] ? Number(m[3]) : 1)
    const d = /86/.test(m[4]!) ? 86400 : 1e5
    const claimed = num(m[5]!, m[6])
    const actual = a / d
    if (Math.abs(actual - claimed) / actual > 0.1) errors.push(`"${m[0]}" but ${a}/${d} = ${actual.toFixed(2)}`)
  }
  const mul = new RegExp(`${NUM}\\s*×\\s*${NUM}\\s*=\\s*${NUM}`, 'g')
  for (const m of text.matchAll(mul)) {
    const product = num(m[1]!, m[2]) * num(m[3]!, m[4])
    const claimed = num(m[5]!, m[6])
    if (Math.abs(product - claimed) / product > 0.1) errors.push(`"${m[0]}" but the product is ${product}`)
  }
  return errors
}

describe('content arithmetic', () => {
  it('catches a wrong division claim', () => {
    expect(arithmeticErrors('2,800,000 / 86,400 ≈ 28 QPS')).toHaveLength(1)
    expect(arithmeticErrors('2,800,000 / 86,400 ≈ 32 QPS')).toHaveLength(0)
    expect(arithmeticErrors('70M ÷ 7 ÷ 86,400 ≈ 116/s')).toHaveLength(0)
    expect(arithmeticErrors('2.8M reads/day ÷ 86,400 ≈ 28')).toHaveLength(1)
    expect(arithmeticErrors('50M × 40 = 2B/day')).toHaveLength(0)
    expect(arithmeticErrors('40M × 6 = 300M')).toHaveLength(1)
  })

  it('every worked answer and explanation agrees with its own numbers', () => {
    const problems = texts().flatMap(({ where, text }) => arithmeticErrors(text).map((e) => `${where}: ${e}`))
    expect(problems).toEqual([])
  })

  it('boss estimation targets match their scenario', () => {
    for (const t of allTopics.filter((x) => x.kind === 'boss')) {
      const s = (t.boss as unknown as { scenario: { dau?: number; actions?: number; daily?: number; peak: number } }).scenario
      const daily = s.daily ?? s.dau! * s.actions!
      const peak = (daily / 86400) * s.peak
      const q = t.bossStages!.flatMap((st) => st.questions).find((x) => x.type === 'estimation')
      expect(q && q.type === 'estimation' ? Math.abs(q.target - peak) / peak : 1).toBeLessThan(0.06)
    }
  })
})
