import { describe, expect, it } from 'vitest'
import topics from '../../content/generated/topics.json'
import type { Topic } from '../../content/types'
import { MODELS } from './models'

const all = topics as unknown as Topic[]

describe('lesson interactives', () => {
  it('every lesson and the playbook has one', () => {
    const missing = all.filter((t) => t.kind !== 'boss' && !t.interactive).map((t) => t.id)
    expect(missing).toEqual([])
  })
  for (const t of all) {
    const it_ = t.interactive
    if (!it_ || it_.kind !== 'slider') continue
    it(`topic ${t.id}: slider outputs are finite and its goal is reachable`, () => {
      const { min, max, step } = it_.control
      let okSeen = false
      let verdicts = 0
      for (let x = min; x <= max + 1e-9; x += step) {
        const out = MODELS[it_.model].run(Number(x.toFixed(6)), it_.params)
        for (const r of out.rows) expect(r.value, `${t.id} at ${x}`).not.toMatch(/NaN|Infinity|undefined/)
        if (out.verdict) {
          verdicts++
          if (out.verdict.ok) okSeen = true
        }
      }
      if (verdicts) expect(okSeen, `topic ${t.id}: no slider position meets the goal`).toBe(true)
    })
  }
})
