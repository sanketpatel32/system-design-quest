#!/usr/bin/env node
import { checkQuiz } from './audit/quiz-quality.mjs'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const topics = JSON.parse(
  readFileSync(join(root, 'src/content/generated/topics.json'), 'utf8'),
)

const errors = []
const warnings = []
const strict = process.env.AUDIT_STRICT === '1'
const ids = topics.map((t) => t.id)
const idSet = new Set(ids)

if (ids.length !== 120) errors.push(`Expected 120 topics, got ${ids.length}`)
for (let i = 1; i <= 120; i++) {
  if (!idSet.has(i)) errors.push(`Missing topic id ${i}`)
}
if (idSet.size !== ids.length) errors.push('Duplicate topic ids')

const bosses = topics.filter((t) => t.kind === 'boss')
if (bosses.length !== 40) errors.push(`Expected 40 bosses, got ${bosses.length}`)
const bossIds = bosses.map((b) => b.id).sort((a, b) => a - b)
for (let i = 75; i <= 114; i++) {
  if (!bossIds.includes(i)) errors.push(`Missing boss id ${i}`)
}

const placeholder = /coming soon|lorem|placeholder|todo content/i
const fingerprintTok = /\btok[a-f0-9]{6,}\b/i
const markerRef = /\bmarker sdqref\d+\b/i

/** Strip audit gaming tokens and shared boilerplate before near-dup comparison (see DESIGN.md). */
function auditComparableText(s) {
  return s
    .replace(fingerprintTok, ' ')
    .replace(markerRef, ' ')
    .replace(/\bsdqref\d+\b/gi, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeText(s) {
  return auditComparableText(s)
}

function tokenSet(s) {
  return new Set(
    normalizeText(s)
      .split(' ')
      .filter((w) => w.length > 3 || /^\d+$/.test(w)),
  )
}

function jaccard(a, b) {
  const A = tokenSet(a)
  const B = tokenSet(b)
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  for (const x of A) if (B.has(x)) inter += 1
  return inter / (A.size + B.size - inter)
}

const cardBodies = []
const prompts = []
// Card near-dup Jaccard threshold (strict + default). See DESIGN.md.
const NEAR_DUP_THRESHOLD = 0.87

for (const t of topics) {
  if (t.cards.length < 4 || t.cards.length > 6) {
    errors.push(`Topic ${t.id}: card count ${t.cards.length}`)
  }
  if (t.flashcards.length < 2) errors.push(`Topic ${t.id}: flashcards < 2`)
  const blob = JSON.stringify(t)
  if (placeholder.test(blob)) errors.push(`Topic ${t.id}: placeholder text`)
  if (fingerprintTok.test(blob)) errors.push(`Topic ${t.id}: fingerprint tok* tokens in content`)
  // Regressions of the old template filler
  for (const q of [...t.questions, ...(t.bossStages ?? []).flatMap((s) => s.questions)]) {
    if (/«[^»]*»/.test(q.prompt)) errors.push(`Topic ${t.id}: template prompt using the title as a system name`)
    for (const c of q.choices ?? []) {
      if (/IDE theme|Logo colou?r|standup meetings|office tooling/i.test(c.label)) errors.push(`Topic ${t.id}: joke distractor "${c.label}"`)
    }
  }
  if (t.objectives.some((o) => /with measurable requirements and failure modes/.test(o))) errors.push(`Topic ${t.id}: generic objective`)
  if (t.cards.some((c) => ['text', 'diagram', 'animation'].includes(c.title))) errors.push(`Topic ${t.id}: card title is a card kind`)
  for (const q of t.questions) {
    if (q.type === 'estimation' && !(q.target > 0)) {
      errors.push(`Topic ${t.id} estimation target invalid`)
    }
  }
  if (t.kind === 'boss') {
    if (!t.boss?.rubric) errors.push(`Boss ${t.id}: missing rubric`)
    if (!t.boss?.referenceNodes?.length) errors.push(`Boss ${t.id}: missing reference graph`)
    if (!t.bossStages?.length) errors.push(`Boss ${t.id}: missing stages`)
  }
  for (const c of t.cards) {
    const body = c.body ?? ''
    if (cardBodies.some((x) => x.text === body)) {
      errors.push(`Topic ${t.id}: exact duplicate card body`)
    }
    for (const prev of cardBodies) {
      if (prev.id === t.id) continue
      const j = jaccard(body, prev.text)
      if (j >= NEAR_DUP_THRESHOLD) {
        const msg = `Topic ${t.id} card near-duplicate of topic ${prev.id} (j=${j.toFixed(2)})`
        if (strict) errors.push(msg)
        else warnings.push(msg)
      }
    }
    cardBodies.push({ id: t.id, text: body, title: t.title ?? '' })
  }
  for (const q of t.questions) {
    const p = q.prompt ?? ''
    if (prompts.some((x) => x.text === p)) {
      errors.push(`Topic ${t.id}: exact duplicate question prompt`)
    }
    for (const prev of prompts) {
      if (prev.id === t.id) continue
      // Prompts may share assessment templates; strict mode checks exact dupes only (see DESIGN.md).
      if (!strict) {
        const j = jaccard(p, prev.text)
        if (j >= NEAR_DUP_THRESHOLD) {
          warnings.push(`Topic ${t.id} prompt near-duplicate of topic ${prev.id} (j=${j.toFixed(2)})`)
        }
      }
    }
    prompts.push({ id: t.id, text: p })
    if (q.type === 'tradeoff') {
      if (q.rationaleKeywords) errors.push(`Topic ${t.id}: tradeoff uses legacy rationaleKeywords`)
      if (!q.rationaleOptions?.length) errors.push(`Topic ${t.id}: tradeoff missing rationaleOptions`)
      if (!q.correctRationaleIds?.length) errors.push(`Topic ${t.id}: tradeoff missing correctRationaleIds`)
    }
  }
}

// 5–8 authored questions per topic, concept-aligned with the cards, no silly distractors
const quiz = checkQuiz(topics)
// While the quiz rewrite lands region by region, failures are reported but only enforced for authored topics
errors.push(...quiz.errors)
if (quiz.notes.length) console.log(`AUDIT NOTE: ${quiz.notes.length} quiz notes (two question types, or a long giveaway answer)${process.env.AUDIT_NOTES ? '' : '; set AUDIT_NOTES=1 to list'}`)
if (process.env.AUDIT_NOTES) quiz.notes.forEach((n) => console.log(' ·', n))

if (warnings.length && !strict) {
  console.warn(`AUDIT WARN: ${warnings.length} near-duplicate text pairs (run AUDIT_STRICT=1 npm run audit to fail)`)
  warnings.slice(0, 8).forEach((w) => console.warn(' -', w))
  if (warnings.length > 8) console.warn(` - … and ${warnings.length - 8} more`)
}

if (errors.length) {
  console.error('AUDIT FAILED')
  errors.forEach((e) => console.error(' -', e))
  process.exit(1)
}
console.log('AUDIT OK: 120 topics, 40 bosses, counts and keys valid')
