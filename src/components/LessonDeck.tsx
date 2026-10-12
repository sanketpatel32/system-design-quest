import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { LessonCard } from '../content/types'

/** Some imported cards carry their kind ('text', 'diagram') as a placeholder title; don't render those. */
function hasRealTitle(card: LessonCard) {
  const t = card.title.trim().toLowerCase()
  return t.length > 0 && t !== card.kind && t !== 'text' && t !== 'diagram' && t !== 'animation'
}

export function LessonDeck({
  cards,
  accent = 'var(--color-amber)',
  finalAction,
}: {
  cards: LessonCard[]
  accent?: string
  /** Rendered instead of the Next button on the last card */
  finalAction?: ReactNode
}) {
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
          <span className="text-xs text-dim tabular-nums" aria-live="polite">
            Card {index + 1} of {cards.length}
          </span>
          {card.accent && (
            <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ color: accent, background: `${accent}1f` }}>
              {card.accent}
            </span>
          )}
        </div>
        <div className="flex gap-1 mb-4">
          {cards.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to card ${i + 1}`}
              aria-current={i === index ? 'step' : undefined}
              onClick={() => setIndex(i)}
              className="h-1.5 flex-1 rounded-full transition-colors duration-200"
              style={{ background: i <= index ? accent : 'var(--color-rail)' }}
            />
          ))}
        </div>
        {hasRealTitle(card) && <h3 className="font-display text-2xl font-bold text-chalk mb-3">{card.title}</h3>}
        <p className="text-chalk leading-relaxed text-[17px] max-w-[62ch]">{card.body}</p>
        {card.steps && card.steps.length > 0 && (
          <ol className="flow mt-5" aria-label="Request flow">
            {card.steps.map((step, i) => (
              <li key={step} className="flow-step">
                <span className="flow-dot tabular-nums" style={{ borderColor: accent }} aria-hidden>{i + 1}</span>
                <span className="text-chalk text-[15px]">{step}</span>
              </li>
            ))}
          </ol>
        )}
        {card.diagram && (
          <div className="mt-4 rounded-2xl border border-[var(--color-rail)] bg-[#f7f5f0] p-3 overflow-x-auto" dangerouslySetInnerHTML={{ __html: card.diagram }} />
        )}
        {card.kind === 'animation' && (
          <div className="mt-4 h-1 bg-[var(--color-rail)] rounded-full overflow-hidden" aria-hidden>
            <div className="h-full w-1/3 rounded-full bg-[var(--color-amber)] animate-[slide_1.8s_ease-in-out_infinite]" style={{ animationName: 'slide' }} />
          </div>
        )}
        <div className="flex gap-2 mt-6">
          <button type="button" onClick={prev} disabled={index === 0} className="btn-quiet disabled:opacity-30">
            Prev
          </button>
          {index === cards.length - 1 && finalAction ? (
            finalAction
          ) : (
            <button type="button" onClick={next} disabled={index === cards.length - 1} className="btn-cta disabled:opacity-30">
              Next card
            </button>
          )}
        </div>
        <p className="text-xs text-dim mt-3">Tip: use the arrow keys to move between cards.</p>
      </div>
    </div>
  )
}
