import { allTopics } from '../../content/catalog'
import { questName, type SectionId } from '../../content/sections'

/** Tab titles: "Where to cache · System Design Quest", "Quiz: TLS handshake · Networking Quest", "Page not found · …" */
export function pageTitle(pathname: string, section: SectionId | null | undefined): string {
  const quest = questName(section ?? 'system-design')
  const [, kind, slug] = pathname.split('/')
  const topic = slug ? allTopics.find((t) => t.slug === decodeURIComponent(slug)) : undefined
  const fixed: Record<string, string> = { play: 'Quick play', revision: 'Review', 'cheat-sheet': 'Cheat sheet', interview: 'Interview practice', settings: 'Settings' }
  let page: string | null
  if (pathname === '/' || kind === 's') page = null
  else if (kind && fixed[kind] && !slug) page = fixed[kind]!
  else if (kind === 'topic' && topic) page = topic.title
  else if (kind === 'quiz' && topic) page = `Quiz: ${topic.title}`
  else if (kind === 'boss' && topic) page = `Boss fight: ${topic.title}`
  else page = 'Page not found'
  return page ? `${page} · ${quest}` : quest
}
