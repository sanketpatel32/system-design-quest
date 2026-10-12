import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { orderedTopicsInRegion, regions, topicsById } from '../../content/catalog'
import type { RegionId } from '../../content/types'
import { transitLineColor } from '../../lib/design/transitTheme'
import { RegionMotif } from './RegionMotif'
import { getUnlockHint, topicStatus } from '../../lib/progression/unlocks'
import { useGameStore } from '../../stores/gameStore'

const learningRegions = regions.filter((r) => r.id !== 'boss-arena')
/** Minutes: ~1 per lesson card, ~1.5 per question */
export function topicMinutes(id: number) {
  const t = topicsById.get(id)
  return t ? Math.max(5, Math.round(t.cards.length + t.questions.length * 1.5)) : 5
}
const arenaTopics = orderedTopicsInRegion('boss-arena')
const W = 1000
const TOP = 120
const GAP = 104
const L = 70
const R = 900

interface Stop {
  id: number
  x: number
  y: number
  regionId: string
  /** Position in the learner's journey, 1-based */
  n: number
}

function layoutStops(): Stop[] {
  const stops: Stop[] = []
  learningRegions.forEach((r, i) => {
    const y0 = TOP + i * GAP
    const ids = orderedTopicsInRegion(r.id).map((t) => t.id)
    const n = ids.length
    const ltr = i % 2 === 0
    ids.forEach((id, j) => {
      const f = n === 1 ? 0 : j / (n - 1)
      const x = ltr ? L + f * (R - L) : R - f * (R - L)
      const y = y0 + (f > 0.5 ? 30 : 0)
      stops.push({ id, x, y, regionId: r.id, n: stops.length + 1 })
    })
  })
  return stops
}

const STOPS = layoutStops()
const H = TOP + learningRegions.length * GAP + 40

function linePath(regionId: string) {
  const pts = STOPS.filter((s) => s.regionId === regionId)
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
}

function connector(i: number) {
  const a = STOPS.filter((s) => s.regionId === learningRegions[i]!.id).at(-1)!
  const b = STOPS.filter((s) => s.regionId === learningRegions[i + 1]!.id)[0]!
  const side = i % 2 === 0 ? 1 : -1
  const cx = a.x + side * 55
  return `M${a.x},${a.y} C${cx},${a.y} ${cx},${b.y} ${b.x},${b.y}`
}

type Status = ReturnType<typeof topicStatus>

const STATUS_WORD: Record<Status, string> = {
  locked: 'locked',
  available: 'open',
  in_progress: 'in progress',
  completed: 'cleared',
}

function StationDot({
  stop,
  status,
  pulse,
  selected,
  color,
  onSelect,
}: {
  stop: Stop
  status: Status
  pulse: boolean
  selected: boolean
  color: string
  onSelect: () => void
}) {
  const { x, y } = stop
  return (
    <g
      role="button"
      tabIndex={0}
      data-testid={`station-${stop.id}`}
      data-status={status}
      aria-label={`Station ${stop.n}: ${topicsById.get(stop.id)?.title ?? ''}, ${STATUS_WORD[status]}`}
      aria-pressed={selected}
      className="station cursor-pointer"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <circle className="station-focus" cx={x} cy={y} r={19} fill="none" stroke="#F2B33D" strokeWidth={3} />
      {pulse && (
        <circle
          cx={x}
          cy={y}
          r={9}
          fill="none"
          stroke={color}
          strokeWidth={2}
          className="motion-safe:animate-[pulsering_1.8s_ease-out_infinite]"
        />
      )}
      <circle
        cx={x}
        cy={y}
        r={selected ? 13 : 10}
        fill={status === 'completed' ? color : '#0D1B2A'}
        stroke={status === 'locked' ? '#2A4562' : status === 'completed' ? '#EDE6D6' : color}
        strokeWidth={status === 'locked' ? 2 : 3.5}
      />
      {status === 'in_progress' && <circle cx={x} cy={y} r={4} fill={color} />}
      <text
        x={x}
        y={y - 19}
        textAnchor="middle"
        className="font-display"
        fontSize={13}
        fontWeight={600}
        fill={status === 'locked' ? '#5F7790' : '#EDE6D6'}
      >
        {stop.n}
      </text>
      <title>{topicsById.get(stop.id)?.title}</title>
      {(selected || pulse) && (
        <text x={x} y={y + 30} textAnchor="middle" fontSize={12} fill="#EDE6D6" className="pointer-events-none">
          {topicsById.get(stop.id)?.title}
        </text>
      )}
    </g>
  )
}

