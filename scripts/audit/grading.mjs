// Grading-correctness rules from the independent review (round 6):
// every keyed answer must be reachable in the UI, estimation tolerances must reject the mistakes a question targets,
// drag orders list every valid order, explanations never refer to shuffled positions, and option wording
// gives no length or absolute-word tell in any section.
import fs from 'node:fs'
import { createRequire } from 'node:module'

export const FUND_SECTION = { 'f1-frontend': 'Frontend', 'f2-backend': 'Backend', 'f3-networking': 'Networking', 'f4-databases': 'Databases', 'f5-os': 'OS & Concurrency', 'f6-security': 'Security', 'f7-cloud': 'Cloud & DevOps' }
const sectionOf = (t) => FUND_SECTION[t.region] ?? 'System Design'

// Absolute qualifiers: a distractor full of these is easy to eliminate without knowing the topic
export const ABSOLUTE = /\b(always|never|entirely|completely|forever|guarantee[sd]?|impossible|at all|whole|automatically|instantly)\b|\bexactly\b(?![- ]once)|\bevery\b(?!\s+(few|\d|other|second|minute|hour|day|night|week|month|year|page view|deploy|release))/i
// Choices are shuffled per attempt, so an explanation must never point at a position
export const POSITIONAL = /\bthe\s+(first|second|third|fourth|fifth|last|top|bottom)\s+(option|answer|choice)s?\b|\b(the\s+)?(first|second|third|fourth)\s+(and|or)\s+(the\s+)?(first|second|third|fourth|last)\b|\b(option|answer|choice)\s+\(?[a-e]\)?(?=[\s,.;:]|$)|\b(the\s+)?(options?|answers?)\s+above\b/i

const allQuestions = (t) => [...(t.questions ?? []), ...(t.bossStages ?? []).flatMap((s) => s.questions ?? [])]

