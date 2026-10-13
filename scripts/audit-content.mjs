#!/usr/bin/env node
import { checkQuiz } from './audit/quiz-quality.mjs'
import { checkR3 } from './audit/r3.mjs'
import { checkFundamentals } from './audit/fund.mjs'
import { checkGrading, loadGlyphCheck } from './audit/grading.mjs'
import { checkDepth, checkBossDepth, DEEP_REGIONS } from './audit/depth.mjs'
import { readFileSync, existsSync } from 'node:fs'
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

// System Design keeps IDs 1–120; the Fundamentals track adds topics with IDs 200+
const coreCount = ids.filter((i) => i <= 120).length
if (coreCount !== 120) errors.push(`Expected 120 System Design topics, got ${coreCount}`)
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
errors.push(...checkDepth(topics))
errors.push(...checkBossDepth(topics))
console.log(`Depth rules enforced for: ${DEEP_REGIONS.join(', ') || 'none yet'}`)
console.log("Boss study briefs enforced for all boss topics")
// Hand-drawn diagrams: every listed diagram has its SVG + .excalidraw, alt text, a real topic, and every boss has one
{
  const diagrams = JSON.parse(readFileSync(join(root, 'src/content/generated/diagrams.json'), 'utf8'))
  const ids = new Set(topics.map((t) => String(t.id)))
  for (const [id, d] of Object.entries(diagrams)) {
    if (!ids.has(id)) errors.push(`Diagram ${id}: no such topic`)
    if (!d.alt || d.alt.length < 40) errors.push(`Diagram ${id}: alt text missing or too short`)
    for (const ext of ['svg', 'excalidraw']) {
      if (!existsSync(join(root, `public/diagrams/${id}.${ext}`))) errors.push(`Diagram ${id}: public/diagrams/${id}.${ext} missing`)
    }
  }
  for (const t of topics) if (t.bossDeep && !diagrams[String(t.id)]) errors.push(`Boss ${t.id}: no reference-architecture diagram`)
  console.log(`Diagrams: ${Object.keys(diagrams).length} (${topics.filter((t) => t.bossDeep && diagrams[String(t.id)]).length} bosses)`)
}
// Interview reference answers must be scenario-specific: no template APIs, exclusions or trade-offs
{
  const bossTopics = topics.filter((t) => t.kind === 'boss')
  const seenApi = new Set(), seenTr = new Set()
  for (const t of bossTopics) {
    const b = t.boss
    if (/\/v1\/items|\/v1\/auth\/token/.test(b.exampleApi)) errors.push(`Boss ${t.id}: template API in exampleApi`)
    if (b.exclusions.some((x) => /mainframe|custom hardware/i.test(x))) errors.push(`Boss ${t.id}: template out-of-scope text`)
    if (/Prefer OLTP SQL when invariants matter/.test(b.tradeoffAnalysis)) errors.push(`Boss ${t.id}: template trade-off text`)
    if (seenApi.has(b.exampleApi)) errors.push(`Boss ${t.id}: exampleApi duplicates another boss`)
    if (seenTr.has(b.tradeoffAnalysis)) errors.push(`Boss ${t.id}: tradeoffAnalysis duplicates another boss`)
    seenApi.add(b.exampleApi); seenTr.add(b.tradeoffAnalysis)
  }
  const raw = JSON.stringify(bossTopics)
  if (/mainframe|Building custom hardware/i.test(raw)) errors.push('Boss content still contains template out-of-scope text (mainframe/custom hardware)')
}
// While the quiz rewrite lands region by region, failures are reported but only enforced for authored topics
errors.push(...quiz.errors)
if (quiz.notes.length) console.log(`AUDIT NOTE: ${quiz.notes.length} quiz notes (two question types, or a long giveaway answer)${process.env.AUDIT_NOTES ? '' : '; set AUDIT_NOTES=1 to list'}`)
if (process.env.AUDIT_NOTES) quiz.notes.forEach((n) => console.log(' ·', n))

