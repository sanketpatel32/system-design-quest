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

topics.sort((a, b) => a.id - b.id)
writeFileSync(out, JSON.stringify(topics, null, 2))
console.log(`Assembled ${topics.length} topics from ${files.length} files -> ${out}`)
