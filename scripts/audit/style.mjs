// House style (docs/style-guide.md), checked on the assembled topics.
// Errors are rules that scripts/authoring/quality/style.py enforces, so they only fire on new content that
// bypassed rebuild.py; fix them by running `npm run content:build` (or by editing the source text).
// Warnings are heuristics (restating explanations, answer leaks, reading time, weak titles): they are listed,
// never fatal, because a human has to judge each one.

// Keys whose strings are learner-facing prose. Everything under BLOCK is code, an id or a published title.
const PROSE = new Set(`label steps title rows prompt explanation body assumptions takeaways columns front back objectives feedback
trap say useWhen avoidWhen why description constraints result formula workedAnswer reveal outOfScope rubric r3 r4
functionalRequirements nonFunctionalRequirements reliabilityChecks functional nonFunctional note exclusions
requirementDistractors deepDivePrompts deepDiveAnswers alternativeArchitectures takeaway setup estimationScenario
apiPrompt tradeoffPrompt referenceNotes workedEstimate tradeoffAnalysis pitch tradeoff noun text`.split(/\s+/))
const BLOCK = new Set(`id url slug region kind type sources api exampleApi diagram excalidraw svg requiredKinds requiredCapabilities
paths model gradingProfile acceptableAlternatives alternativeOrders source tags concept teaches correctChoiceIds
correctOrder correctNodeIds from to unit icon accent types params`.split(/\s+/))
// Same code detector as style.py: strings that quote code keep their straight quotes
const CODE = /\{"|":|="|\\"|\bW\/"|: "|If-(?:None-)?Match|ETag|\b(?:SELECT|WHERE|UPDATE|INSERT|DELETE|SET|LIKE|VALUES|FROM)\b|'\)|\('|' \+|\+ '|::|->>?|\$\d|\b[a-z_]+\s?=\s?'|'\s?=|<[!A-Za-z/]/

export const STYLE_RULES = [
  [/(?<![.\w])(?:de)?[Nn]ormaliz(?:e|ed|es|ing|ation)(?!\()/, 'US spelling: use normalise/normalisation'],
  [/(?<![.\w])[Vv]irtualiz(?:e|ed|es|ing|ation)/, 'US spelling: use virtualise/virtualisation'],
  [/\b[Mm]aterializ(?:e|ed|es|ing|ation)/, 'US spelling: use materialise/materialised'],
  [/\bauthoriz(?:e|ed|es|ing|ation)(?! (?:code|server|endpoint|request|grant|header)s?\b)/, 'US spelling: use authorise/authorisation (OAuth terms excepted)'],
  [/\b[Tt]oward\b/, 'use "towards"'],
  [/\b[Ll]eveled\b|\b[Tt]unneling\b|\b[Qq]ueuing\b/, 'US spelling: use levelled/tunnelling/queueing'],
  [/\bPostgres\b(?!QL)/, 'write PostgreSQL'],
  [/\b[Bb]ack-pressure\b|\b[Tt]radeoffs?\b|\b[Pp]re-signed\b|\bLSM trees?\b|\b[Ll]ife cycles?\b|\b[Uu]ser names?\b|\b[Cc]ool-downs?\b|\b[Dd]atacentres?\b/, 'term spelling: backpressure, trade-off, presigned, LSM-tree, lifecycle, username, cooldown, data centre'],
  [/(?<!Wi-Fi )\b[Hh]otspots?\b/, 'write "hot spot"'],
  [/(?<![\w./:-])(?:websocket|cdn)s?\b(?![\w./-])/, 'capitalise WebSocket / CDN'],
  [/\btatkal\b/, 'capitalise Tatkal'],
  [/\.\.\./, 'use the ellipsis character …'],
  [/ — /, 'no spaced em dash: use a colon, comma or full stop'],
  [/(?<=\S) {2,}(?=\S)/, 'double space'],
]

function* proseStrings(v, path = [], prose = false) {
  if (typeof v === 'string') { if (prose) yield [v, path]; return }
  if (Array.isArray(v)) { for (const [i, x] of v.entries()) yield* proseStrings(x, [...path, i], prose); return }
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!BLOCK.has(k)) yield* proseStrings(x, [...path, k], PROSE.has(k))
}

const STOP = new Set('a an the of to in on for and or is are be by with what which how why when does do it its this that from at as can so not no only one each per into than then their them they you your we our'.split(' '))
const words = (s) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w))
const wordCount = (v) => { let n = 0; for (const [s] of proseStrings(v)) n += s.split(/\s+/).length; return n }

