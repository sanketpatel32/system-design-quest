import { orderedTopicsInRegion, regions, topicsById } from './catalog'
import type { RegionMeta, Topic } from './types'
import { regionPalette } from '../lib/design/transitTheme'

export type SectionId = 'system-design' | 'frontend' | 'backend' | 'networking' | 'databases' | 'os-concurrency' | 'security' | 'cloud-devops'

export type Section = {
  id: SectionId
  name: string
  blurb: string
  /** Regions (units or areas) that make up the section, in map order */
  regionIds: RegionMeta['id'][]
}

/** Display name ("Frontend Quest") and the first half of the two-tone wordmark ("frontend" + "quest") */
export const SECTION_BRAND: Record<SectionId, { questName: string; word: string }> = {
  'system-design': { questName: 'System Design Quest', word: 'design' },
  frontend: { questName: 'Frontend Quest', word: 'frontend' },
  backend: { questName: 'Backend Quest', word: 'backend' },
  networking: { questName: 'Networking Quest', word: 'network' },
  databases: { questName: 'Databases Quest', word: 'database' },
  'os-concurrency': { questName: 'OS & Concurrency Quest', word: 'os' },
  security: { questName: 'Security Quest', word: 'security' },
  'cloud-devops': { questName: 'Cloud & DevOps Quest', word: 'cloud' },
}
export const questName = (id: SectionId) => SECTION_BRAND[id].questName

/** First-class sections. Topic IDs never move between sections, so saved progress (keyed by topic id) is unaffected. */
export const ALL_SECTIONS: Section[] = [
  { id: 'system-design', name: 'System Design', blurb: 'Units of core lessons, the Interview Playbook and boss fights that put it all together.', regionIds: regions.filter((r) => r.track !== 'fundamentals').map((r) => r.id) },
  { id: 'frontend', name: 'Frontend', blurb: 'How the browser turns bytes into pixels, and how to keep it fast, safe and accessible.', regionIds: ['f1-frontend'] },
  { id: 'backend', name: 'Backend', blurb: 'How servers handle requests, failures, jobs and limits.', regionIds: ['f2-backend'] },
  { id: 'networking', name: 'Networking', blurb: 'How packets find their way: addressing, routing, TCP, HTTP and TLS.', regionIds: ['f3-networking'] },
  { id: 'databases', name: 'Databases', blurb: 'How data is modelled, indexed, queried, made durable and replicated.', regionIds: ['f4-databases'] },
  { id: 'os-concurrency', name: 'Operating Systems & Concurrency', blurb: 'Processes, threads, memory, scheduling and the bugs that come from sharing.', regionIds: ['f5-os'] },
  { id: 'security', name: 'Security', blurb: 'Threat models, cryptography basics, secrets, and the attacks every engineer should know.', regionIds: ['f6-security'] },
  { id: 'cloud-devops', name: 'Cloud & DevOps', blurb: 'Containers, delivery pipelines, infrastructure as code, observability and incidents.', regionIds: ['f7-cloud'] },
]

/** Sections that have content (new ones appear as their topics are added) */
export const SECTIONS: Section[] = ALL_SECTIONS.filter((s) => s.regionIds.some((r) => orderedTopicsInRegion(r).length > 0))

export const SECTION_BY_ID = new Map(SECTIONS.map((s) => [s.id, s]))

const REGION_SECTION = new Map<string, SectionId>()
for (const s of ALL_SECTIONS) for (const r of s.regionIds) REGION_SECTION.set(r, s.id)

export function sectionOfTopic(topicId: number): SectionId {
  const t = topicsById.get(topicId)
  return (t && REGION_SECTION.get(t.region)) || 'system-design'
}

export function sectionTopics(id: SectionId): Topic[] {
  const s = SECTION_BY_ID.get(id)
  return s ? s.regionIds.flatMap((r) => orderedTopicsInRegion(r)) : []
}

/** Section colours come from the region palette, so a section and its map share one colour */
export function sectionPalette(id: SectionId) {
  if (id === 'system-design') return { bright: '#FF9600', deep: '#C2410C', soft: '#FFF1DB', shadow: '#9A3412' }
  return regionPalette(SECTION_BY_ID.get(id)?.regionIds[0] ?? 'r1-foundations')
}

export const sectionPath = (id: SectionId) => `/s/${id}`

export function isSectionId(x: string | undefined): x is SectionId {
  return Boolean(x && SECTION_BY_ID.has(x as SectionId))
}

/** Review and the Cheat Sheet follow ?s=<section>; without it they show the last section visited */
export function pageSection(search: string): SectionId {
  const v = new URLSearchParams(search).get('s') ?? undefined
  return isSectionId(v) ? v : lastSection()
}

const LAST = 'sdq-last-section'
export function rememberSection(id: SectionId) {
  try { localStorage.setItem(LAST, id) } catch { /* private mode */ }
}
export function lastSection(): SectionId {
  try { const v = localStorage.getItem(LAST) ?? undefined; return isSectionId(v) ? v : 'system-design' } catch { return 'system-design' }
}
