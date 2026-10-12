import { useCallback, useEffect, useState } from 'react'
import type { LessonCard } from '../content/types'

export function LessonDeck({ cards }: { cards: LessonCard[] }) {
  const [index, setIndex] = useState(0)
  const card = cards[index]

  const next = useCallback(() => setIndex((i) => Math.min(cards.length - 1, i + 1)), [cards.length])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  if (!card) return <p>No lesson cards.</p>

  return (
    <div className="card-glow rounded-2xl bg-[#121a2f] p-6">
      <div className="flex justify-between text-sm text-slate-400 mb-4">
        <span>Card {index + 1} / {cards.length}</span>
        <span className="hand-accent text-xs">{card.accent}</span>
      </div>
      <h3 className="text-xl font-semibold text-cyan-200 mb-3">{card.title}</h3>
      <p className="text-slate-300 leading-relaxed">{card.body}</p>
      {card.diagram && (
        <div className="mt-4 rounded-lg bg-slate-900/60 p-3 overflow-auto" dangerouslySetInnerHTML={{ __html: card.diagram }} />
      )}
      {card.kind === 'animation' && (
        <div className="mt-4 h-2 rounded bg-gradient-to-r from-cyan-500 via-violet-500 to-lime-400 animate-pulse" aria-hidden />
      )}
      <div className="flex gap-3 mt-6">
        <button type="button" onClick={prev} disabled={index === 0} className="px-4 py-2 rounded-lg border border-slate-600 disabled:opacity-40">
          ← Prev
        </button>
        <button type="button" onClick={next} disabled={index === cards.length - 1} className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/50 disabled:opacity-40">
          Next →
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-3">Swipe with buttons or use ← / → keys</p>
    </div>
  )
}
