// Lesson depth rules (see DESIGN.md "Lesson depth"). Regions listed in DEEP_REGIONS must meet them.
export const DEEP_REGIONS = ['r1-foundations', 'r2-networking', 'r3-load-balancing', 'r4-caching', 'r5-databases', 'r6-messaging', 'r7-coordination', 'r8-microservices', 'r9-security-storage', 'r10-strategy']
export const MIN_DEEP_WORDS = 550
export const MIN_LESSON_WORDS = 650

const wc = (s) => (s ? String(s).trim().split(/\s+/).filter(Boolean).length : 0)

export function deepWords(d) {
  if (!d) return 0
  return (
    wc(d.mechanism?.title) + d.mechanism.steps.reduce((n, s) => n + wc(s), 0) +
    [...d.useWhen, ...d.avoidWhen].reduce((n, s) => n + wc(s), 0) +
    d.tradeoffs.columns.reduce((n, s) => n + wc(s), 0) + d.tradeoffs.rows.flat().reduce((n, s) => n + wc(s), 0) +
    wc(d.numbers.title) + [...d.numbers.assumptions, ...d.numbers.steps, d.numbers.result].reduce((n, s) => n + wc(s), 0) +
    wc(d.india.title) + wc(d.india.body) +
    d.pitfalls.reduce((n, p) => n + wc(p.trap) + wc(p.say), 0) +
    d.takeaways.reduce((n, s) => n + wc(s), 0)
  )
}

export function cardWords(t) {
  return t.cards.reduce((n, c) => n + wc(c.title) + wc(c.body) + (c.steps ?? []).reduce((m, s) => m + wc(s), 0), 0)
}

export function checkDepth(topics) {
  const errors = []
  for (const t of topics) {
    if (!DEEP_REGIONS.includes(t.region) || t.kind !== 'lesson') continue
    const d = t.deep
    if (!d) { errors.push(`Topic ${t.id}: missing deep lesson`); continue }
    const need = (ok, what) => { if (!ok) errors.push(`Topic ${t.id}: deep lesson ${what}`) }
    need(d.teaches?.length >= 1, 'teaches nothing')
    need(d.mechanism?.steps?.length >= 4, 'mechanism needs 4+ steps')
    need(d.useWhen?.length >= 2 && d.avoidWhen?.length >= 2, 'needs 2+ use-when and 2+ avoid-when')
    need(d.tradeoffs?.rows?.length >= 2 && d.tradeoffs.rows.every((r) => r.length === d.tradeoffs.columns.length), 'trade-off table needs 2+ rows matching its columns')
    need(d.numbers?.assumptions?.length >= 1 && d.numbers?.steps?.length >= 3 && d.numbers?.result, 'worked numbers need assumptions, 3+ steps and a result')
    need(wc(d.india?.body) >= 50 && /publicly reported|illustrative|official|public/i.test(d.india?.label ?? ''), 'India example needs 50+ words and an honest label')
    need(d.pitfalls?.length >= 2, 'needs 2+ pitfalls')
    need(d.takeaways?.length >= 3 && d.takeaways.length <= 5, 'needs 3–5 takeaways')
    const dw = deepWords(d)
    need(dw >= MIN_DEEP_WORDS, `has ${dw} words (min ${MIN_DEEP_WORDS})`)
    const total = dw + cardWords(t)
    need(total >= MIN_LESSON_WORDS, `lesson totals ${total} words (min ${MIN_LESSON_WORDS})`)
  }
  return errors
}

export const MIN_BOSS_BRIEF_WORDS = 300

export function bossDeepWords(b) {
  if (!b) return 0
  const r = b.requirements
  return (
    wc(b.pitch) + [...r.functional, ...r.nonFunctional, ...r.outOfScope].reduce((n, s) => n + wc(s), 0) +
    [...b.capacity.assumptions, ...b.capacity.steps, b.capacity.result].reduce((n, s) => n + wc(s), 0) +
    b.architecture.steps.reduce((n, s) => n + wc(s), 0) +
    b.deepDives.reduce((n, d) => n + wc(d.title) + wc(d.body), 0) +
    b.rubric.reduce((n, s) => n + wc(s), 0)
  )
}

/** Every boss needs a full study brief, and its brief card must describe the boss it is attached to. */
export function checkBossDepth(topics) {
  const errors = []
  for (const t of topics) {
    if (t.kind !== 'boss') continue
    const b = t.bossDeep
    if (!b) { errors.push(`Boss ${t.id}: missing study brief`); continue }
    const need = (ok, what) => { if (!ok) errors.push(`Boss ${t.id}: brief ${what}`) }
    need(b.requirements?.functional?.length >= 2 && b.requirements?.nonFunctional?.length >= 2, 'needs 2+ functional and 2+ non-functional requirements')
    need(b.capacity?.steps?.length >= 4 && b.capacity?.result, 'capacity maths needs 4+ steps and a result')
    need(b.architecture?.steps?.length >= 4 && b.architecture?.diagram, 'reference architecture needs 4+ steps and a diagram')
    need(b.deepDives?.length >= 2, 'needs 2+ deep dives')
    need(b.rubric?.length >= 3, 'needs a rubric hint with 3+ points')
    const w = bossDeepWords(b)
    need(w >= MIN_BOSS_BRIEF_WORDS, `has ${w} words (min ${MIN_BOSS_BRIEF_WORDS})`)
    const brief = t.cards.find((c) => c.id.endsWith('-c1'))?.body ?? ''
    const f0 = (t.boss?.functionalRequirements?.[0] ?? '').toLowerCase()
    need(brief.toLowerCase().includes(f0) && brief.includes(t.title), 'card c1 must name this boss and its first functional requirement')
  }
  return errors
}
