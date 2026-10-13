import { Link } from 'react-router-dom'
import { SECTIONS, sectionPalette, sectionPath, sectionTopics, lastSection } from '../content/sections'
import { useGameStore } from '../stores/gameStore'
import { SectionPicker, sectionXp } from '../components/map/SectionPicker'
import { isTopicUnlocked } from '../lib/progression/unlocks'

function Ring({ done, total, colour, id }: { done: number; total: number; colour: string; id: string }) {
  const r = 30, c = 2 * Math.PI * r, f = total ? done / total : 0
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`${done} of ${total} cleared`} data-testid={`ring-${id}`} data-done={done} data-total={total}>
      <circle cx="38" cy="38" r={r} fill="none" stroke="#EEE9E1" strokeWidth="9" />
      <circle cx="38" cy="38" r={r} fill="none" stroke={colour} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${c * f} ${c}`} transform="rotate(-90 38 38)" />
      <text x="38" y="43" textAnchor="middle" fontSize="15" fontWeight="800" fill="#29303D">{Math.round(f * 100)}%</text>
    </svg>
  )
}

/** Home: every section with its own progress ring, XP and next topic */
export function SectionsPage() {
  const topicProgress = useGameStore((s) => s.topicProgress)
  const unlocked = useGameStore((s) => s.unlockedTopicIds)
  const last = lastSection()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl text-chalk">Choose a section</h1>
        <p className="text-dim mt-1">Each section has its own map, progress and review deck. Your progress carries across; you can switch at any time.</p>
      </div>
      <SectionPicker current="all" recent={last} />
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Sections">
        {SECTIONS.map((s) => {
          const topics = sectionTopics(s.id)
          const done = topics.filter((t) => topicProgress[t.id]?.completed).length
          const next = topics.find((t) => !topicProgress[t.id]?.completed && isTopicUnlocked(t.id, unlocked, new Set(Object.keys(topicProgress).filter((k) => topicProgress[Number(k)]?.completed).map(Number))))
          const p = sectionPalette(s.id)
          return (
            <li key={s.id}>
              <Link to={sectionPath(s.id)} className="panel flex h-full items-center gap-4 p-5 hover:-translate-y-0.5 transition-transform" style={{ borderColor: p.bright, boxShadow: `0 4px 0 ${p.bright}` }} data-testid={`section-card-${s.id}`}>
                <Ring done={done} total={topics.length} colour={p.bright} id={s.id} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl" style={{ color: p.deep }}>{s.name}</p>
                  {s.id === last ? <p className="text-xs font-extrabold uppercase tracking-wide text-dim">Last visited</p> : null}
                  <p className="text-sm text-dim">{s.blurb}</p>
                  <p className="mt-1 text-sm font-extrabold tabular-nums text-chalk">{done} of {topics.length} cleared · {sectionXp(s.id, topicProgress)} XP</p>
                  {next && <p className="text-sm font-bold truncate" style={{ color: p.deep }}>Next: {next.title}</p>}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
