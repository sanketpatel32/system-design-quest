import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const topics = JSON.parse(readFileSync(join(root, 'src/content/generated/topics.json'), 'utf8'))
const ORIGIN = 'https://system-design-quest-phi.vercel.app'

const sections = [
  'system-design', 'frontend', 'backend', 'networking',
  'databases', 'os-concurrency', 'security', 'cloud-devops',
]

const paths = [
  '/',
  ...sections.map((s) => `/s/${s}`),
  '/play',
  '/interview',
  '/revision',
  '/cheat-sheet',
  '/settings',
  ...topics.map((t) => `/topic/${t.slug}`),
  ...topics.filter((t) => t.kind !== 'boss').map((t) => `/quiz/${t.slug}`),
  ...topics.filter((t) => t.kind === 'boss').map((t) => `/boss/${t.slug}`),
]

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  paths.map((p) => `  <url><loc>${ORIGIN}${p}</loc></url>`).join('\n') +
  '\n</urlset>\n'

writeFileSync(join(root, 'public/sitemap.xml'), xml)
console.log(`sitemap.xml: ${paths.length} URLs`)
