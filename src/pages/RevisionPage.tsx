import { useMemo, useState } from 'react'
import { allTopics } from '../content/catalog'
import { isDue, scheduleNext, initialSrs } from '../lib/srs/scheduler'
import { useGameStore } from '../stores/gameStore'

export function RevisionPage() {
  const srs = useGameStore((s) => s.srs)
  const rateFlashcard = useGameStore((s) => s.rateFlashcard)
  const [filter, setFilter] = useState<string>('all')
  const [flipped, setFlipped] = useState(false)

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
    setFlipped(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-violet-200">SRS Revision</h1>
      <p className="text-slate-400 text-sm">Flipping alone doesn&apos;t count — choose Again/Hard/Good/Easy to schedule the next review.</p>
      <select className="bg-slate-800 border border-slate-600 rounded px-2 py-1" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All regions</option>
        {[...new Set(allTopics.map((t) => t.region))].map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      {!current ? (
        <p className="text-slate-500">Queue empty for this filter — great job.</p>
      ) : (
        <div className="card-glow rounded-2xl p-6 max-w-xl">
          <button type="button" className="w-full text-left" onClick={() => setFlipped((f) => !f)}>
            <p className="text-sm text-slate-500">Topic {current.topicId}</p>
            <p className="text-xl mt-2">{flipped ? current.flashcard.back : current.flashcard.front}</p>
          </button>
          <div className="flex flex-wrap gap-2 mt-4">
            {(['again', 'hard', 'good', 'easy'] as const).map((r) => (
              <button key={r} type="button" onClick={() => rate(r)} className="px-3 py-1 rounded border border-slate-600 capitalize">
                {r}
              </button>
            ))}
          </div>
          {current.state && (
            <p className="text-xs text-slate-500 mt-3">Next due after rating: scheduled via SM-2-lite deterministic rules.</p>
          )}
        </div>
      )}
    </div>
  )
}
