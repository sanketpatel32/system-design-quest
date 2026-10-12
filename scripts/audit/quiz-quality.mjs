// Quiz quality checks shared by audit-content.mjs and the unit tests.
// See DESIGN.md "Question checklist" for the human version of these rules.

/** Distractors that no learner would pick: jokes, non-answers and irrelevant tech. */
export const SILLY = [
  /\bwrite (some )?code\b/i, /\bdo nothing\b/i, /\bignore (it|the problem|errors)\b/i, /\bnone of the above\b/i, /\ball of the above\b/i,
  /\bdelete (the|all|every)\b.*\b(data|database|logs?)\b/i, /\buse (excel|a spreadsheet)\b/i, /\b(pray|hope it works|reboot the internet)\b/i,
  /\bIDE theme\b/i, /\blogo colou?r\b/i, /\bstandup meetings?\b/i, /\boffice tooling\b/i, /^\s*(SMTP|FTP|Telnet)\s*$/i,
  /\bblockchain\b/i, /\bmainframe\b/i, /\bfax\b/i, /\bprinter\b/i,
]

const words = (s) => s.trim().split(/\s+/).length

export function checkQuiz(topics) {
  const errors = []
  const notes = []
  const byId = new Map(topics.map((t) => [t.id, t]))
  // Answers that belong to other topics' flashcards: the old "recall" filler used them as distractors
  const foreignBacks = new Map()
  for (const t of topics) for (const f of t.flashcards ?? []) foreignBacks.set(f.back.trim(), t.id)

  for (const t of topics) {
    const qs = t.questions
    if (qs.length < 5 || qs.length > 8) errors.push(`Topic ${t.id}: ${qs.length} questions (need 5–8)`)
    const types = new Set(qs.map((q) => q.type))
    if (types.size < 2) errors.push(`Topic ${t.id}: only one question type`)
    else if (types.size < 3) notes.push(`Topic ${t.id}: ${types.size} question types`)

    const taught = new Set([...t.cards.flatMap((c) => c.teaches ?? []), ...(t.deep?.teaches ?? [])])
    for (const p of t.prereqIds ?? []) {
      for (const c of byId.get(p)?.cards ?? []) for (const k of c.teaches ?? []) taught.add(k)
      for (const k of byId.get(p)?.deep?.teaches ?? []) taught.add(k)
    }
    for (const q of qs) {
      if (!q.concept) errors.push(`Topic ${t.id} ${q.id}: no concept tag`)
      else if (!taught.has(q.concept)) errors.push(`Topic ${t.id} ${q.id}: concept "${q.concept}" is not taught by any card in the topic or its prerequisites`)

      if (q.type !== 'multiple_choice') continue
      const right = q.choices.filter((c) => q.correctChoiceIds.includes(c.id))
      const wrong = q.choices.filter((c) => !q.correctChoiceIds.includes(c.id))
      if (q.choices.length < 3) errors.push(`Topic ${t.id} ${q.id}: fewer than 3 choices`)
      for (const c of wrong) {
        if (SILLY.some((re) => re.test(c.label))) errors.push(`Topic ${t.id} ${q.id}: silly distractor "${c.label}"`)
        if (right.some((r) => r.label.trim().toLowerCase() === c.label.trim().toLowerCase())) errors.push(`Topic ${t.id} ${q.id}: distractor repeats the answer`)
        const owner = foreignBacks.get(c.label.trim())
        if (owner && owner !== t.id) errors.push(`Topic ${t.id} ${q.id}: distractor is an answer from topic ${owner}`)
      }
      // Giveaway: the right answer is far longer than every distractor
      const longestWrong = Math.max(...wrong.map((c) => words(c.label)))
      if (right.length === 1 && words(right[0].label) > 2.5 * longestWrong && words(right[0].label) > 8) {
        notes.push(`Topic ${t.id} ${q.id}: answer is much longer than the distractors`)
      }
    }
  }
  return { errors, notes }
}