export const READING_WORDS = [600, 1800]

export function checkStyle(topics) {
  const errors = [], warnings = []
  for (const t of topics) {
    const where = `Topic ${t.id}`
    for (const [s, path] of proseStrings(t)) {
      const at = `${where} ${path.join('.')}`
      for (const [re, msg] of STYLE_RULES) if (re.test(s)) errors.push(`${at}: ${msg}: ${JSON.stringify(s.slice(0, 90))}`)
      if (!CODE.test(s) && /[A-Za-z]'[A-Za-z]|(?<![\w'])'[^'\n]+'(?![\w'])|(?<![\w"])"[^"\n]+"(?![\w"])/.test(s)) errors.push(`${at}: straight quote or apostrophe in prose (use ’ “ ”): ${JSON.stringify(s.slice(0, 90))}`)
    }
    // card titles: unique within a lesson, and more than a single vague word
    const seen = new Map()
    for (const c of t.cards ?? []) {
      const k = (c.title ?? '').trim().toLowerCase()
      if (seen.has(k)) errors.push(`${where}: card title "${c.title}" used by ${seen.get(k)} and ${c.id}`)
      seen.set(k, c.id)
      if (k && !/\s/.test(k)) warnings.push(`${where} ${c.id}: one-word card title "${c.title}"`)
    }
    for (const q of t.questions ?? []) {
      const labels = (q.choices ?? []).map((c) => c.label ?? '')
      for (const l of labels) if (/\b(?:all|none|both|neither) of the (?:above|options)\b/i.test(l)) errors.push(`${where} ${q.id}: "${l}" option; write a concrete answer`)
      if (q.type !== 'multiple_choice' || !q.correctChoiceIds?.length) continue
      const right = q.choices.filter((c) => q.correctChoiceIds.includes(c.id)).map((c) => c.label).join(' ')
      const wrong = new Set(q.choices.filter((c) => !q.correctChoiceIds.includes(c.id)).flatMap((c) => words(c.label)))
      const rw = words(right), ex = words(q.explanation ?? '')
      // explanation that only restates the answer: short, and almost every word comes from the correct option
      if (ex.length && ex.length <= rw.length + 3 && ex.filter((w) => rw.includes(w)).length >= 0.7 * ex.length) warnings.push(`${where} ${q.id}: explanation restates the answer: ${JSON.stringify(q.explanation)}`)
      // stem leak: two or more distinctive answer words appear in the prompt and in no distractor
      const pw = new Set(words(q.prompt ?? ''))
      const leak = [...new Set(rw)].filter((w) => w.length > 4 && pw.has(w) && !wrong.has(w))
      if (leak.length >= 2) warnings.push(`${where} ${q.id}: prompt shares ${leak.join(', ')} with the answer only`)
    }
    for (const s of t.deep?.seeAlso ?? t.seeAlso ?? []) if (s.topicId === t.id) errors.push(`${where}: see-also points at itself`)
    if (t.kind === 'lesson') {
      const n = wordCount({ cards: t.cards, deep: t.deep })
      if (n < READING_WORDS[0] || n > READING_WORDS[1]) warnings.push(`${where}: ${n} words of reading, outside ${READING_WORDS.join('–')}`)
    }
  }
  return { errors, warnings }
}
