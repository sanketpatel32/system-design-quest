#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const topics = JSON.parse(
  readFileSync(join(root, 'src/content/generated/topics.json'), 'utf8'),
)

const errors = []
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

for (const t of topics) {
  if (t.cards.length < 4 || t.cards.length > 6) {
    errors.push(`Topic ${t.id}: card count ${t.cards.length}`)
  }
  if (t.questions.length < 5 || t.questions.length > 8) {
    errors.push(`Topic ${t.id}: question count ${t.questions.length}`)
  }
  if (t.flashcards.length < 2) errors.push(`Topic ${t.id}: flashcards < 2`)
  const blob = JSON.stringify(t)
  if (placeholder.test(blob)) errors.push(`Topic ${t.id}: placeholder text`)
  const types = new Set(t.questions.map((q) => q.type))
  if (types.size < 3) errors.push(`Topic ${t.id}: < 3 question types`)
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
}

if (errors.length) {
  console.error('AUDIT FAILED')
  errors.forEach((e) => console.error(' -', e))
  process.exit(1)
}
console.log('AUDIT OK: 120 topics, 40 bosses, counts and keys valid')
