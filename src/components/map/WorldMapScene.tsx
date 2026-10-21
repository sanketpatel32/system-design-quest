import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { orderedTopicsInRegion, regions, topicsById } from '../../content/catalog'
import type { Topic } from '../../content/types'
import { regionPalette } from '../../lib/design/transitTheme'
import { getUnlockHint, isTopicUnlocked, topicStatus } from '../../lib/progression/unlocks'
import { useGameStore } from '../../stores/gameStore'
import { RegionMotif } from './RegionMotif'
import { Mascot, MascotSays } from '../art/Mascot'
import { IconBook, IconCastle, IconCheck, IconLock, IconStar } from '../icons/HudIcons'

import { bosses as arenaTopics, BOSS_N, FUND_N, fundamentalRegions, LESSON_N as STATION_N, learningRegions, playbook, PLAYBOOK_ID, topicLabel } from '../../content/numbering'

import { SECTION_BY_ID, sectionPalette, sectionTopics, type SectionId, questName } from '../../content/sections'
import { sectionXp } from '../../lib/progression/sectionXp'
/** Minutes: ~1 per lesson card, ~1.5 per question */
export function topicMinutes(id: number) {
  const t = topicsById.get(id)
  return t ? Math.max(5, Math.round(t.cards.length + t.questions.length * 1.5)) : 5
}

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
  const lessonProgress = useGameStore((s) => s.lessonProgress)
  const completed = useMemo(
    () => new Set(Object.entries(topicProgress).filter(([, v]) => v.completed).map(([id]) => Number(id))),
    [topicProgress],
  )
  const statusMap = useMemo(() => {
    const m = new Map<number, Status>()
    for (const r of regions)
      for (const t of orderedTopicsInRegion(r.id)) {
        const answered = Object.keys(quizAttempts[`topic-${t.id}`]?.results ?? {}).length > 0
        const started = (lessonProgress[t.id]?.card ?? 0) > 0 || Boolean(lessonProgress[t.id]?.viewed)
        const inProgress = (answered || started) && !topicProgress[t.id]?.completed
        m.set(t.id, topicStatus(t, unlocked, completed, inProgress))
      }
    return m
  }, [unlocked, completed, quizAttempts, topicProgress, lessonProgress])
  return { statusMap, completed, unlocked }
}

