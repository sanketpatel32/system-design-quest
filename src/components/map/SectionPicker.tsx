import { Link } from 'react-router-dom'
import { SECTIONS, sectionPalette, sectionPath, sectionTopics, type SectionId } from '../../content/sections'
import { XP_BOSS_FIRST_CLEAR, XP_TOPIC_FIRST_CLEAR } from '../../lib/progression/xp'
import type { PersistedState } from '../../lib/storage/schema'

/** XP earned from first clears of this section's topics (the global XP total is unchanged) */
export function sectionXp(id: SectionId, topicProgress: PersistedState['topicProgress']) {
  return sectionTopics(id).reduce((n, t) => n + (topicProgress[t.id]?.firstClearXpAwarded ? (t.kind === 'boss' ? XP_BOSS_FIRST_CLEAR : XP_TOPIC_FIRST_CLEAR) : 0), 0)
}

/** One row of section tabs shared by the overview, every section map, Review and the Cheat Sheet */
export function SectionPicker({ current, to = (id) => (id === 'all' ? '/' : sectionPath(id)), label = 'Sections', allOption }: { current: SectionId | 'all'; to?: (id: SectionId | 'all') => string; label?: string; allOption?: string }) {
  const items: { id: SectionId | 'all'; name: string; colour: string; soft: string }[] = [
    ...(allOption ? [{ id: 'all' as const, name: allOption, colour: '#29303D', soft: '#EEE9E1' }] : []),
    ...SECTIONS.map((s) => ({ id: s.id, name: s.name, colour: sectionPalette(s.id).deep, soft: sectionPalette(s.id).soft })),
  ]
  return (
    <nav aria-label={label} className="mb-5 -mx-1 overflow-x-auto pb-1" data-testid="section-picker">
      <ul className="flex gap-2 px-1">
        {items.map((s) => {
          const on = s.id === current
          return (
            <li key={s.id} className="shrink-0">
              <Link
                to={to(s.id)}
                aria-current={on ? 'page' : undefined}
                data-testid={`section-tab-${s.id}`}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-3 text-sm font-extrabold whitespace-nowrap"
                style={on ? { background: s.soft, borderColor: s.colour, color: s.colour } : { borderColor: 'var(--color-rail)', background: '#fff', color: '#5B6472' }}
              >
                <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: s.colour }} />
                {s.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
