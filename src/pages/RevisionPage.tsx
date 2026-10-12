import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { allTopics, regions, topicsById } from '../content/catalog'
import { transitLineColor } from '../lib/design/transitTheme'
import { isDue, scheduleNext, initialSrs } from '../lib/srs/scheduler'
import { useGameStore } from '../stores/gameStore'

export function RevisionPage() {
  const srs = useGameStore((s) => s.srs)
  const rateFlashcard = useGameStore((s) => s.rateFlashcard)
  const [filter, setFilter] = useState<string>('all')
  const [flipped, setFlipped] = useState(false)
  const [last, setLast] = useState<{ front: string; rating: string; dueAt: string } | null>(null)

  const queue = useMemo(() => {
    const cards = allTopics.flatMap((t) =>
      t.flashcards.map((f) => ({
        topicId: t.id,
        region: t.region,
        flashcard: f,
        state: srs.find((s) => s.topicId === t.id && s.flashcardId === f.id),
      })),
    )
    return cards
      .filter((c) => filter === 'all' || c.region === filter)
      .filter((c) => !c.state || isDue(c.state.dueAt))
  }, [srs, filter])

  const current = queue[0]

  const rate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!current) return
    rateFlashcard(current.topicId, current.flashcard.id, rating)
    const base = current.state ?? { ...initialSrs(), topicId: current.topicId, flashcardId: current.flashcard.id, history: [] }
    const next = scheduleNext({ ease: base.ease, intervalDays: base.intervalDays, dueAt: base.dueAt }, rating)
    useGameStore.setState((s) => {
      const others = s.srs.filter((x) => !(x.topicId === current.topicId && x.flashcardId === current.flashcard.id))
      return {
        srs: [
          ...others,
          {
            topicId: current.topicId,
            flashcardId: current.flashcard.id,
            ease: next.ease,
            intervalDays: next.intervalDays,
            dueAt: next.dueAt,
            history: [...(base.history ?? []), { at: new Date().toISOString(), rating }],
          },
        ],
      }
    })
    setLast({ front: current.flashcard.front, rating, dueAt: next.dueAt })
    setFlipped(false)
  }

  const RATINGS = [
    { r: 'again', label: 'Again', hint: 'Forgot it' },
    { r: 'hard', label: 'Hard', hint: 'Got it slowly' },
    { r: 'good', label: 'Good', hint: 'Recalled it' },
    { r: 'easy', label: 'Easy', hint: 'Instant' },
  ] as const

  const accent = current ? transitLineColor(current.region) : 'var(--color-amber)'

  return (
    <div className="space-y-5 max-w-2xl">
      <header className="border-b border-[var(--color-rail)] pb-4">
        <p className="text-sm font-semibold text-[var(--color-amber)]">Spaced repetition</p>
        <h1 className="font-display text-4xl font-extrabold text-chalk mt-1">Review</h1>
        <p className="text-[15px] text-dim mt-2">
          Recall the answer, reveal it, then rate yourself. The rating decides when the card comes back.
        </p>
      </header>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm text-dim">
          Line
          <select className="field mt-1 block min-w-[240px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All lines</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.subtitle}</option>
            ))}
          </select>
        </label>
        <p className="text-sm text-dim tabular-nums">
          <span className="font-display text-xl font-bold text-chalk">{queue.length}</span> due now
        </p>
      </div>
      {last && (
        <p className="text-sm text-dim" role="status">
          Next due {new Date(last.dueAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} for the card you rated {last.rating}.
        </p>
      )}
      {!current ? (
        <div className="panel p-6 text-center">
          <p className="font-display text-xl font-bold text-chalk">Queue empty</p>
          <p className="text-sm text-dim mt-1">Nothing is due on this line. Clear more stations to add cards, or come back tomorrow.</p>
          <Link to="/" className="btn-quiet mt-4">Back to map</Link>
        </div>
      ) : (
        <div className="panel-slab panel-slab-accent p-6" style={{ ['--accent' as string]: accent }}>
          <p className="text-sm font-semibold" style={{ color: accent }}>
            Topic {current.topicId} · {topicsById.get(current.topicId)?.title}
          </p>
          <p className="font-display text-2xl font-semibold text-chalk mt-3 leading-snug">{current.flashcard.front}</p>
          {flipped ? (
            <p className="mt-4 border-t border-[var(--color-rail)] pt-4 text-[17px] text-[#d6d0c2] leading-relaxed">{current.flashcard.back}</p>
          ) : (
            <button type="button" className="btn-quiet mt-5" onClick={() => setFlipped(true)}>
              Show answer
            </button>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6" role="group" aria-label="Rate your recall">
            {RATINGS.map(({ r, label, hint }) => (
              <button key={r} type="button" onClick={() => rate(r)} className={`rate-btn rate-${r}`}>
                <span className="font-display font-semibold">{label}</span>
                <span className="block text-xs text-dim">{hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
