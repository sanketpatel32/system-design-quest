import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderedTopicsInRegion, regions, topicsById } from '../../content/catalog'
import type { Topic } from '../../content/types'
import { regionPalette } from '../../lib/design/transitTheme'
import { getUnlockHint, topicStatus } from '../../lib/progression/unlocks'
import { useGameStore } from '../../stores/gameStore'
import { RegionArt } from '../art/RegionArt'
import { Mascot, MascotSays } from '../art/Mascot'
import { IconBook, IconCastle, IconCheck, IconLock, IconStar } from '../icons/HudIcons'

const learningRegions = regions.filter((r) => r.id !== 'boss-arena')
/** Minutes: ~1 per lesson card, ~1.5 per question */
export function topicMinutes(id: number) {
  const t = topicsById.get(id)
  return t ? Math.max(5, Math.round(t.cards.length + t.questions.length * 1.5)) : 5
}
const arenaTopics = orderedTopicsInRegion('boss-arena')
/** Journey number for every learning station, 1-based */
const STATION_N = new Map<number, number>()
learningRegions.forEach((r) => orderedTopicsInRegion(r.id).forEach((t) => STATION_N.set(t.id, STATION_N.size + 1)))

type Status = ReturnType<typeof topicStatus>

const STATUS_WORD: Record<Status, string> = {
  locked: 'locked',
  available: 'open',
  in_progress: 'in progress',
  completed: 'cleared',
}

/** Horizontal offsets (px) that make the path wind, like a river */
const WIND = [0, 46, 74, 46, 0, -46, -74, -46]

function useStatuses() {
  const unlocked = useGameStore((s) => s.unlockedTopicIds)
  const topicProgress = useGameStore((s) => s.topicProgress)
  const quizAttempts = useGameStore((s) => s.quizAttempts)
  const completed = useMemo(
    () => new Set(Object.entries(topicProgress).filter(([, v]) => v.completed).map(([id]) => Number(id))),
    [topicProgress],
  )
  const statusMap = useMemo(() => {
    const m = new Map<number, Status>()
    for (const r of regions)
      for (const t of orderedTopicsInRegion(r.id)) {
        const inProgress = Boolean(quizAttempts[`topic-${t.id}`] && !topicProgress[t.id]?.completed)
        m.set(t.id, topicStatus(t, unlocked, completed, inProgress))
      }
    return m
  }, [unlocked, completed, quizAttempts, topicProgress])
  return { statusMap, completed, unlocked }
}

