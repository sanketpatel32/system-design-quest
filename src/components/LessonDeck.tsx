import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Interactive, LessonCard } from '../content/types'
import { InteractiveBlock } from './InteractiveBlock'
import { MascotSays } from './art/Mascot'
import { paragraphs } from '../lib/fun/fun'

/** Some imported cards carry their kind ('text', 'diagram') as a placeholder title; don't render those. */
function hasRealTitle(card: LessonCard) {
  const t = card.title.trim().toLowerCase()
  return t.length > 0 && t !== card.kind && t !== 'text' && t !== 'diagram' && t !== 'animation'
}

/** Authored diagrams were drawn for a dark theme; repaint their fills and text for the light one. */
function lightDiagram(svg: string) {
  return svg
    .replace(/#1e293b|#0f172a|#14283d/gi, '#ffffff')
    .replace(/#e2e8f0|#ede6d6|#f8fafc|#cbd5e1/gi, '#29303d')
    .replace(/<rect /g, "<rect rx='10' stroke-width='2.5' ")
}

export function LessonDeck({
  cards: baseCards,
  interactive,
  accent = 'var(--color-amber)',
  finalAction,
  skipAction,
  recap = false,
  initialIndex = 0,
  onIndexChange,
}: {
  cards: LessonCard[]
  accent?: string
  /** Rendered instead of the Next button on the last card */
  finalAction?: ReactNode
  /** Always-available shortcut past the cards (e.g. Skip to quiz); hidden on the last card, where finalAction shows */
  skipAction?: ReactNode
  /** On the last card, list what the lesson covered before the quiz */
  recap?: boolean
  /** Optional experiment or decision, added as the last step before the quiz */
  interactive?: Interactive
  /** Card to open on (resume) */
  initialIndex?: number
  onIndexChange?: (index: number) => void
}) {
  const cards: LessonCard[] = interactive
    ? [...baseCards, { id: 'try-it', kind: 'text', title: interactive.title, body: '', accent: interactive.kind === 'slider' ? 'Try it' : interactive.kind === 'tradeoff' ? 'Your call' : 'Predict' }]
    : baseCards
  const [index, setIndex] = useState(() => Math.min(Math.max(0, initialIndex), Math.max(0, cards.length - 1)))
  useEffect(() => {
    onIndexChange?.(index)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])
  const card = cards[index]
  const covered = baseCards.filter(hasRealTitle)

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
    <div className="panel" style={{ ['--accent' as string]: accent }}>
      <div className="p-5 sm:p-7">
        <div className="flex justify-between items-center gap-4 mb-3">
          <span className="text-sm font-extrabold text-dim tabular-nums" aria-live="polite">
            Card {index + 1} of {cards.length}
          </span>
          <span className="flex items-center gap-3">
            {card.accent && (
              <span className="text-xs font-extrabold rounded-full px-3 py-1" style={{ color: accent, border: `2px solid ${accent}` }}>
                {card.accent}
              </span>
            )}
            {skipAction && !(index === cards.length - 1 && finalAction) && skipAction}
          </span>
        </div>
        {/* Each dot is a 44px-tall tap target around a slim bar; the negative margin keeps the visual spacing */}
        <div className="flex gap-1.5 -mt-4 mb-2">
          {cards.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to card ${i + 1}`}
              aria-current={i === index ? 'step' : undefined}
              onClick={() => setIndex(i)}
              className="flex h-11 flex-1 items-center"
            >
              <span className="block h-3 w-full rounded-full transition-colors duration-200" style={{ background: i <= index ? 'var(--color-hero)' : 'var(--color-paper-3)' }} />
            </button>
          ))}
        </div>
        {hasRealTitle(card) && <h3 className="font-display text-2xl sm:text-3xl text-chalk mb-3">{card.title}</h3>}
        {card.id === 'try-it' && interactive ? (
          <InteractiveBlock key={interactive.title} item={interactive} />
        ) : (
          <div className="space-y-3">
            {paragraphs(card.body).map((para, i) => (
              <p key={i} className="text-chalk leading-relaxed text-[1.125rem] font-semibold">{para}</p>
            ))}
          </div>
        )}
        {card.steps && card.steps.length > 0 && (
          <ol className="flow mt-5" aria-label="Steps">
            {card.steps.map((step, i) => (
              <li key={step} className="flow-step">
                <span className="flow-dot tabular-nums" style={{ borderColor: accent }} aria-hidden>{i + 1}</span>
                <span className="text-chalk font-bold">{step}</span>
              </li>
            ))}
          </ol>
        )}
        {card.note && (
          <p className="mt-4 rounded-2xl bg-right-wash p-4 leading-relaxed text-chalk font-semibold" data-testid="card-note">
            <span className="font-extrabold">Result. </span>
            {card.note}
          </p>
        )}
        {card.diagram && (
          <div className="mt-4 rounded-2xl border border-[var(--color-rail)] bg-paper-2 p-3 overflow-x-auto" dangerouslySetInnerHTML={{ __html: lightDiagram(card.diagram) }} />
        )}
        {card.kind === 'animation' && (
          <div className="mt-4 h-1 bg-[var(--color-rail)] rounded-full overflow-hidden" aria-hidden>
            <div className="h-full w-1/3 rounded-full bg-[var(--color-amber)] animate-[slide_1.8s_ease-in-out_infinite]" style={{ animationName: 'slide' }} />
          </div>
        )}
        {index === cards.length - 1 && finalAction && recap && covered.length > 1 && (
          <div className="mt-6 rounded-2xl bg-paper-2 p-4" data-testid="lesson-recap">
            <p className="text-sm font-extrabold text-dim">In this lesson</p>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {covered.map((c) => (
                <li key={c.id}>
                  <button type="button" className="flex min-h-[32px] w-full items-start gap-2 text-left font-bold text-chalk hover:text-teal" onClick={() => setIndex(cards.indexOf(c))}>
                    <span aria-hidden className="mt-[0.45em] h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {index === cards.length - 1 && finalAction && (
          <div className="mt-6">
            <MascotSays mood="happy" size={72}>You’ve got this! 70% clears it, and running out of hearts never ends the quiz.</MascotSays>
          </div>
        )}
        <div className="flex gap-3 mt-6 border-t-2 border-[var(--color-rail)] pt-5">
          <button type="button" onClick={prev} disabled={index === 0} className="btn-quiet whitespace-nowrap max-[359px]:px-3">
            Prev
          </button>
          {index === cards.length - 1 && finalAction ? (
            finalAction
          ) : (
            <button type="button" onClick={next} disabled={index === cards.length - 1} className="btn-cta flex-1 whitespace-nowrap max-[359px]:px-3 sm:flex-none sm:min-w-[200px]">
              Next card
            </button>
          )}
        </div>
        <p className="hidden sm:block text-sm text-dim mt-3">Tip: use the arrow keys to move between cards.</p>
      </div>
    </div>
  )
}