export function WorldMapScene() {
  const nav = useNavigate()
  const unlocked = useGameStore((s) => s.unlockedTopicIds)
  const topicProgress = useGameStore((s) => s.topicProgress)
  const quizAttempts = useGameStore((s) => s.quizAttempts)

  const completed = useMemo(
    () =>
      new Set(
        Object.entries(topicProgress)
          .filter(([, v]) => v.completed)
          .map(([id]) => Number(id)),
      ),
    [topicProgress],
  )

  const statusMap = useMemo(() => {
    const m = new Map<number, Status>()
    for (const s of STOPS) {
      const inProgress = Boolean(quizAttempts[`topic-${s.id}`] && !topicProgress[s.id]?.completed)
      const topic = topicsById.get(s.id)
      if (topic) m.set(s.id, topicStatus(topic, unlocked, completed, inProgress))
    }
    return m
  }, [unlocked, completed, quizAttempts, topicProgress])

  const nextId = STOPS.find((s) => {
    const st = statusMap.get(s.id)
    return st === 'available' || st === 'in_progress'
  })?.id

  const [sel, setSel] = useState<number | null>(null)
  const selectedId = sel ?? nextId ?? 1
  const selectedStop = STOPS.find((s) => s.id === selectedId)!
  const selectedRegion = learningRegions.find((r) => r.id === selectedStop.regionId)!
  const selectedTopic = orderedTopicsInRegion(selectedRegion.id).find((t) => t.id === selectedId)!
  const lineColor = transitLineColor(selectedRegion.id as import('../../content/types').RegionId)
  const st = statusMap.get(selectedId) ?? 'locked'
  const lineStops = orderedTopicsInRegion(selectedRegion.id).map((t) => t.id)
  const arenaOpen = unlocked.includes(74) || completed.has(74)

  const doneCount = learningRegions.reduce(
    (acc, r) => acc + orderedTopicsInRegion(r.id).filter((t) => completed.has(t.id)).length,
    0,
  )
  const total = learningRegions.reduce((acc, r) => acc + orderedTopicsInRegion(r.id).length, 0)
  const bossesDone = arenaTopics.filter((t) => completed.has(t.id)).length
  const nextTopic = nextId ? topicsById.get(nextId) : undefined
  const nextStop = STOPS.find((x) => x.id === nextId)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-labelledby="map-title" className="min-w-0">
        <Onboarding />
        {nextTopic && (
          <div className="panel panel-slab-accent mb-4 flex flex-wrap items-center gap-4 p-4" data-testid="continue-quest">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-amber)]">Continue your quest</p>
              <p className="font-display text-xl font-bold text-chalk truncate">{nextTopic.title}</p>
              <p className="text-sm text-dim">
                Station {nextStop?.n} · {regions.find((r) => r.id === nextTopic.region)?.subtitle} line · about {topicMinutes(nextTopic.id)} min
              </p>
            </div>
            <Link
              to={statusMap.get(nextTopic.id) === 'in_progress' ? `/quiz/${nextTopic.slug}` : `/topic/${nextTopic.slug}`}
              className="btn-cta"
            >
              {statusMap.get(nextTopic.id) === 'in_progress' ? 'Resume quiz' : 'Start lesson'}
            </Link>
          </div>
        )}
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 id="map-title" className="font-display text-3xl font-extrabold md:text-4xl text-chalk">
              The network
            </h1>
            <p className="text-dim text-[15px] mt-1">
              {total} stations on ten lines, ridden in order, then {arenaTopics.length} boss fights in the Colosseum.
            </p>
          </div>
          <p className="text-sm tabular-nums text-right">
            <span className="font-display text-xl font-bold text-chalk">{doneCount + bossesDone}</span>
            <span className="text-dim"> / {total + arenaTopics.length} on your journey</span>
            <span className="block text-xs text-dim">{doneCount} stations · {bossesDone} bosses</span>
          </p>
        </div>
        <div className="panel overflow-x-auto p-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[720px] w-full" role="group" aria-label="World map of learning regions">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0H0V40" fill="none" stroke="#1A3048" strokeWidth="1" />
              </pattern>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width={W} height={H} fill="url(#grid)" />
            <path d={`M${W} 0 C930 180 990 330 925 520 S960 900 ${W} ${H}`} fill="#10314A" opacity=".55" />
            <g>
              <path
                d={`M${STOPS.find((s) => s.id === 7)?.x ?? 200},${STOPS.find((s) => s.id === 7)?.y ?? 200} C960,${TOP} 960,60 880,52`}
                stroke="#FF5A4E"
                strokeWidth={6}
                strokeDasharray={arenaOpen ? '0' : '2 10'}
                strokeLinecap="round"
                fill="none"
                opacity={arenaOpen ? 1 : 0.5}
                filter={arenaOpen ? 'url(#glow)' : undefined}
              />
              <a
                href="/topic/interview-playbook"
                onClick={(e) => {
                  e.preventDefault()
                  nav('/topic/interview-playbook')
                }}
                data-testid="arena-link"
              >
                <rect x={690} y={30} width={190} height={46} rx={23} fill="#0D1B2A" stroke="#FF5A4E" strokeWidth={3} />
                <text x={785} y={50} textAnchor="middle" fontSize={15} fontWeight={800} className="font-display" fill="#EDE6D6">
                  Architecture Colosseum
                </text>
                <text x={785} y={66} textAnchor="middle" fontSize={11} fill={arenaOpen ? '#FF5A4E' : '#8FA0B3'}>
                  {arenaOpen ? 'Boss arena unlocked' : 'Clear Launchpad first'}
                </text>
              </a>
            </g>
            {learningRegions.slice(0, -1).map((r, i) => (
              <path
                key={`c-${r.id}`}
                d={connector(i)}
                stroke={transitLineColor(learningRegions[i + 1]!.id)}
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
                opacity={0.75}
              />
            ))}
            {learningRegions.map((r, i) => {
              const color = transitLineColor(r.id)
              const first = STOPS.find((s) => s.regionId === r.id)!
              return (
                <g key={r.id}>
                  <path
                    d={linePath(r.id)}
                    stroke={color}
                    strokeWidth={8}
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    filter="url(#glow)"
                    opacity={0.95}
                  />
                  <RegionMotif regionId={r.id} color={color} size={24} x={i % 2 === 0 ? L - 10 : R + 10 - 24} y={first.y - 56} />
                  <text
                    x={i % 2 === 0 ? L - 10 + 30 : R + 10 - 30}
                    y={first.y - 38}
                    textAnchor={i % 2 === 0 ? 'start' : 'end'}
                    fontSize={15}
                    fontWeight={800}
                    className="font-display"
                    fill={color}
                  >
                    {r.subtitle}
                    <tspan dx={8} fill="#8FA0B3" fontWeight={400} fontSize={12} className="font-sans">
                      {r.name}
                    </tspan>
                  </text>
                </g>
              )
            })}
            {STOPS.map((s) => (
              <StationDot
                key={s.id}
                stop={s}
                status={statusMap.get(s.id)!}
                pulse={s.id === nextId}
                selected={s.id === selectedId}
                color={transitLineColor(s.regionId as RegionId)}
                onSelect={() => setSel(s.id)}
              />
            ))}
          </svg>
        </div>
        <p className="mt-2 text-sm text-dim">
          Filled stations are cleared: you passed the quiz (70% or better with a heart left). A ring means you can enter;
          the pulsing ring is your next stop. Mastery comes from the Review deck, which brings each topic back until you
          recall it reliably.
        </p>
        <Curriculum statusMap={statusMap} />
      </section>

      <aside className="flex flex-col gap-4" aria-label="Station details">
        <div
          className="panel relative overflow-hidden p-5 border-l-[6px]"
          style={{ borderLeftColor: lineColor }}
          data-testid="station-panel"
        >
          <div className="flex items-center justify-between gap-2 text-sm">
            <p className="font-semibold" style={{ color: lineColor }}>
              {selectedRegion.subtitle} line
            </p>
            <span className={`status-chip status-${st}`}>{STATUS_WORD[st]}</span>
          </div>
          <p className="text-xs text-dim mt-0.5 tabular-nums">
            Station {STOPS.find((x) => x.id === selectedTopic.id)?.n} · stop {lineStops.indexOf(selectedTopic.id) + 1} of {lineStops.length} on this line · about {topicMinutes(selectedTopic.id)} min
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight text-chalk" data-testid="topic-title">
            {selectedTopic.title}
          </h2>
          <p className="mt-2 text-dim text-sm">{selectedTopic.objectives?.[0]}</p>
          {st === 'locked' && (
            <p className="mt-3 text-sm text-chalk flex gap-2 items-start rounded-md bg-[var(--color-ink)] p-2.5">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="mt-0.5 shrink-0">
                <rect x="2" y="6" width="10" height="7" rx="1.5" fill="none" stroke="#8FA0B3" strokeWidth="1.5" />
                <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" fill="none" stroke="#8FA0B3" strokeWidth="1.5" />
              </svg>
              {getUnlockHint(selectedTopic.id, completed)}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {st !== 'locked' && (
              <Link to={`/topic/${selectedTopic.slug}`} className="btn" data-testid="start-topic">
                Open lesson
              </Link>
            )}
            {selectedTopic.kind === 'boss' && st !== 'locked' && (
              <Link to={`/boss/${selectedTopic.slug}`} className="btn-quiet">
                Boss fight
              </Link>
            )}
          </div>
        </div>
        <section className="panel p-4" aria-labelledby="arena-title">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="arena-title" className="font-display text-lg font-bold text-chalk">Architecture Colosseum</h2>
            <span className="text-xs text-dim tabular-nums">
              {arenaTopics.filter((t) => completed.has(t.id)).length} / {arenaTopics.length}
            </span>
          </div>
          <p className="text-sm text-dim mt-1">
            {arenaOpen ? 'Bosses unlock one after another. Start with the playbook.' : 'Clear the Launchpad line to open the arena.'}
          </p>
          <ol className="relative mt-3 space-y-0.5">
            {arenaTopics.map((t, bi) => {
              const bst = topicStatus(t, unlocked, completed, false)
              const open = bst !== 'locked'
              return (
                <li key={t.id}>
                  {open ? (
                    <Link
                      to={`/topic/${t.slug}`}
                      className="flex items-center gap-2.5 rounded px-2 py-1.5 text-sm hover:bg-[var(--color-ink)]"
                      data-testid={`boss-row-${t.id}`}
                    >
                      <BossDot status={bst} />
                      <span className="text-dim tabular-nums w-7">{bi + 1}</span>
                      <span className="text-chalk truncate">{t.title}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2.5 px-2 py-1.5 text-sm" title="Clear the previous boss to unlock">
                      <BossDot status={bst} />
                      <span className="tabular-nums w-7 text-[#8FA0B3]">{bi + 1}</span>
                      <span className="truncate text-[#9AAABB]">{t.title}</span>
                      <span className="sr-only">(locked)</span>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      </aside>
    </div>
  )
}

function BossDot({ status }: { status: Status }) {
  const done = status === 'completed'
  const locked = status === 'locked'
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0">
      <circle
        cx="6"
        cy="6"
        r="4.5"
        fill={done ? '#FF5A4E' : '#0D1B2A'}
        stroke={locked ? '#2A4562' : '#FF5A4E'}
        strokeWidth="2"
      />
    </svg>
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
    <section className="panel mb-4 p-4" aria-labelledby="onboard-title" data-testid="onboarding">
      <div className="flex items-start justify-between gap-3">
        <h2 id="onboard-title" className="font-display text-lg font-bold text-chalk">How DesignQuest works</h2>
        <button type="button" className="btn-quiet" onClick={close}>Got it</button>
      </div>
      <ul className="mt-2 grid gap-2 text-sm text-[#d6d0c2] sm:grid-cols-2">
        <li><span className="font-semibold text-chalk">Lessons</span>: each station is a short lesson, then a quiz. Pass to open the next station.</li>
        <li><span className="font-semibold text-chalk">Hearts</span>: you get 3 per quiz. A wrong answer costs one; blank answers never do.</li>
        <li><span className="font-semibold text-chalk">Review</span>: cleared topics come back as flashcards on a schedule, so they stick.</li>
        <li><span className="font-semibold text-chalk">Bosses</span>: full design problems in the Colosseum, scored stage by stage.</li>
      </ul>
    </section>
  )
}

function Curriculum({ statusMap }: { statusMap: Map<number, Status> }) {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  return (
    <section className="mt-6" aria-labelledby="curriculum-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="curriculum-title" className="font-display text-2xl font-bold text-chalk">All stations</h2>
        <label className="text-sm text-dim">
          Find a topic
          <input
            type="search"
            className="field mt-1 block w-full sm:w-64"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. caching, Kafka"
          />
        </label>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {learningRegions.map((r) => {
          const all = orderedTopicsInRegion(r.id)
          const topics = needle ? all.filter((t) => t.title.toLowerCase().includes(needle)) : all
          if (!topics.length) return null
          const done = all.filter((t) => statusMap.get(t.id) === 'completed').length
          const mins = all.reduce((a, t) => a + topicMinutes(t.id), 0)
          const color = transitLineColor(r.id as RegionId)
          return (
            <div key={r.id} className="panel min-w-0 p-4 border-l-[6px]" style={{ borderLeftColor: color }}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display font-bold flex items-center gap-2" style={{ color }}><RegionMotif regionId={r.id} color={color} size={20} />{r.subtitle} line</h3>
                <span className="text-xs text-dim tabular-nums">{done}/{all.length} cleared · ~{Math.round(mins / 6) / 10} h</span>
              </div>
              <div className="score-track mt-2" aria-hidden>
                <div style={{ width: `${(done / all.length) * 100}%`, background: color, height: '100%' }} />
              </div>
              <ol className="mt-2 space-y-0.5">
                {topics.map((t) => {
                  const st = statusMap.get(t.id) ?? 'locked'
                  const n = STOPS.find((x) => x.id === t.id)?.n
                  const body = (
                    <>
                      <span className="w-6 tabular-nums text-dim">{n}</span>
                      <span className={`flex-1 truncate ${st === 'locked' ? 'text-[#9AAABB]' : 'text-chalk'}`}>{t.title}</span>
                      <span className="text-xs text-dim">{STATUS_WORD[st]}</span>
                    </>
                  )
                  return (
                    <li key={t.id}>
                      {st === 'locked' ? (
                        <div className="flex items-center gap-2 px-2 py-1 text-sm">{body}</div>
                      ) : (
                        <Link to={`/topic/${t.slug}`} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-[var(--color-ink)]">
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
