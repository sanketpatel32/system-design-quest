import { Link } from 'react-router-dom'
import { SECTIONS, questName, sectionPalette, sectionPath, sectionTopics, lastSection } from '../content/sections'
import { useGameStore } from '../stores/gameStore'
import { sectionXp } from '../lib/progression/sectionXp'
import { RegionMotif } from '../components/map/RegionMotif'

function Ring({ done, total, colour, id }: { done: number; total: number; colour: string; id: string }) {
  const r = 30, c = 2 * Math.PI * r, f = total ? done / total : 0
  return (
    <svg width="60" height="60" className="shrink-0" viewBox="0 0 76 76" role="img" aria-label={`${done} of ${total} cleared`} data-testid={`ring-${id}`} data-done={done} data-total={total}>
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--color-paper-3)" strokeWidth="9" />
      <circle cx="38" cy="38" r={r} fill="none" stroke={colour} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${c * f} ${c}`} transform="rotate(-90 38 38)" />
      <text x="38" y="43" textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--color-chalk)">{Math.round(f * 100)}%</text>
    </svg>
  )
}

const MOTIFS: Record<string, string[]> = { 'system-design': ['r1-foundations', 'r4-caching', 'boss-arena'] }

/** Illustrated banner: the section's landmark glyph(s) on its soft colour, with a little winding path of map nodes */
function Banner({ id, regionIds, soft, deep, bright, done, total }: { id: string; regionIds: string[]; soft: string; deep: string; bright: string; done: number; total: number }) {
  const glyphs = MOTIFS[id] ?? regionIds.slice(0, 1)
  const dots = 5, lit = total ? Math.round((done / total) * dots) : 0
  return (
    <div className="relative flex h-20 items-center gap-3 overflow-hidden rounded-t-[14px] px-5" style={{ background: soft }} aria-hidden>
      {glyphs.map((g, i) => (
        <span key={g} className="grid place-items-center rounded-2xl bg-white" style={{ width: i ? 40 : 52, height: i ? 40 : 52, boxShadow: `0 3px 0 ${bright}55` }}>
          <RegionMotif regionId={g} color={deep} size={i ? 24 : 32} />
        </span>
      ))}
      <svg className="ml-auto" width="112" height="44" viewBox="0 0 112 44">
        <path d="M8 34 C 28 6, 44 6, 56 22 S 86 40, 104 10" fill="none" stroke={bright} strokeOpacity="0.45" strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" />
        {[[8, 34], [32, 14], [56, 22], [80, 32], [104, 10]].slice(0, dots).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i < lit ? 7 : 6} fill={i < lit ? bright : 'var(--color-card)'} stroke={i < lit ? deep : bright} strokeWidth="2.5" />
        ))}
      </svg>
    </div>
  )
}

/** Home: every section with its own progress ring, XP and next topic */
export function SectionsPage() {
  const topicProgress = useGameStore((s) => s.topicProgress)
  const last = lastSection()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl text-chalk">Choose a section</h1>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-4" aria-label="Sections">
        {SECTIONS.map((s) => {
          const topics = sectionTopics(s.id)
          const done = topics.filter((t) => topicProgress[t.id]?.completed).length
          const next = topics.find((t) => !topicProgress[t.id]?.completed)
          const p = sectionPalette(s.id)
          return (
            <li key={s.id}>
              <Link to={sectionPath(s.id)} className="section-card panel flex h-full flex-col overflow-hidden hover:-translate-y-0.5 transition-transform" style={{ borderColor: p.bright, boxShadow: `0 4px 0 ${p.bright}` }} data-testid={`section-card-${s.id}`}>
                <Banner id={s.id} regionIds={s.regionIds} soft={p.soft} deep={p.deep} bright={p.bright} done={done} total={topics.length} />
                <div className="flex flex-1 flex-col gap-1 p-5 pt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-display text-xl leading-tight" style={{ color: p.deep }}>{questName(s.id)}</p>
                    {s.id === last ? <span className="shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-extrabold" style={{ background: p.soft, color: p.deep }}>Last visited</span> : null}
                  </div>
                  <p className="text-sm text-dim">{s.blurb}</p>
                  <div className="mt-auto flex items-center gap-3 pt-3">
                    <Ring done={done} total={topics.length} colour={p.bright} id={s.id} />
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold tabular-nums text-chalk">{done} of {topics.length} cleared · {sectionXp(s.id, topicProgress)} XP</p>
                      {next && <p className="text-sm font-bold line-clamp-2" style={{ color: p.deep }}>Next: {next.title}</p>}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