if (warnings.length && !strict) {
  console.warn(`AUDIT WARN: ${warnings.length} near-duplicate text pairs (run AUDIT_STRICT=1 npm run audit to fail)`)
  warnings.slice(0, 8).forEach((w) => console.warn(' -', w))
  if (warnings.length > 8) console.warn(` - … and ${warnings.length - 8} more`)
}

// Templated boss questions must not return (review C1/M2)
{
  const seen = new Map()
  for (const t of topics.filter((x) => x.kind === 'boss')) {
    for (const q of t.questions) {
      const txt = JSON.stringify(q)
      if (/A mobile client times out on|Which mechanism does .* need for reliability|while side effects \(notifications, analytics, indexing\)/.test(txt)) errors.push(`Boss ${t.id}: templated ${q.id}`)
      const k = q.id.split('-')[1]
      const sig = k + ':' + (q.diagramNodes ? q.diagramNodes.map((n) => n.label).join('|') : (q.choices ?? []).map((c) => c.label).sort().join('|'))
      if (['api1', 'dd1', 'dd2', 'to1'].includes(k)) { if (seen.has(sig)) errors.push(`Boss ${t.id}: ${k} duplicates boss ${seen.get(sig)}`); seen.set(sig, t.id) }
    }
  }
}
// Option-length balance (review M6): the correct option must not stand out by length
{
  const seen = new Set(); let n = 0, longest = 0
  for (const t of topics) for (const q of [...t.questions, ...(t.bossStages ?? []).flatMap((s) => s.questions)]) {
    if (q.type !== 'multiple_choice' || q.correctChoiceIds.length !== 1 || seen.has(q.id)) continue
    seen.add(q.id); n++
    const right = q.choices.find((c) => c.id === q.correctChoiceIds[0]).label.length
    const other = Math.max(...q.choices.filter((c) => c.id !== q.correctChoiceIds[0]).map((c) => c.label.length))
    if (right > other) longest++
    if (right > 1.5 * other && right - other > 15) errors.push(`Topic ${t.id} ${q.id}: correct option is far longer than every distractor (${right} vs ${other} chars)`)
  }
  const share = (longest / n) * 100
  if (share > 35) errors.push(`Option balance: the correct option is uniquely longest in ${share.toFixed(1)}% of single-answer MCQs (limit 35%); rewrite distractors or answers, or add an entry to scripts/option-balance.json`)
  console.log(`Option balance: correct option uniquely longest in ${share.toFixed(1)}% (${longest}) of ${n} single-answer MCQs (limit 35%); none grossly longer (choices are shuffled per attempt)`)
}
// Dead or off-topic sources must not return (review M5)
for (const t of topics) for (const s of t.sources ?? []) if (/designing-distributed-systems|datastax\.com\/blog/.test(s.url)) errors.push(`Topic ${t.id}: dead source ${s.url}`)
// Re-review rules (one framework, specific headings, no intro repeats, numeric 'Why', hedged claims, interactives)
{
  const r3 = checkR3(topics, root)
  errors.push(...r3.errors)
  r3.info.forEach((m) => console.log(m))
}
{
  const f = checkFundamentals(topics)
  errors.push(...f.errors)
  f.info.forEach((m) => console.log(m))
}
{
  const g = checkGrading(topics, {
    optionEdits: JSON.parse(readFileSync(join(root, 'scripts/option-balance.json'), 'utf8')),
    diagramSpecs: readFileSync(join(root, 'scripts/diagrams/specs.txt'), 'utf8'),
    glyphOk: await loadGlyphCheck(root),
  })
  errors.push(...g.errors)
  g.info.forEach((m) => console.log(m))
}
// All checks above push into `errors`; fail only after every check has run
if (errors.length) {
  console.error('AUDIT FAILED')
  errors.forEach((e) => console.error(' -', e))
  process.exit(1)
}
console.log(`AUDIT OK: ${topics.length} topics (120 System Design + ${topics.length - coreCount} Fundamentals), 40 bosses, counts and keys valid`)
