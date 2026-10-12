import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { orderedTopicsInRegion, regions, topicsById } from '../../content/catalog'
import type { RegionId } from '../../content/types'
import { transitLineColor } from '../../lib/design/transitTheme'
import { getUnlockHint, topicStatus } from '../../lib/progression/unlocks'
import { useGameStore } from '../../stores/gameStore'

const learningRegions = regions.filter((r) => r.id !== 'boss-arena')
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
      stops.push({ id, x, y, regionId: r.id })
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
      aria-label={`Topic ${stop.id}: ${topicsById.get(stop.id)?.title ?? ''}, ${STATUS_WORD[status]}`}
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
        {stop.id}
      </text>
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
  const arenaOpen = unlocked.includes(74) || completed.has(74)

  const doneCount = learningRegions.reduce(
    (acc, r) => acc + orderedTopicsInRegion(r.id).filter((t) => completed.has(t.id)).length,
    0,
  )
  const total = learningRegions.reduce((acc, r) => acc + orderedTopicsInRegion(r.id).length, 0)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-labelledby="map-title" className="min-w-0">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 id="map-title" className="font-display text-3xl font-extrabold md:text-4xl text-chalk">
              The network
            </h1>
            <p className="text-dim text-[15px] mt-1">Ten lines, one per region. Ride each line in order to open the next.</p>
          </div>
          <p className="text-sm tabular-nums">
            <span className="font-display text-xl font-bold text-chalk">{doneCount}</span>
            <span className="text-dim"> / {total} stations cleared</span>
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
                  <text
                    x={i % 2 === 0 ? L - 10 : R + 10}
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
          Filled stations are cleared. A ring means you can enter; the pulsing ring is your next stop.
        </p>
      </section>

      <aside className="flex flex-col gap-4" aria-label="Station details">
        <div
          className="panel relative overflow-hidden p-5 border-l-[6px]"
          style={{ borderLeftColor: lineColor }}
          data-testid="station-panel"
        >
          <p className="text-sm" style={{ color: lineColor }}>
            {selectedRegion.subtitle}, station {selectedTopic.id}
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight text-chalk" data-testid="topic-title">
            {selectedTopic.title}
          </h2>
          <p className="mt-2 text-dim text-sm">{selectedTopic.objectives?.[0]}</p>
          {st === 'locked' && (
            <p className="mt-3 text-sm text-fault">{getUnlockHint(selectedTopic.id, completed)}</p>
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
          <ol className="mt-3 max-h-[320px] overflow-y-auto pr-1 space-y-0.5 boss-list">
            {arenaTopics.map((t) => {
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
                      <span className="text-dim tabular-nums w-7">{t.id}</span>
                      <span className="text-chalk truncate">{t.title}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2.5 px-2 py-1.5 text-sm" title="Clear the previous boss to unlock">
                      <BossDot status={bst} />
                      <span className="tabular-nums w-7 text-[#5F7790]">{t.id}</span>
                      <span className="truncate text-[#7A8DA2]">{t.title}</span>
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