export function WorldMapScene({ sectionId = 'system-design' }: { sectionId?: SectionId }) {
  const { statusMap, completed, unlocked } = useStatuses()
  const quizAttempts = useGameStore((s) => s.quizAttempts)
  const lessonProgress = useGameStore((s) => s.lessonProgress)
  const topicProgress = useGameStore((s) => s.topicProgress)
  const section = SECTION_BY_ID.get(sectionId)!
  const fund = sectionId !== 'system-design'
  const areaRegions = fundamentalRegions.filter((r) => section.regionIds.includes(r.id))
  const trackIds = fund ? sectionTopics(sectionId).map((t) => t.id) : [...STATION_N.keys()]
  const sp = sectionPalette(sectionId)
  const xp = sectionXp(sectionId, topicProgress)
  const [view, setView] = useState<'path' | 'list'>('path')
  const [q, setQ] = useState('')
  const [allBosses, setAllBosses] = useState(false)
  const showBossList = () => {
    setView('path')
    setAllBosses(true)
    setQ('')
    // wait for the path view to render, then jump to the arena
    requestAnimationFrame(() => document.getElementById('arena')?.scrollIntoView({ block: 'start' }))
  }

  const nextId = trackIds.find((id) => {
    const st = statusMap.get(id)
    return st === 'available' || st === 'in_progress'
  })
  const nextTopic = nextId ? topicsById.get(nextId) : undefined
  /** Resume the quiz only when the learner has actually answered something */
  const resume = Boolean(nextId && Object.keys((quizAttempts[`topic-${nextId}`] as { results?: object } | undefined)?.results ?? {}).length)
  const lp = nextId ? lessonProgress[nextId] : undefined
  /** Resume the lesson on the card the learner left (or the quiz, once they've answered something) */
  const lessonStarted = Boolean(lp && (lp.card > 0 || lp.viewed))
  const nextQuestion = nextTopic ? nextTopic.questions.findIndex((x) => !(x.id in (quizAttempts[`topic-${nextTopic.id}`]?.results ?? {}))) : -1
  const total = trackIds.length
  const doneCount = trackIds.filter((id) => completed.has(id)).length
  const unitWord = (t: Topic) => (fund ? `Fundamentals · ${topicLabel(t.id)}` : `Unit ${learningRegions.findIndex((r) => r.id === t.region) + 1}`)
  const bossesDone = arenaTopics.filter((t) => completed.has(t.id)).length
  const playbookDone = completed.has(PLAYBOOK_ID) ? 1 : 0
  const arenaOpen = isTopicUnlocked(PLAYBOOK_ID, unlocked) || completed.has(PLAYBOOK_ID)

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20.625rem] 2xl:grid-cols-[minmax(0,1fr)_23rem]">
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
                {resume || lessonStarted ? 'Continue' : 'Up next'} · {unitWord(nextTopic)}
              </p>
              <p className="font-display text-xl text-chalk truncate">{nextTopic.title}</p>
              <p className="text-sm text-dim" data-testid="continue-detail">
                {resume
                  ? `Quiz in progress · question ${nextQuestion + 1} of ${nextTopic.questions.length} is next`
                  : lessonStarted && lp
                    ? lp.viewed && lp.card >= nextTopic.cards.length - 1
                      ? 'Lesson read · the quiz is next'
                      : `Lesson in progress · card ${lp.card + 1} of ${nextTopic.cards.length}`
                    : fund
                      ? `About ${topicMinutes(nextTopic.id)} min · ${doneCount} of ${total} ${section.name} topics cleared`
                      : `About ${topicMinutes(nextTopic.id)} min · lesson ${STATION_N.get(nextTopic.id)} of ${total}`}
              </p>
            </div>
            <Link
              to={resume || lp?.viewed ? `/quiz/${nextTopic.slug}` : `/topic/${nextTopic.slug}`}
              data-testid="continue-link"
              className="btn-cta w-full sm:w-auto"
            >
              {resume ? 'Continue quiz' : lp?.viewed ? 'Continue to the quiz' : lessonStarted ? 'Continue lesson' : 'Start lesson'}
            </Link>
          </div>
        )}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 id="map-title" className="font-display text-[1.75rem] sm:text-3xl md:text-4xl" style={{ color: sp.deep }}>{questName(section.id)}</h1>
            <p className="text-dim mt-1 max-sm:text-sm">
              {fund ? `${doneCount} of ${total} topics cleared · ${xp} XP. ${section.blurb} Language-agnostic; topics open one after another.` : <>{doneCount} of {total} lessons cleared in {learningRegions.length} units · practice track: {playbookDone + bossesDone} of {1 + arenaTopics.length} (Interview Playbook and {arenaTopics.length} bosses, open after Unit 1, alongside the units)</>}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-2xl border-2 border-[var(--color-rail)] bg-white p-1" role="group" aria-label="Map view">
            {(['path', 'list'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`min-h-[44px] rounded-xl px-4 text-sm font-extrabold uppercase tracking-wide ${view === v ? 'bg-[var(--color-sky)] text-[#12749f]' : 'text-dim hover:bg-[#f4f1ec]'}`}
              >
                {v === 'path' ? 'Path' : 'List'}
              </button>
            ))}
          </div>
        </div>
        {view === 'path' && nextTopic && (
          <button
            type="button"
            className="btn-quiet mb-4 w-full sm:w-auto"
            data-testid="jump-current"
            onClick={() => document.getElementById(`station-anchor-${nextTopic.id}`)?.scrollIntoView({ block: 'center' })}
          >
            Jump to current lesson
          </button>
        )}
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
        {view === 'path' && fund ? (
          <div className="space-y-6 overflow-x-clip pb-4" data-testid="fundamentals-path">
            {areaRegions.map((r, i) => (
              <Unit key={r.id} index={i} regionId={r.id} statusMap={statusMap} completed={completed} nextId={nextId} kicker={`${section.name} · ${r.subtitle}`} />
            ))}
          </div>
        ) : view === 'path' ? (
          <div className="space-y-6 overflow-x-clip pb-4">
            {learningRegions.map((r, i) => (
              <div key={r.id} className="space-y-6">
                <Unit index={i} regionId={r.id} statusMap={statusMap} completed={completed} nextId={nextId} />
                {i === 0 && (
                  <a href="#arena" onClick={(e) => { e.preventDefault(); showBossList() }} className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-[#E0A800] bg-[#FFFBEA] px-4 py-3 text-sm font-bold text-[#6b4700]" data-testid="practice-track-signpost">
                    <IconCastle size={28} />
                    <span className="flex-1">{arenaOpen ? 'Practice track open: the Interview Playbook and boss fights run alongside Units 2–10.' : 'After Unit 1, a boss-fight practice track opens alongside the remaining units.'}</span>
                    <span className="font-extrabold uppercase tracking-wide">Go</span>
                  </a>
                )}
              </div>
            ))}
            <ArenaUnit statusMap={statusMap} completed={completed} open={arenaOpen} all={allBosses} onShowAll={() => setAllBosses(true)} />
          </div>
        ) : (
          <Curriculum statusMap={statusMap} needle={q.trim().toLowerCase()} fund={fund} areas={areaRegions} />
        )}
      </section>

      <aside className="hidden lg:flex flex-col gap-5 lg:sticky lg:top-24 self-start" aria-label="Progress">
        <section className="panel p-5">
          <div className="flex items-center gap-3">
            <Mascot mood={doneCount > 0 ? 'happy' : 'idle'} size={72} />
            <div>
              <p className="font-display text-xl">{doneCount ? 'Nice work!' : 'Ready when you are'}</p>
              <p className="text-dim text-sm">{doneCount} of {total} {fund ? 'topics' : 'lessons'} cleared</p>
              <p className="text-sm font-extrabold tabular-nums" style={{ color: sp.deep }} data-testid="section-xp">{xp} XP in {section.name}</p>
            </div>
          </div>
          <div className="progress-track mt-4" aria-hidden>
            <div className="progress-fill" style={{ width: `${Math.max(4, (doneCount / total) * 100)}%` }} />
          </div>
        </section>
        {!fund && <section className={`panel ${arenaOpen ? 'p-5' : 'p-4'}`} aria-labelledby="arena-title" data-testid="boss-sidebar">
          <div className="flex items-center gap-3">
            <IconCastle size={arenaOpen ? 44 : 32} />
            <div className="min-w-0 flex-1">
              <h2 id="arena-title" className="font-display text-lg text-chalk">Boss fights</h2>
              <p className="text-sm text-dim">{bossesDone} of {arenaTopics.length} bosses beaten</p>
            </div>
          </div>
          <p className="text-sm text-dim mt-2">
            {arenaOpen ? 'Practice track, alongside the units. Start with the Interview Playbook; bosses then unlock one after another.' : 'Practice track. Opens after Unit 1 and runs alongside the other units.'}
          </p>
          {arenaOpen && <ol className="mt-3 space-y-1" data-testid="boss-sidebar-list">
            {arenaTopics.slice(0, 7).map((t, bi) => {
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
          </ol>}
          <button type="button" className="mt-2 text-sm font-extrabold uppercase tracking-wide text-[#12749f]" onClick={showBossList} data-testid="see-all-bosses">
            {arenaOpen ? `See all ${arenaTopics.length} bosses` : `Preview the ${arenaTopics.length} bosses`}
          </button>
        </section>}
      </aside>
    </div>
  )
}

function BossPip({ status }: { status: Status }) {
  const bg = status === 'completed' ? '#FFC800' : status === 'locked' ? '#E6E0D6' : '#fff'
  return <span aria-hidden className="h-3.5 w-3.5 shrink-0 rounded-full border-[3px]" style={{ background: bg, borderColor: status === 'locked' ? '#E6E0D6' : '#E0A800' }} />
}

function UnitBanner({ regionId, index, done, total, title, collapsed, onToggle, note, kicker }: { regionId: string; index: number | null; done: number; total: number; title: string; collapsed?: boolean; onToggle?: () => void; note?: string; kicker?: string }) {
  const p = regionPalette(regionId)
  const gold = regionId === 'boss-arena'
  return (
    <div className={`unit-banner flex items-center gap-3 px-4 py-3 sm:px-5 ${gold ? 'banner-gold' : ''}`} style={{ background: gold ? p.bright : p.deep, ['--banner-shadow' as string]: p.shadow }}>
      <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/20">
        <RegionMotif regionId={regionId} color={gold ? '#3d2a00' : '#fff'} size={26} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold uppercase tracking-wider text-white">{kicker ?? (index === null ? 'Practice track · opens after Unit 1' : `Unit ${index + 1}`)}</p>
        <h2 className="font-display text-xl leading-tight text-white">{title}</h2>
        {note && <p className="text-sm font-bold text-white">{note}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-extrabold text-white tabular-nums">{done}/{total}</span>
        <div className="h-2.5 w-16 overflow-hidden rounded-full bg-white/30" aria-hidden>
          <div className="h-full rounded-full bg-white" style={{ width: `${(done / Math.max(1, total)) * 100}%` }} />
        </div>
        {onToggle && (
          <button type="button" onClick={onToggle} aria-expanded={!collapsed} className="mt-1 -mb-1 inline-flex min-h-[44px] min-w-[56px] items-center justify-center rounded-xl bg-white/20 px-3 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-white/30" data-testid={`unit-toggle-${regionId}`}>
            {collapsed ? 'Show' : 'Hide'}
          </button>
        )}
      </div>
    </div>
  )
}

function Unit({ regionId, index, statusMap, completed, nextId, kicker }: { regionId: string; index: number; statusMap: Map<number, Status>; completed: Set<number>; nextId?: number; kicker?: string }) {
  const region = regions.find((r) => r.id === regionId)!
  const topics = orderedTopicsInRegion(regionId as Topic['region'])
  const done = topics.filter((t) => completed.has(t.id)).length
  const hasCurrent = topics.some((t) => t.id === nextId)
  const allLocked = topics.every((t) => (statusMap.get(t.id) ?? 'locked') === 'locked')
  // Shorter path: finished units and units you can't open yet start folded; the current unit is always open
  const foldByDefault = !hasCurrent && (done === topics.length || allLocked)
  const [collapsed, setCollapsed] = useState(foldByDefault)
  useEffect(() => setCollapsed(foldByDefault), [foldByDefault])
  const note = collapsed ? (done === topics.length ? `All ${topics.length} lessons cleared` : allLocked ? `${topics.length} lessons · locked` : `${topics.length} lessons`) : undefined
  return (
    <section aria-label={kicker ? `${region.name} fundamentals` : `Unit ${index + 1}: ${region.name}`} id={`unit-${regionId}`} className="scroll-mt-24" data-testid={kicker ? `area-${regionId}` : `unit-${index + 1}`} data-collapsed={collapsed}>
      <UnitBanner regionId={regionId} index={index} done={done} total={topics.length} title={region.name} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} note={note} kicker={kicker} />
      {!collapsed && (
        <ol className="relative mx-auto mt-6 flex max-w-[26.25rem] flex-col items-center gap-6">
          {topics.map((t, j) => (
            <PathNode key={t.id} topic={t} offset={WIND[(j + index * 3) % WIND.length]!} status={statusMap.get(t.id) ?? 'locked'} current={t.id === nextId} completed={completed} first={j === 0} />
          ))}
        </ol>
      )}
    </section>
  )
}

function ArenaUnit({ statusMap, completed, open, all, onShowAll }: { statusMap: Map<number, Status>; completed: Set<number>; open: boolean; all: boolean; onShowAll: () => void }) {
  const done = arenaTopics.filter((t) => completed.has(t.id)).length
  const [collapsed, setCollapsed] = useState(!open)
  useEffect(() => setCollapsed(!open), [open])
  const shown = all ? arenaTopics : arenaTopics.slice(0, 6)
  const isCollapsed = collapsed && !all
  return (
    <section id="arena" aria-label="Practice track: Architecture Colosseum" className="scroll-mt-24">
      <UnitBanner
        regionId="boss-arena"
        index={null}
        done={done}
        total={arenaTopics.length}
        title="Boss fights"
        note={open ? 'Full design problems, scored stage by stage. Practise alongside the units.' : 'Clear Unit 1 to open. Then practise alongside the units.'}
        collapsed={isCollapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      {!isCollapsed && (
        <>
          <ol className="relative mx-auto mt-6 flex max-w-[26.25rem] flex-col items-center gap-6">
            {playbook && (
              <PathNode topic={playbook} offset={0} status={statusMap.get(playbook.id) ?? 'locked'} current={false} completed={completed} />
            )}
            {shown.map((t, j) => (
              <PathNode key={t.id} topic={t} offset={WIND[(j * 2) % WIND.length]!} status={statusMap.get(t.id) ?? 'locked'} current={false} completed={completed} boss />
            ))}
          </ol>
          {!all && (
            <div className="mt-5 text-center">
              <button type="button" className="btn-quiet" onClick={onShowAll}>Show all {arenaTopics.length} bosses</button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function PathNode({ topic, offset, status, current, completed, first, boss }: { topic: Topic; offset: number; status: Status; current: boolean; completed: Set<number>; first?: boolean; boss?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLLIElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const pos = usePopoverPosition(open, btnRef, popRef)
  // The popover lives in a portal at the end of <body>: move focus into it on open, and keep Tab order
  // in map order (Shift+Tab returns to this node, Tab past the end goes on to the next node).
  useEffect(() => {
    if (open && pos.ready) (popRef.current?.querySelector<HTMLElement>('a[href],button') ?? popRef.current)?.focus({ preventScroll: true })
  }, [open, pos.ready])
  const onPopKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return
    const items = [...(popRef.current?.querySelectorAll<HTMLElement>('a[href],button') ?? [])]
    const first = items[0], last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === popRef.current)) {
      e.preventDefault(); setOpen(false); btnRef.current?.focus()
    } else if (!e.shiftKey && (active === last || !items.length)) {
      e.preventDefault(); setOpen(false)
      const all = [...document.querySelectorAll<HTMLElement>('.path-node')]
      ;(all[all.indexOf(btnRef.current!) + 1] ?? btnRef.current)?.focus()
    }
  }
  const p = regionPalette(topic.region)
  const locked = status === 'locked'
  const fill = locked ? '#E5E0D8' : boss ? '#FFC800' : p.bright
  const shadow = locked ? '#CFC7BA' : boss ? '#E0A800' : p.shadow
  const n = STATION_N.get(topic.id)
  const nodeLabel = boss ? `Boss ${BOSS_N.get(topic.id)}` : n ? `Lesson ${n}` : topicLabel(topic.id)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus() }
      } else if (!ref.current?.contains(e.target as Node) && !popRef.current?.contains(e.target as Node)) setOpen(false)
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
    <li ref={ref} id={`station-anchor-${topic.id}`} className={`relative scroll-mt-32 ${current ? 'mt-7' : ''}`} style={{ transform: `translateX(${offset}px)` }}>
      {current && !open && (
        <span className="pointer-events-none absolute bottom-[calc(100%+14px)] left-1/2 -translate-x-1/2" aria-hidden>
          <span className="bubble-bob block">
            <span className="bubble" style={{ color: p.deep }}>Start</span>
          </span>
        </span>
      )}
      <button
        ref={btnRef}
        type="button"
        data-testid={boss ? `boss-node-${topic.id}` : `station-${topic.id}`}
        data-status={status}
        aria-label={`${nodeLabel}: ${topic.title}, ${STATUS_WORD[status]}`}
        aria-expanded={open}
        className={`station path-node ${boss ? 'path-node-boss' : ''}`}
        style={{ background: fill, boxShadow: `0 7px 0 ${shadow}${current ? `, 0 0 0 8px ${p.soft}` : ''}` }}
        onClick={() => setOpen(true)}
      >
        {icon}
      </button>
      <span className={`pointer-events-none absolute top-1/2 w-[7rem] sm:w-[8.25rem] -translate-y-1/2 text-[0.8125rem] font-extrabold leading-tight ${labelSide} ${locked ? 'text-dim' : 'text-chalk'}`}>
        {topic.title}
      </span>
      {open && createPortal(
        <div
          ref={popRef}
          data-testid="node-popover"
          data-placement={pos.placement}
          className="fixed z-50 w-[min(290px,86vw)] rounded-2xl p-4 text-white"
          style={{ left: pos.left, top: pos.top, visibility: pos.ready ? 'visible' : 'hidden', opacity: 1, background: locked ? '#5B6472' : boss ? '#8A5A00' : p.deep, boxShadow: `0 5px 0 ${locked ? '#3f4652' : boss ? '#5c3c00' : p.shadow}, 0 12px 28px rgba(0,0,0,0.18)` }}
          role="dialog"
          aria-label={topic.title}
          tabIndex={-1}
          onKeyDown={onPopKey}
        >
          <span aria-hidden className={`absolute h-4 w-4 -translate-x-1/2 rotate-45 ${pos.placement === 'below' ? '-top-2' : '-bottom-2'}`} style={{ left: pos.arrow, background: locked ? '#5B6472' : boss ? '#8A5A00' : p.deep }} />
          <p className="font-display text-lg leading-snug">{topic.title}</p>
          <p className="text-sm font-bold text-white">
            {nodeLabel} · {STATUS_WORD[status]} · about {topicMinutes(topic.id)} min
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
        </div>,
        document.body,
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
  // Returning players (progress on this device or synced from their account) already know the rules
  const returning = useGameStore((s) => Object.values(s.topicProgress).some((t) => t?.completed || (t?.attempts ?? 0) > 0) || Object.keys(s.lessonProgress).length > 0)
  if (!open || returning) return null
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
      <ul className="mt-3 grid gap-3 text-[0.9375rem] sm:grid-cols-2">
        {[
          ['Lessons', 'Each node is a short lesson, then a quiz. Pass to open the next one.', '#58CC02'],
          ['Hearts', 'You get 3 per quiz. A wrong answer costs one; blank answers never do.', '#FF4B4B'],
          ['Review', 'Cleared topics come back as flashcards on a schedule, so they stick.', '#1CB0F6'],
          ['Bosses', `A practice track that runs alongside the units: it opens after Unit 1 and you can switch between bosses and lessons at any time. ${arenaTopics.length} full design problems, each scored stage by stage (requirements, estimates, design on a canvas, deep dive).`, '#FFC800'],
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

function Curriculum({ statusMap, needle, fund, areas }: { statusMap: Map<number, Status>; needle: string; fund?: boolean; areas: typeof fundamentalRegions }) {
  const groups = fund ? areas : [...learningRegions, ...regions.filter((r) => r.id === 'boss-arena')]
  return (
    <section aria-labelledby="curriculum-title">
      <h2 id="curriculum-title" className="font-display text-2xl text-chalk mb-3">{fund ? 'All topics' : 'All lessons and bosses'}</h2>
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
                  <p className="text-xs font-extrabold uppercase tracking-wider text-white">{r.id === 'boss-arena' ? 'Practice track' : fund ? r.subtitle : `Unit ${i + 1}`}</p>
                  <h3 className="font-display text-lg leading-tight">{r.id === 'boss-arena' ? 'Boss fights' : r.name}</h3>
                </div>
                <span className="text-sm font-extrabold tabular-nums">{done}/{all.length}</span>
              </div>
              <ol className="p-2">
                {topics.map((t) => {
                  const st = statusMap.get(t.id) ?? 'locked'
                  const body = (
                    <>
                      <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold" style={{ background: st === 'locked' ? '#EEE9E1' : p.soft, color: st === 'locked' ? '#5B6472' : p.deep }}>
                        {STATION_N.get(t.id) ?? FUND_N.get(t.id) ?? (BOSS_N.has(t.id) ? `B${BOSS_N.get(t.id)}` : '★')}
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

/** Fixed-position popover anchored to a map node: kept inside the viewport, flipped above the node when there is no room below. */
function usePopoverPosition(open: boolean, anchor: React.RefObject<HTMLElement | null>, pop: React.RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState({ left: 0, top: 0, arrow: 0, placement: 'below' as 'below' | 'above', ready: false })
  useLayoutEffect(() => {
    if (!open) { setPos((p) => ({ ...p, ready: false })); return }
    const GAP = 16, MARGIN = 8
    const place = () => {
      const a = anchor.current, el = pop.current
      if (!a || !el) return
      const r = a.getBoundingClientRect()
      const vw = document.documentElement.clientWidth, vh = window.innerHeight
      const w = el.offsetWidth, h = el.offsetHeight
      const cx = r.left + r.width / 2
      const left = Math.min(Math.max(cx - w / 2, MARGIN), Math.max(MARGIN, vw - w - MARGIN))
      const below = r.bottom + GAP + h + MARGIN <= vh || r.top - GAP - h < MARGIN
      const top = below ? r.bottom + GAP : r.top - GAP - h
      const arrow = Math.min(Math.max(cx - left, 18), w - 18)
      setPos({ left, top, arrow, placement: below ? 'below' : 'above', ready: true })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place) }
  }, [open, anchor, pop])
  return pos
}