export function checkGrading(topics, { optionEdits = {}, diagramSpecs = '', glyphOk = null } = {}) {
  const errors = []
  const info = []
  const seen = new Set()
  const sec = {}
  for (const t of topics) {
    for (const q of allQuestions(t)) {
      if (seen.has(q.id)) continue
      seen.add(q.id)
      const bad = (m) => errors.push(`Topic ${t.id} ${q.id}: ${m}`)
      if (q.type === 'multiple_choice') {
        const ids = new Set(q.choices.map((c) => c.id))
        // The quiz UI is single-select (radio buttons): more than one keyed id can never be answered correctly
        if (q.correctChoiceIds.length !== 1) bad(`has ${q.correctChoiceIds.length} correct ids, but the quiz UI is single-select; key one and put any other valid answer in alternativeChoiceIds`)
        for (const id of [...q.correctChoiceIds, ...(q.alternativeChoiceIds ?? [])]) if (!ids.has(id)) bad(`keys unknown choice "${id}"`)
        if (q.correctChoiceIds.length === 1) {
          const s = (sec[sectionOf(t)] ??= { n: 0, longest: 0, right: 0, rightAbs: 0, wrong: 0, wrongAbs: 0 })
          const r = q.choices.find((c) => c.id === q.correctChoiceIds[0])
          const others = q.choices.filter((c) => c !== r && !(q.alternativeChoiceIds ?? []).includes(c.id))
          s.n++
          if (r.label.length > Math.max(...others.map((c) => c.label.length))) s.longest++
          s.right++; if (ABSOLUTE.test(r.label)) s.rightAbs++
          for (const c of others) { s.wrong++; if (ABSOLUTE.test(c.label)) s.wrongAbs++ }
        }
      }
      if (q.type === 'drag_order') {
        const ids = [...q.correctOrder].sort().join()
        const keys = new Set([q.correctOrder.join()])
        for (const alt of q.alternativeOrders ?? []) {
          if ([...alt].sort().join() !== ids) bad('an alternative order is not a permutation of the items')
          if (keys.has(alt.join())) bad('an alternative order repeats another accepted order')
          keys.add(alt.join())
        }
      }
      if (q.type === 'estimation') {
        const tol = q.tolerance
        if (tol !== undefined && !(tol >= 0 && tol <= 1)) bad(`tolerance ${tol} must be between 0 and 1`)
        // Fundamentals estimations must choose their tolerance on purpose (exact counts vs order of magnitude)
        if (FUND_SECTION[t.region] && tol === undefined) bad('needs an explicit tolerance (0 for exact counts, a tight value where a classic mistake is close, 0.5 for order of magnitude)')
        const effective = tol ?? 0.5
        for (const w of q.trapAnswers ?? []) {
          if (Math.abs(w - q.target) / q.target <= effective + 1e-9) bad(`trap answer ${w} is accepted (target ${q.target}, tolerance ±${effective * 100}%); tighten the tolerance`)
        }
      }
      for (const [where, text] of [['explanation', q.explanation], ...(q.choices ?? []).map((c) => ['choice', c.label])]) {
        if (text && POSITIONAL.test(text)) bad(`${where} refers to an option by position ("${text.match(POSITIONAL)[0]}"); choices are shuffled per attempt, so name the option instead`)
      }
    }
    // Try-it choices are shuffled per visit too
    const it = t.interactive
    if (it?.choices) for (const c of it.choices) for (const text of [c.feedback, it.reveal]) if (text && POSITIONAL.test(text)) errors.push(`Topic ${t.id} interactive: refers to a choice by position ("${text.match(POSITIONAL)[0]}")`)
  }
  // Per-section balance: no length tell and no absolute-word tell in any one section
  for (const [name, s] of Object.entries(sec)) {
    const longest = (100 * s.longest) / s.n
    const ra = (100 * s.rightAbs) / s.right, wa = (100 * s.wrongAbs) / s.wrong
    if (longest > 35) errors.push(`${name}: the correct option is uniquely longest in ${longest.toFixed(1)}% of single-answer MCQs (limit 35% per section)`)
    if (wa - ra > 4) errors.push(`${name}: ${wa.toFixed(1)}% of distractors use absolute words (always, never, every, entirely…) against ${ra.toFixed(1)}% of correct answers; the gap must be at most 4 points`)
    info.push(`Option tells, ${name}: correct uniquely longest ${longest.toFixed(1)}% of ${s.n}; absolute words in ${wa.toFixed(1)}% of distractors vs ${ra.toFixed(1)}% of answers`)
  }
  // Option-balance edits may not add absolutes or pure filler to a label (the review's "padded distractor" tell)
  const correctLabels = new Set()
  for (const t of topics) for (const q of allQuestions(t)) if (q.type === 'multiple_choice') for (const c of q.choices) if (q.correctChoiceIds.includes(c.id)) correctLabels.add(q.id + '\u0000' + c.label)
  const FILLER = /\b(at all|ever can|every single|as is possible|in full|total(ly)?|exact(ly)?|any method)\b|\((any|all) [^)]*\)/i
  for (const [qid, pairs] of Object.entries(optionEdits)) {
    for (const [from, to] of pairs) {
      if (correctLabels.has(qid + '\u0000' + to)) continue // rewording a correct answer is not distractor padding
      for (const re of [ABSOLUTE, FILLER]) {
        const added = (to.match(new RegExp(re.source, 'gi')) ?? []).length - (from.match(new RegExp(re.source, 'gi')) ?? []).length
        if (added > 0) { errors.push(`option-balance.json ${qid}: the edit "${to}" adds absolute or filler wording; write a plausible misconception instead`); break }
      }
    }
  }
  // Diagram text is outlined from the font, so a character without a glyph renders blank
  if (glyphOk) {
    for (const line of diagramSpecs.split('\n')) {
      if (line.startsWith('#') || line.startsWith('@')) continue
      for (const ch of line) if (ch.charCodeAt(0) > 127 && !glyphOk(ch)) errors.push(`Diagram spec: the diagram font has no glyph for "${ch}" in: ${line.trim()}`)
    }
  }
  return { errors, info }
}

export async function loadGlyphCheck(root) {
  const require = createRequire(import.meta.url)
  const opentype = (await import('opentype.js')).default
  const wawoff2 = require('wawoff2')
  const ttf = await wawoff2.decompress(fs.readFileSync(`${root}/scripts/diagrams/fonts/Virgil.woff2`))
  const font = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength))
  return (ch) => font.charToGlyphIndex(ch) !== 0
}
