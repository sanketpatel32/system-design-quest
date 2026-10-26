import { describe, expect, it } from 'vitest'
import { allTopics } from '../../content/catalog'
import { paragraphs } from './fun'

describe('card paragraphs', () => {
  it('never changes the text, only where it breaks', () => {
    for (const t of allTopics) for (const c of t.cards) {
      const p = paragraphs(c.body)
      expect(p.length).toBeLessThanOrEqual(2)
      expect(p.join(' ').replace(/\s+/g, ' ')).toBe(c.body.trim().replace(/\s+/g, ' '))
    }
  })
  it('short cards stay one paragraph and long ones split at a sentence', () => {
    expect(paragraphs('One. Two.')).toHaveLength(1)
    const long = Array.from({ length: 6 }, (_, i) => `Sentence ${i} has a handful of ordinary words in it, e.g. this.`).join(' ')
    const p = paragraphs(long)
    expect(p).toHaveLength(2)
    expect(p[0]).toMatch(/\.$/)
    expect(p[1]).toMatch(/^Sentence/)
  })
  it('splits about a fifth of cards or more', () => {
    const all = allTopics.flatMap((t) => t.cards)
    const split = all.filter((c) => paragraphs(c.body).length === 2).length
    console.log(`split ${split}/${all.length}`)
    expect(split).toBeGreaterThan(0)
  })
})
