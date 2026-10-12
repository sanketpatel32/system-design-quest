import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderedTopicsInRegion, regions } from '../../content/catalog'
import { regionPathOrder, regionThemes, themeForRegion } from '../../lib/design/regionTheme'
import { getUnlockHint, topicStatus } from '../../lib/progression/unlocks'
import { useGameStore } from '../../stores/gameStore'
import { RegionGlyph } from '../icons/RegionGlyph'

function buildPathD(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  const first = points[0]!
  const rest = points.slice(1)
  return `M ${first.x} ${first.y} ${rest.map((p) => `L ${p.x} ${p.y}`).join(' ')}`
}

export function WorldMapScene() {
  const [selectedId, setSelectedId] = useState(regionThemes[0]!.id)
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

  const selectedRegion = regions.find((r) => r.id === selectedId) ?? regions[0]!
  const theme = themeForRegion(selectedRegion.id)
  const topics = orderedTopicsInRegion(selectedRegion.id)
  const cleared = topics.filter((t) => completed.has(t.id)).length

  const pathPoints = regionThemes.map((t) => ({ x: t.mapX, y: t.mapY }))
  const pathD = buildPathD(pathPoints)

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.55fr)] gap-5 items-start">
      <header className="lg:col-span-2 mb-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)] mb-1">India-scale interview quest</p>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#f4f5f6] max-w-xl leading-tight">
          Chart the path from HTTP to hot-path bosses.
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)] max-w-lg">
          Regions unlock in order. Boss Colosseum opens after Launchpad. Interview mode is always on the nav rail.
        </p>
      </header>

      <div className="panel-slab p-2 sm:p-3 relative overflow-hidden min-h-[420px]">
        <svg viewBox="0 0 980 560" className="w-full h-auto block" role="img" aria-label="World map of learning regions">
          <defs>
            <linearGradient id="pathGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.35" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="980" height="560" fill="#080b0f" />
          <path d="M0 420 Q240 380 480 400 T980 360" fill="none" stroke="#1a2028" strokeWidth="48" />
          <path d="M0 180 Q320 220 520 160 T980 200" fill="none" stroke="#14181f" strokeWidth="28" />
          <path
            d={pathD}
            fill="none"
            stroke="url(#pathGrad)"
            strokeWidth="4"
            strokeDasharray="10 8"
            className="map-path-glow"
            style={{ color: '#2dd4bf' }}
            filter="url(#glow)"
          />
          {regionThemes.map((rt) => {
            const reg = regions.find((r) => r.id === rt.id)
            const tTopics = reg ? orderedTopicsInRegion(reg.id) : []
            const prog = tTopics.length ? tTopics.filter((t) => completed.has(t.id)).length / tTopics.length : 0
            const active = rt.id === selectedId
            return (
              <g
                key={rt.id}
                className={`map-region ${active ? 'map-region-selected' : ''}`}
                style={{ ['--region-glow' as string]: rt.accent }}
                onClick={() => setSelectedId(rt.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedId(rt.id)}
                role="button"
                tabIndex={0}
                aria-label={`${rt.label}, ${Math.round(prog * 100)}% cleared`}
              >
                <circle
                  className="region-ring"
                  cx={rt.mapX}
                  cy={rt.mapY}
                  r={active ? 34 : 28}
                  fill="#0c1016"
                  stroke={rt.accent}
                  strokeWidth={active ? 3 : 2}
                />
                <circle cx={rt.mapX} cy={rt.mapY} r={22} fill={rt.accentMuted} opacity="0.45" />
                <foreignObject x={rt.mapX - 14} y={rt.mapY - 14} width="28" height="28">
                  <div className="flex items-center justify-center w-full h-full">
                    <RegionGlyph id={rt.glyph} color={rt.accent} size={26} />
                  </div>
                </foreignObject>
                <text
                  x={rt.mapX}
                  y={rt.mapY + 46}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="IBM Plex Sans, sans-serif"
                  fontWeight="600"
                >
                  {rt.label.split(' ')[0]}
                </text>
              </g>
            )
          })}
        </svg>
        <div className="absolute bottom-2 left-2 text-[10px] text-[var(--color-muted)] uppercase tracking-widest">
          Tap a node · path glows with progress
        </div>
      </div>

      <aside
        className="panel-slab panel-slab-accent lg:sticky lg:top-24"
        style={{ ['--accent' as string]: theme.accent }}
      >
        <div className="p-4 border-b border-[var(--color-line)] flex gap-3 items-start">
          <RegionGlyph id={theme.glyph} color={theme.accent} size={32} />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold leading-snug">{selectedRegion.name}</h2>
            <p className="text-xs text-[var(--color-muted)]">{selectedRegion.subtitle}</p>
            <p className="text-[11px] mt-1 tabular-nums text-[var(--color-teal)]">
              {cleared}/{topics.length} cleared
            </p>
          </div>
        </div>
        <ol className="p-3 space-y-1 max-h-[min(52vh,480px)] overflow-y-auto">
          {topics.map((topic, idx) => {
            const inProgress = Boolean(quizAttempts[`topic-${topic.id}`] && !topicProgress[topic.id]?.completed)
            const status = topicStatus(topic, unlocked, completed, inProgress)
            const locked = status === 'locked'
            const accent = theme.accent
            return (
              <li key={topic.id} className="topic-rail-item" style={{ ['--accent' as string]: accent }}>
                {locked ? (
                  <div className="py-2 pr-2 text-xs text-[var(--color-muted)]">
                    <span className="font-mono text-[10px] text-[#4b5563] mr-2">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="line-through opacity-60">{topic.title}</span>
                    <p className="mt-1 text-[10px] leading-snug opacity-80">{getUnlockHint(topic.id, completed)}</p>
                  </div>
                ) : (
                  <Link
                    to={`/topic/${topic.slug}`}
                    className="block py-2 pr-2 text-sm text-[#d1d5db] hover:text-white"
                  >
                    <span className="font-mono text-[10px] mr-2" style={{ color: accent }}>
                      {String(topic.id).padStart(3, '0')}
                    </span>
                    {status === 'completed' && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-teal)] mr-1.5 align-middle" />
                    )}
                    {status === 'in_progress' && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-amber)] mr-1.5 animate-pulse align-middle" />
                    )}
                    {topic.title}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
        <div className="p-3 border-t border-[var(--color-line)] text-[10px] text-[var(--color-muted)]">
          Next region:{' '}
          {regionPathOrder[regionPathOrder.indexOf(selectedId) + 1]
            ? themeForRegion(regionPathOrder[regionPathOrder.indexOf(selectedId) + 1] as typeof selectedId).label
            : 'Summit complete'}
        </div>
      </aside>
    </div>
  )
}