export function WorldMapScene() {
  const { statusMap, completed, unlocked } = useStatuses()
  const quizAttempts = useGameStore((s) => s.quizAttempts)
  const [view, setView] = useState<'path' | 'list'>('path')
  const [q, setQ] = useState('')

  const nextId = [...STATION_N.keys()].find((id) => {
    const st = statusMap.get(id)
    return st === 'available' || st === 'in_progress'
  })
  const nextTopic = nextId ? topicsById.get(nextId) : undefined
  /** Resume the quiz only when the learner has actually answered something */
  const resume = Boolean(nextId && Object.keys((quizAttempts[`topic-${nextId}`] as { results?: object } | undefined)?.results ?? {}).length)
  const total = STATION_N.size
  const doneCount = [...STATION_N.keys()].filter((id) => completed.has(id)).length
  const bossesDone = arenaTopics.filter((t) => completed.has(t.id)).length
  const arenaOpen = unlocked.includes(74) || completed.has(74)

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
      <section aria-labelledby="map-title" className="min-w-0">
        <Onboarding />
        {nextTopic && (
          <div
            className="panel mb-6 flex flex-wrap items-center gap-4 p-4 sm:p-5"
            data-testid="continue-quest"
            style={{ borderColor: regionPalette(nextTopic.region).bright, boxShadow: `0 4px 0 ${regionPalette(nextTopic.region).bright}` }}
          >
            <Mascot mood="idle" size={64} className="shrink-0 hidden sm:block" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold uppercase tracking-wide" style={{ color: regionPalette(nextTopic.region).deep }}>
                Continue · Unit {learningRegions.findIndex((r) => r.id === nextTopic.region) + 1}
              </p>
              <p className="font-display text-xl text-chalk truncate">{nextTopic.title}</p>
              <p className="text-sm text-dim">About {topicMinutes(nextTopic.id)} min · station {STATION_N.get(nextTopic.id)} of {total}</p>
            </div>
            <Link
              to={resume ? `/quiz/${nextTopic.slug}` : `/topic/${nextTopic.slug}`}
              className="btn-cta w-full sm:w-auto"
            >
              {resume ? 'Resume quiz' : 'Start lesson'}
            </Link>
          </div>
        )}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 id="map-title" className="font-display text-3xl md:text-4xl text-chalk">The network</h1>
            <p className="text-dim mt-1">
              {doneCount + bossesDone} of {total + arenaTopics.length} cleared · {total} lessons in {learningRegions.length} units, then {arenaTopics.length} boss fights
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-2xl border-2 border-[var(--color-rail)] bg-white p-1" role="group" aria-label="Map view">
            {(['path', 'list'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`min-h-[40px] rounded-xl px-4 text-sm font-extrabold uppercase tracking-wide ${view === v ? 'bg-[var(--color-sky)] text-[#12749f]' : 'text-dim hover:bg-[#f4f1ec]'}`}
              >
                {v === 'path' ? 'Path' : 'List'}
              </button>
            ))}
          </div>
        </div>
        <label className="mb-6 block">
          <span className="sr-only">Find a topic</span>
          <input
            type="search"
            className="field w-full"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              if (e.target.value.trim()) setView('list')
            }}
            placeholder="Find a topic, e.g. caching, Kafka"
          />
        </label>
        {view === 'path' ? (
          <div className="space-y-10">
            {learningRegions.map((r, i) => (
              <Unit key={r.id} index={i} regionId={r.id} statusMap={statusMap} completed={completed} nextId={nextId} />
            ))}
            <ArenaUnit statusMap={statusMap} completed={completed} open={arenaOpen} />
          </div>
        ) : (
          <Curriculum statusMap={statusMap} needle={q.trim().toLowerCase()} />
        )}
      </section>

      <aside className="hidden lg:flex flex-col gap-5 lg:sticky lg:top-24 self-start" aria-label="Progress">
        <section className="panel p-5">
          <div className="flex items-center gap-3">
            <Mascot mood={doneCount > 0 ? 'happy' : 'idle'} size={72} />
            <div>
              <p className="font-display text-xl">{doneCount ? 'Nice work!' : 'Ready when you are'}</p>
              <p className="text-dim text-sm">{doneCount} of {total} lessons cleared</p>
            </div>
          </div>
          <div className="progress-track mt-4" aria-hidden>
            <div className="progress-fill" style={{ width: `${Math.max(4, (doneCount / total) * 100)}%` }} />
          </div>
        </section>
        <section className="panel p-5" aria-labelledby="arena-title">
          <div className="flex items-center gap-3">
            <IconCastle size={44} />
            <div className="min-w-0 flex-1">
              <h2 id="arena-title" className="font-display text-lg text-chalk">Architecture Colosseum</h2>
              <p className="text-sm text-dim">{bossesDone} of {arenaTopics.length} bosses beaten</p>
            </div>
          </div>
          <p className="text-sm text-dim mt-2">
            {arenaOpen ? 'Bosses unlock one after another. Start with the playbook.' : 'Clear Unit 1 to open the arena.'}
          </p>
          <ol className="mt-3 space-y-1">
            {arenaTopics.slice(0, 8).map((t, bi) => {
              const bst = statusMap.get(t.id) ?? 'locked'
              return (
                <li key={t.id}>
                  {bst !== 'locked' ? (
                    <Link to={`/topic/${t.slug}`} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm font-bold hover:bg-[#f4f1ec]" data-testid={`boss-row-${t.id}`}>
                      <BossPip status={bst} />
                      <span className="text-dim tabular-nums w-6">{bi + 1}</span>
                      <span className="truncate">{t.title}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2.5 px-2 py-1.5 text-sm font-bold text-dim" title="Clear the previous boss to unlock">
                      <BossPip status={bst} />
                      <span className="tabular-nums w-6">{bi + 1}</span>
                      <span className="truncate">{t.title}</span>
                      <span className="sr-only">(locked)</span>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
          <button type="button" className="mt-2 text-sm font-extrabold uppercase tracking-wide text-[#12749f]" onClick={() => setView('list')}>
            See all {arenaTopics.length} bosses
          </button>
        </section>
      </aside>
    </div>
  )
}

function BossPip({ status }: { status: Status }) {
  const bg = status === 'completed' ? '#FFC800' : status === 'locked' ? '#E6E0D6' : '#fff'
  return <span aria-hidden className="h-3.5 w-3.5 shrink-0 rounded-full border-[3px]" style={{ background: bg, borderColor: status === 'locked' ? '#E6E0D6' : '#E0A800' }} />
}

function UnitBanner({ regionId, index, done, total, title, subtitle }: { regionId: string; index: number | null; done: number; total: number; title: string; subtitle: string }) {
  const p = regionPalette(regionId)
  const gold = regionId === 'boss-arena'
  return (
    <div className={`unit-banner flex items-center gap-3 p-5 pr-2 min-h-[120px] ${gold ? 'banner-gold' : ''}`} style={{ background: gold ? p.bright : p.deep, ['--banner-shadow' as string]: p.shadow }}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold uppercase tracking-wider text-white">{index === null ? 'Final unit' : `Unit ${index + 1}`}</p>
        <h2 className="font-display text-2xl leading-tight text-white">{subtitle}</h2>
        <p className="font-bold text-white">{title}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-3 w-28 overflow-hidden rounded-full bg-white/30" aria-hidden>
            <div className="h-full rounded-full bg-white" style={{ width: `${(done / Math.max(1, total)) * 100}%` }} />
          </div>
          <span className="text-sm font-extrabold text-white tabular-nums">{done}/{total}</span>
        </div>
      </div>
      <RegionArt regionId={regionId} width={150} className="shrink-0 w-[104px] sm:w-[150px] h-auto" />
    </div>
  )
}

function Unit({ regionId, index, statusMap, completed, nextId }: { regionId: string; index: number; statusMap: Map<number, Status>; completed: Set<number>; nextId?: number }) {
  const region = learningRegions.find((r) => r.id === regionId)!
  const topics = orderedTopicsInRegion(regionId as Topic['region'])
  const done = topics.filter((t) => completed.has(t.id)).length
  return (
    <section aria-label={`Unit ${index + 1}: ${region.subtitle}`}>
      <UnitBanner regionId={regionId} index={index} done={done} total={topics.length} title={region.name} subtitle={region.subtitle} />
      <ol className="relative mx-auto mt-8 flex max-w-[420px] flex-col items-center gap-10">
        {topics.map((t, j) => (
          <PathNode key={t.id} topic={t} offset={WIND[(j + index * 3) % WIND.length]!} status={statusMap.get(t.id) ?? 'locked'} current={t.id === nextId} completed={completed} first={j === 0} />
        ))}
      </ol>
    </section>
  )
}

function ArenaUnit({ statusMap, completed, open }: { statusMap: Map<number, Status>; completed: Set<number>; open: boolean }) {
  const arena = regions.find((r) => r.id === 'boss-arena')
  const done = arenaTopics.filter((t) => completed.has(t.id)).length
  const [all, setAll] = useState(false)
  const shown = all ? arenaTopics : arenaTopics.slice(0, 6)
  return (
    <section aria-label="Final unit: Architecture Colosseum">
      <UnitBanner regionId="boss-arena" index={null} done={done} total={arenaTopics.length} title={open ? 'Full design problems, scored stage by stage' : 'Clear Unit 1 to open the gates'} subtitle={arena?.subtitle ?? 'Architecture Colosseum'} />
      <ol className="relative mx-auto mt-8 flex max-w-[420px] flex-col items-center gap-10">
        {shown.map((t, j) => (
          <PathNode key={t.id} topic={t} offset={WIND[(j * 2) % WIND.length]!} status={statusMap.get(t.id) ?? 'locked'} current={false} completed={completed} boss />
        ))}
      </ol>
      {!all && (
        <div className="mt-6 text-center">
          <button type="button" className="btn-quiet" onClick={() => setAll(true)}>Show all {arenaTopics.length} bosses</button>
        </div>
      )}
    </section>
  )
}

function PathNode({ topic, offset, status, current, completed, first, boss }: { topic: Topic; offset: number; status: Status; current: boolean; completed: Set<number>; first?: boolean; boss?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLLIElement>(null)
  const p = regionPalette(topic.region)
  const locked = status === 'locked'
  const fill = locked ? '#E5E0D8' : boss ? '#FFC800' : p.bright
  const shadow = locked ? '#CFC7BA' : boss ? '#E0A800' : p.shadow
  const n = STATION_N.get(topic.id)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const icon = boss ? (
    <IconCastle size={40} />
  ) : locked ? (
    <IconLock />
  ) : status === 'completed' ? (
    <IconCheck size={34} />
  ) : first ? (
    <IconBook size={32} />
  ) : (
    <IconStar size={32} />
  )
  const labelSide = offset > 0 ? 'right-[calc(100%+14px)] text-right' : 'left-[calc(100%+14px)] text-left'

  return (
    <li ref={ref} className="relative" style={{ transform: `translateX(${offset}px)` }}>
      {current && !open && (
        <span className="pointer-events-none absolute bottom-[calc(100%+14px)] left-1/2 -translate-x-1/2" aria-hidden>
          <span className="bubble-bob block">
            <span className="bubble" style={{ color: p.deep }}>Start</span>
          </span>
        </span>
      )}
      <button
        type="button"
        data-testid={boss ? `boss-node-${topic.id}` : `station-${topic.id}`}
        data-status={status}
        aria-label={`${boss ? 'Boss' : `Station ${n}`}: ${topic.title}, ${STATUS_WORD[status]}`}
        aria-expanded={open}
        className={`station path-node ${boss ? 'path-node-boss' : ''}`}
        style={{ background: fill, boxShadow: `0 7px 0 ${shadow}${current ? `, 0 0 0 8px ${p.soft}` : ''}` }}
        onClick={() => setOpen(true)}
      >
        {icon}
      </button>
      <span className={`pointer-events-none absolute top-1/2 w-[132px] -translate-y-1/2 text-[13px] font-extrabold leading-tight ${labelSide} ${locked ? 'text-dim' : 'text-chalk'}`}>
        {topic.title}
      </span>
      {open && (
        <div
          className="anim-pop absolute left-1/2 top-[calc(100%+16px)] z-30 w-[min(290px,86vw)] -translate-x-1/2 rounded-2xl p-4 text-white"
          style={{ background: locked ? '#5B6472' : boss ? '#8A5A00' : p.deep, boxShadow: `0 5px 0 ${locked ? '#3f4652' : boss ? '#5c3c00' : p.shadow}` }}
          role="dialog"
          aria-label={topic.title}
        >
          <span aria-hidden className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45" style={{ background: locked ? '#5B6472' : boss ? '#8A5A00' : p.deep }} />
          <p className="font-display text-lg leading-snug">{topic.title}</p>
          <p className="text-sm font-bold text-white">
            {boss ? 'Boss fight' : `Station ${n}`} · {STATUS_WORD[status]} · about {topicMinutes(topic.id)} min
          </p>
          {locked ? (
            <p className="mt-2 text-sm font-bold">{getUnlockHint(topic.id, completed)}</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <Link
                to={`/topic/${topic.slug}`}
                data-testid={boss ? undefined : 'start-topic'}
                className="btn-quiet btn-block"
                style={{ color: locked ? undefined : boss ? '#8A5A00' : p.deep, ['--b-sh' as string]: 'rgba(0,0,0,0.25)', ['--b-bd' as string]: '#fff' }}
              >
                {status === 'completed' ? 'Review lesson' : status === 'in_progress' ? 'Continue lesson' : boss ? 'Read the brief' : 'Start lesson'}
              </Link>
              {boss && (
                <Link to={`/boss/${topic.slug}`} className="btn-quiet btn-block" style={{ color: '#8A5A00', ['--b-sh' as string]: 'rgba(0,0,0,0.25)' }}>
                  Fight the boss
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  )
}

const ONBOARD_KEY = 'sdq-onboarded'

function Onboarding() {
  const [open, setOpen] = useState(() => {
    try {
      return !localStorage.getItem(ONBOARD_KEY)
    } catch {
      return false
    }
  })
  if (!open) return null
  const close = () => {
    try {
      localStorage.setItem(ONBOARD_KEY, '1')
    } catch {
      /* private mode */
    }
    setOpen(false)
  }
  return (
    <section className="panel mb-6 p-5" aria-labelledby="onboard-title" data-testid="onboarding">
      <MascotSays mood="happy" size={88}>
        <h2 id="onboard-title" className="font-display text-xl text-chalk">Hi, I’m Byte! Here’s how DesignQuest works.</h2>
      </MascotSays>
      <ul className="mt-3 grid gap-3 text-[15px] sm:grid-cols-2">
        {[
          ['Lessons', 'Each node is a short lesson, then a quiz. Pass to open the next one.', '#58CC02'],
          ['Hearts', 'You get 3 per quiz. A wrong answer costs one; blank answers never do.', '#FF4B4B'],
          ['Review', 'Cleared topics come back as flashcards on a schedule, so they stick.', '#1CB0F6'],
          ['Bosses', 'Full design problems in the Colosseum, scored stage by stage.', '#FFC800'],
        ].map(([h, b, c]) => (
          <li key={h} className="flex gap-3 rounded-2xl bg-[#f7f4ef] p-3">
            <span aria-hidden className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ background: c }} />
            <span><span className="font-extrabold text-chalk">{h}.</span> <span className="text-dim">{b}</span></span>
          </li>
        ))}
      </ul>
      <button type="button" className="btn-cta mt-4 w-full sm:w-auto" onClick={close}>Got it</button>
    </section>
  )
}

function Curriculum({ statusMap, needle }: { statusMap: Map<number, Status>; needle: string }) {
  const groups = [...learningRegions, ...regions.filter((r) => r.id === 'boss-arena')]
  return (
    <section aria-labelledby="curriculum-title">
      <h2 id="curriculum-title" className="font-display text-2xl text-chalk mb-3">All stations</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groups.map((r, i) => {
          const all = orderedTopicsInRegion(r.id)
          const topics = needle ? all.filter((t) => t.title.toLowerCase().includes(needle)) : all
          if (!topics.length) return null
          const done = all.filter((t) => statusMap.get(t.id) === 'completed').length
          const p = regionPalette(r.id)
          return (
            <div key={r.id} className="panel min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: p.deep }}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-white">{r.id === 'boss-arena' ? 'Final unit' : `Unit ${i + 1}`}</p>
                  <h3 className="font-display text-lg leading-tight">{r.subtitle}</h3>
                </div>
                <span className="text-sm font-extrabold tabular-nums">{done}/{all.length}</span>
              </div>
              <ol className="p-2">
                {topics.map((t) => {
                  const st = statusMap.get(t.id) ?? 'locked'
                  const body = (
                    <>
                      <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold" style={{ background: st === 'locked' ? '#EEE9E1' : p.soft, color: st === 'locked' ? '#5B6472' : p.deep }}>
                        {STATION_N.get(t.id) ?? '★'}
                      </span>
                      <span className={`flex-1 truncate ${st === 'locked' ? 'text-dim' : 'text-chalk'}`}>{t.title}</span>
                      <span className={`status-chip status-${st}`}>{STATUS_WORD[st]}</span>
                    </>
                  )
                  return (
                    <li key={t.id}>
                      {st === 'locked' ? (
                        <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-bold">{body}</div>
                      ) : (
                        <Link to={`/topic/${t.slug}`} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-bold hover:bg-[#f4f1ec]">
                          {body}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          )
        })}
      </div>
    </section>
  )
}
