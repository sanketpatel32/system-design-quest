import { useMemo, useState } from 'react'
import { PageHero } from '../components/ui/PageHero'
import { Mascot } from '../components/art/Mascot'
import { Link } from 'react-router-dom'
import { allTopics, regions, topicsById } from '../content/catalog'
import { transitLineColor } from '../lib/design/transitTheme'
import { isDue, scheduleNext, initialSrs } from '../lib/srs/scheduler'
import { useGameStore } from '../stores/gameStore'

export function RevisionPage() {
  const srs = useGameStore((s) => s.srs)
  const unlocked = useGameStore((s) => s.unlockedTopicIds)
  const topicProgress = useGameStore((s) => s.topicProgress)
  const [reviewed, setReviewed] = useState(0)
  const rateFlashcard = useGameStore((s) => s.rateFlashcard)
  const [filter, setFilter] = useState<string>('all')
  const [flipped, setFlipped] = useState(false)
  const [last, setLast] = useState<{ front: string; rating: string; dueAt: string } | null>(null)

  const queue = useMemo(() => {
    const studied = allTopics.filter((t) => unlocked.includes(t.id) || topicProgress[t.id]?.completed)
    const cards = studied.flatMap((t) =>
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
  }, [srs, filter, unlocked, topicProgress])

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
    setReviewed((n) => n + 1)
  }

  const intervalFor = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!current) return ''
    const base = current.state ?? { ...initialSrs(), topicId: current.topicId, flashcardId: current.flashcard.id, history: [] }
    const next = scheduleNext({ ease: base.ease, intervalDays: base.intervalDays, dueAt: base.dueAt }, rating)
    const days = Math.round((new Date(next.dueAt).getTime() - Date.now()) / 86_400_000)
    return days < 1 ? 'today' : days === 1 ? 'in 1 day' : `in ${days} days`
  }

  const RATINGS = [
    { r: 'again', label: 'Again', hint: 'Forgot it' },
    { r: 'hard', label: 'Hard', hint: 'Got it slowly' },
    { r: 'good', label: 'Good', hint: 'Recalled it' },
    { r: 'easy', label: 'Easy', hint: 'Instant' },
  ] as const

  const accent = current ? transitLineColor(current.region) : 'var(--color-amber)'

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHero eyebrow="Spaced repetition" title="Review" icon="review" tone="sky"
        aside={<div className="rounded-2xl bg-white px-4 py-2 text-center"><p className="font-display text-3xl text-[#12749f] tabular-nums">{queue.length}</p><p className="text-xs font-extrabold uppercase tracking-wide text-dim">due now</p></div>}>
        Recall the answer, reveal it, then rate yourself. The rating decides when the card comes back.
      </PageHero>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm font-extrabold text-dim">
          Unit
          <select className="field mt-1 block min-w-[240px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All units</option>
            {regions.filter((r) => r.id !== 'boss-arena').map((r) => (
              <option key={r.id} value={r.id}>{r.subtitle}</option>
            ))}
          </select>
        </label>
        {reviewed > 0 && <p className="text-sm font-extrabold text-[var(--color-hero-deep)] tabular-nums">{reviewed} reviewed this session</p>}
      </div>
      {last && (
        <p className="rounded-2xl bg-[#d7ffb8] px-4 py-2 text-sm font-bold text-[#235c00]" role="status">
          Next due {new Date(last.dueAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} for the card you rated {last.rating}.
        </p>
      )}
      {!current ? (
        <div className="panel p-8 text-center">
          <Mascot mood="happy" size={120} className="mx-auto" />
          <p className="font-display text-2xl text-chalk mt-2">Queue empty</p>
          <p className="font-bold text-dim mt-1">Cards from stations you have opened appear here. Rated cards come back on their scheduled day.</p>
          <Link to="/" className="btn-quiet mt-4">Back to map</Link>
        </div>
      ) : (
        <div className="panel p-6 sm:p-8 text-center" style={{ ['--accent' as string]: accent }}>
          <p className="text-sm font-extrabold uppercase tracking-wide" style={{ color: accent }}>
            {topicsById.get(current.topicId)?.title}
          </p>
          <p className="font-display text-3xl text-chalk mt-4 leading-snug">{current.flashcard.front}</p>
          {flipped ? (
            <p className="anim-pop mt-5 rounded-2xl bg-[var(--color-sky)] p-5 text-[1.125rem] font-bold text-chalk leading-relaxed">{current.flashcard.back}</p>
          ) : (
            <button type="button" className="btn-sky mt-6 w-full sm:w-auto sm:min-w-[240px]" onClick={() => setFlipped(true)}>
              Show answer
            </button>
          )}
          {flipped && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6" role="group" aria-label="Rate your recall">
            {RATINGS.map(({ r, label, hint }) => (
              <button key={r} type="button" onClick={() => rate(r)} className={`rate-btn rate-${r}`}>
                <span className="font-display text-lg">{label}</span>
                <span className="block text-sm text-dim">{hint}</span>
                <span className="block text-xs font-extrabold uppercase tracking-wide text-chalk mt-1">Next: {intervalFor(r)}</span>
              </button>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  )
}
