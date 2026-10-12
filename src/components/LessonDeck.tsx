import { useCallback, useEffect, useState } from 'react'
import type { LessonCard } from '../content/types'

export function LessonDeck({ cards, accent = '#2dd4bf' }: { cards: LessonCard[]; accent?: string }) {
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

  if (!card) return <p className="text-[var(--color-muted)]">No lesson cards.</p>

  return (
    <div className="panel-slab panel-slab-accent" style={{ ['--accent' as string]: accent }}>
      <div className="p-5 sm:p-6">
        <div className="flex justify-between items-baseline gap-4 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
            {index + 1} / {cards.length}
          </span>
          {card.accent && <span className="hand-accent text-xs">{card.accent}</span>}
        </div>
        <div className="flex gap-1 mb-4">
          {cards.map((_, i) => (
            <div
              key={i}
              className="h-0.5 flex-1 transition-colors duration-200"
              style={{ background: i <= index ? accent : '#1e242c' }}
            />
          ))}
        </div>
        <h3 className="font-display text-xl font-bold text-[#f4f5f6] mb-3">{card.title}</h3>
        <p className="text-[#c4c9cf] leading-relaxed text-[15px]">{card.body}</p>
        {card.diagram && (
          <div className="mt-4 border border-[var(--color-line)] bg-[#080b0f] p-3 overflow-auto" dangerouslySetInnerHTML={{ __html: card.diagram }} />
        )}
        {card.kind === 'animation' && (
          <div className="mt-4 h-1 bg-[#1e242c] overflow-hidden" aria-hidden>
            <div className="h-full w-1/3 bg-[var(--color-teal)] animate-[slide_1.8s_ease-in-out_infinite]" style={{ animationName: 'slide' }} />
          </div>
        )}
        <div className="flex gap-2 mt-6">
          <button type="button" onClick={prev} disabled={index === 0} className="btn-quiet disabled:opacity-30">
            Prev
          </button>
          <button type="button" onClick={next} disabled={index === cards.length - 1} className="btn-cta disabled:opacity-30">
            Next card
          </button>
        </div>
        <p className="text-[10px] text-[var(--color-muted)] mt-3 uppercase tracking-wider">← → to flip</p>
      </div>
    </div>
  )
}
