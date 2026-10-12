#!/usr/bin/env node
/**
 * Assemble scripts/authored/*.json into src/content/generated/topics.json
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const authoredDir = join(root, 'scripts/authored')
const out = join(root, 'src/content/generated/topics.json')

const files = readdirSync(authoredDir)
  .filter((f) => f.endsWith('.json'))
  .sort()

const topics = []
for (const f of files) {
  const chunk = JSON.parse(readFileSync(join(authoredDir, f), 'utf8'))
  if (!Array.isArray(chunk)) throw new Error(`${f} must be a JSON array`)
  topics.push(...chunk)
}

// Merge deep lessons (scripts/authored/deep/*.json: { "<topicId>": { ...DeepLesson, extraQuestions?: Question[] } })
const deepDir = join(authoredDir, 'deep')
let deepCount = 0
try {
  for (const f of readdirSync(deepDir).filter((x) => x.endsWith('.json')).sort()) {
    const chunk = JSON.parse(readFileSync(join(deepDir, f), 'utf8'))
    for (const [id, entry] of Object.entries(chunk)) {
      const t = topics.find((x) => x.id === Number(id))
      if (!t) throw new Error(`${f}: unknown topic ${id}`)
      const { extraQuestions = [], ...deep } = entry
      t.deep = deep
      const have = new Set(t.questions.map((q) => q.id))
      for (const q of extraQuestions) if (!have.has(q.id)) t.questions.push(q)
      deepCount += 1
    }
  }
} catch (e) {
  if (e.code !== 'ENOENT') throw e
}

// Merge boss study briefs (scripts/authored/boss-deep/*.json: { "<topicId>": BossDeep })
const bossDeepDir = join(authoredDir, 'boss-deep')
let bossDeepCount = 0
try {
  for (const f of readdirSync(bossDeepDir).filter((x) => x.endsWith('.json')).sort()) {
    const chunk = JSON.parse(readFileSync(join(bossDeepDir, f), 'utf8'))
    for (const [id, entry] of Object.entries(chunk)) {
      const t = topics.find((x) => x.id === Number(id))
      if (!t || t.kind !== 'boss') throw new Error(`${f}: ${id} is not a boss topic`)
      t.bossDeep = entry
      bossDeepCount += 1
    }
  }
} catch (e) {
  if (e.code !== 'ENOENT') throw e
}

// Scenario-specific interview reference data: API sketch, out-of-scope list and the key trade-off per boss
const interviewFile = join(authoredDir, 'boss-interview', 'interview.json')
try {
  const ref = JSON.parse(readFileSync(interviewFile, 'utf8'))
  for (const [id, r] of Object.entries(ref)) {
    const t = topics.find((x) => x.id === Number(id))
    if (!t || t.kind !== 'boss') throw new Error(`boss-interview: ${id} is not a boss topic`)
    t.boss.exampleApi = r.api.join('\n')
    t.boss.exclusions = r.outOfScope
    t.boss.tradeoffAnalysis = r.tradeoff
    if (t.bossDeep) t.bossDeep.requirements.outOfScope = r.outOfScope
  }
} catch (e) {
  if (e.code !== 'ENOENT') throw e
}

topics.sort((a, b) => a.id - b.id)
writeFileSync(out, JSON.stringify(topics, null, 2))
console.log(`Assembled ${topics.length} topics from ${files.length} files (+${deepCount} deep lessons, +${bossDeepCount} boss briefs) -> ${out}`)
