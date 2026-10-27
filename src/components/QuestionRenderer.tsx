import { describeTolerance } from '../lib/scoring/estimation'
import { useEffect, useState } from 'react'
import type { Question, TradeoffQuestion } from '../content/types'
import { gradeQuestion, incompleteReason } from '../lib/scoring/questions'
import { Mascot } from './art/Mascot'

interface Props {
  question: Question
  onSubmit: (answer: unknown, result: ReturnType<typeof gradeQuestion>) => void
  locked?: boolean
  initialAnswer?: unknown
  /** MCQ hotkeys 1-4 */
  hotkeys?: boolean
  number?: number
  total?: number
  /** Outcome of an earlier, saved attempt: shows its result without regrading */
  reveal?: { correct: boolean }
  /** Duolingo-style mode: a fixed bottom bar holds Submit, and feedback slides up as a coloured sheet */
  sheet?: { onContinue: () => void; continueLabel: string; extra?: React.ReactNode; /** Byte's one-liner, e.g. a combo cheer */ reaction?: string }
  /** Mixed into the drag-order scramble so each attempt gets a new order */
  scrambleSeed?: string
}

const TYPE_LABEL: Record<Question['type'], string> = {
  multiple_choice: 'Pick one',
  spot_bottleneck: 'Spot the bottleneck',
  drag_order: 'Put in order',
  estimation: 'Estimate',
  tradeoff: 'Make the call',
}

/** Split a node label into at most two lines that fit the node. */
function wrapLabel(label: string, max = 14) {
  if (label.length <= max) return [label]
  const words = label.split(' ')
  let a = ''
  while (words.length && (a + ' ' + words[0]).trim().length <= max) a = (a + ' ' + words.shift()).trim()
  return [a || words.shift()!, words.join(' ')].filter(Boolean)
}

/** Lay the request path out left-to-right by edge depth; authored x/y coordinates overlap at real label widths. */
function BottleneckDiagram({
  question,
  picked,
  disabled,
  reveal,
  onPick,
}: {
  question: Extract<Question, { type: 'spot_bottleneck' }>
  picked: string[]
  disabled: boolean
  reveal: boolean
  onPick: (id: string) => void
}) {
  const depth = new Map<string, number>()
  const incoming = new Set(question.diagramEdges.map((e) => e.to))
  const queue = question.diagramNodes.filter((n) => !incoming.has(n.id)).map((n) => n.id)
  if (queue.length === 0 && question.diagramNodes[0]) queue.push(question.diagramNodes[0].id)
  queue.forEach((id) => depth.set(id, 0))
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i]!
    for (const e of question.diagramEdges) {
      if (e.from === id && !depth.has(e.to)) {
        depth.set(e.to, (depth.get(id) ?? 0) + 1)
        queue.push(e.to)
      }
    }
  }
  const cols = new Map<number, string[]>()
  for (const n of [...question.diagramNodes].sort((a, b) => a.x - b.x || a.y - b.y)) {
    const d = depth.get(n.id) ?? 0
    cols.set(d, [...(cols.get(d) ?? []), n.id])
  }
  const NW = 168
  const NH = 76
  const GX = 64
  const GY = 26
  const pos = new Map<string, { x: number; y: number }>()
  const maxRows = Math.max(1, ...[...cols.values()].map((c) => c.length))
  for (const [d, ids] of cols) {
    const offset = ((maxRows - ids.length) * (NH + GY)) / 2
    ids.forEach((id, i) => pos.set(id, { x: 10 + d * (NW + GX), y: 10 + offset + i * (NH + GY) }))
  }
  const W = 20 + cols.size * NW + (cols.size - 1) * GX
  const H = 20 + maxRows * NH + (maxRows - 1) * GY
  return (
    <div className="rounded-[20px] border-2 border-[var(--color-rail)] bg-paper-2 p-4 overflow-x-auto">
      <p className="text-sm font-bold text-dim mb-3">Requests flow left to right. Tap the component that saturates first.</p>
      <svg viewBox={`0 0 ${W} ${H + 6}`} className="w-full max-w-full" style={{ minWidth: Math.min(W, 560), maxHeight: 320 }} role="group" aria-label="Request path diagram">
        <defs>
          <marker id={`arrow-${question.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="var(--color-order-arrow)" />
          </marker>
        </defs>
        {question.diagramEdges.map((e) => {
          const a = pos.get(e.from)
          const b = pos.get(e.to)
          if (!a || !b) return null
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={a.x + NW}
              y1={a.y + NH / 2}
              x2={b.x - 2}
              y2={b.y + NH / 2}
              stroke="var(--color-order-arrow)"
              strokeWidth={3}
              markerEnd={`url(#arrow-${question.id})`}
            />
          )
        })}
        {question.diagramNodes.map((n) => {
          const p = pos.get(n.id)!
          const sel = picked.includes(n.id)
          const right = reveal && question.correctNodeIds.includes(n.id)
          const wrong = reveal && sel && !right
          const stroke = right ? 'var(--color-hero)' : wrong ? 'var(--color-heart)' : sel ? 'var(--color-gem)' : 'var(--color-rail)'
          return (
            <g
              key={n.id}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-pressed={sel}
              aria-label={n.label}
              aria-disabled={disabled}
              className={`station ${disabled ? '' : 'cursor-pointer'}`}
              onClick={() => !disabled && onPick(n.id)}
              onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onPick(n.id)
                }
              }}
            >
              <rect className="station-focus" x={p.x - 5} y={p.y - 5} width={NW + 10} height={NH + 14} rx={20} fill="none" stroke="var(--color-gem)" strokeWidth={3} />
              <rect x={p.x} y={p.y + 4} width={NW} height={NH} rx={16} fill={stroke === 'var(--color-rail)' ? 'var(--color-rail)' : stroke} />
              <rect x={p.x} y={p.y} width={NW} height={NH} rx={16} fill={right ? 'var(--color-right-soft)' : wrong ? 'var(--color-wrong-soft)' : sel ? 'var(--color-sky)' : 'var(--color-card)'} stroke={stroke} strokeWidth={2.5} />
              {wrapLabel(n.label).map((line, li, all) => (
                <text key={li} x={p.x + NW / 2} y={p.y + NH / 2 + 5 + (li - (all.length - 1) / 2) * 23} textAnchor="middle" fontSize={20} fontWeight={800} fill="var(--color-chalk)" className="font-display">
                  {line}
                </text>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Deterministic scramble: authored items are stored in the correct order, so showing them as-is leaks the answer. */
function scrambled(ids: string[], seed: string): string[] {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const out = [...ids]
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    const j = h % (i + 1)
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  if (out.length > 1 && out.every((id, i) => id === ids[i])) out.push(out.shift()!)
  return out
}

function OrderList({
  items,
  order,
  disabled,
  onChange,
}: {
  items: { id: string; label: string }[]
  order: string[]
  disabled: boolean
  onChange: (next: string[]) => void
}) {
  const label = (id: string) => items.find((i) => i.id === id)?.label ?? id
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return
    const next = [...order]
    const [x] = next.splice(from, 1)
    next.splice(to, 0, x!)
    onChange(next)
  }
  return (
    <ol className="space-y-1.5" aria-label="Order the steps. Drag a card, or use the up and down buttons.">
      {order.map((id, idx) => (
        <li
          key={id}
          className={`order-row ${disabled ? '' : 'cursor-grab'} ${dragOver === idx && dragFrom !== idx ? 'order-row-over' : ''} ${dragFrom === idx ? 'opacity-50' : ''}`}
          draggable={!disabled}
          onDragStart={(e) => {
            setDragFrom(idx)
            e.dataTransfer.effectAllowed = 'move'
          }}
          onDragOver={(e) => {
            if (dragFrom === null) return
            e.preventDefault()
            setDragOver(idx)
          }}
          onDrop={(e) => {
            e.preventDefault()
            if (dragFrom !== null) move(dragFrom, idx)
            setDragFrom(null)
            setDragOver(null)
          }}
          onDragEnd={() => {
            setDragFrom(null)
            setDragOver(null)
          }}
        >
          {!disabled && (
            <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden className="shrink-0 text-dim">
              {[3, 8, 13].map((y) => (
                <g key={y} fill="currentColor"><circle cx="2.5" cy={y} r="1.3" /><circle cx="7.5" cy={y} r="1.3" /></g>
              ))}
            </svg>
          )}
          <span className="order-num tabular-nums" aria-hidden>{idx + 1}</span>
          <span className="flex-1 text-sm text-chalk">{label(id)}</span>
          <span className="flex gap-1">
            <button
              type="button"
              className="order-btn"
              disabled={disabled || idx === 0}
              onClick={() => move(idx, idx - 1)}
              aria-label={`Move "${label(id)}" up`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2 8l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
            <button
              type="button"
              className="order-btn"
              disabled={disabled || idx === order.length - 1}
              onClick={() => move(idx, idx + 1)}
              aria-label={`Move "${label(id)}" down`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
          </span>
        </li>
      ))}
    </ol>
  )
}

function FeedbackMark({ ok }: { ok: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 20 20" aria-hidden className="shrink-0">
      <circle cx="10" cy="10" r="10" fill="var(--color-card)" />
      {ok ? (
        <path d="M6 10.5l2.6 2.6L14 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M7 7l6 6M13 7l-6 6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      )}
    </svg>
  )
}

function hasStructuredTradeoff(q: TradeoffQuestion) {
  return Boolean(q.rationaleOptions?.length && q.correctRationaleIds?.length)
}

export function QuestionRenderer({ question, onSubmit, locked, initialAnswer, hotkeys = true, number, total, reveal, sheet, scrambleSeed = '' }: Props) {
  const [answer, setAnswer] = useState<unknown>(initialAnswer)
  const [result, setResult] = useState<ReturnType<typeof gradeQuestion> | null>(null)
  const submitted = locked || result !== null
  const shown: { correct: boolean; feedback: string } | null =
    result ?? (reveal ? { correct: reveal.correct, feedback: reveal.correct ? 'You answered this one correctly.' : 'You missed this one; the right answer is marked.' } : null)
  const orderUntouched = question.type === 'drag_order' && !(Array.isArray(answer) && answer.length === question.items.length)
  // An untouched reorder list is a blank answer: Submit stays disabled, so it can never cost a heart
  const pending = orderUntouched ? 'Move at least one step to set your order.' : incompleteReason(question, answer)

  const submit = () => {
    if (submitted || orderUntouched) return
    const final = answer
    if (incompleteReason(question, final)) return
    const r = gradeQuestion(question, final)
    setResult(r)
    onSubmit(final, r)
  }

  // Choices are stored with the answer first in many questions; show them in a per-question, per-attempt order.
  const shownChoices =
    question.type === 'multiple_choice'
      ? scrambled(question.choices.map((c) => c.id), 'mc' + question.id + (scrambleSeed ?? '')).map((id) => question.choices.find((c) => c.id === id)!)
      : []

  useEffect(() => {
    if (!hotkeys || question.type !== 'multiple_choice' || submitted) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      const n = Number(e.key)
      if (n >= 1 && n <= 4) {
        const choice = shownChoices[n - 1]
        if (!choice) return
        e.preventDefault()
        setAnswer([choice.id])
      }
      if (e.key === 'Enter' && !e.repeat) {
        e.preventDefault()
        submit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className={sheet ? 'space-y-5 short:space-y-3' : `panel-slab p-4 sm:p-5 space-y-4 ${hotkeys && !submitted ? 'question-active' : ''}`}>
      {number !== undefined && (
        <p className="text-sm font-extrabold text-teal tabular-nums">
          Question {number}
          {total ? ` of ${total}` : ''} · {TYPE_LABEL[question.type]}
        </p>
      )}
      <p className={`font-display text-chalk leading-snug ${sheet ? 'text-2xl short:text-lg' : 'text-lg'}`}>{question.prompt}</p>
      {question.type === 'multiple_choice' && (
        <div className="space-y-2">
          {shownChoices.map((c, idx) => {
            const selected = Array.isArray(answer) && answer.includes(c.id)
            const isRight = question.correctChoiceIds.includes(c.id) || (question.alternativeChoiceIds ?? []).includes(c.id)
            const revealNow = shown !== null
            const stateClass = revealNow && isRight ? 'choice-row-right' : revealNow && selected ? 'choice-row-wrong' : selected ? 'choice-row-selected' : ''
            return (
              <label
                key={c.id}
                className={`choice-row flex gap-3 items-center p-3.5 ${submitted ? '' : 'cursor-pointer'} ${stateClass}`}
              >
                <input
                  type="radio"
                  name={`mcq-${question.id}`}
                  className="choice-input"
                  aria-label={c.label}
                  disabled={submitted}
                  checked={selected}
                  onChange={() => setAnswer([c.id])}
                />
                <kbd className="kbd shrink-0">{idx + 1}</kbd>
                <span className="text-[1rem] font-bold text-chalk">{c.label}</span>
                {revealNow && (isRight || selected) && (
                  <span data-testid="choice-verdict" className={`ml-auto shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${isRight ? 'bg-hero text-white' : 'bg-wrong-bright text-white'}`}>
                    <span aria-hidden>{isRight ? '✓' : '✕'}</span>
                    {isRight ? (selected ? 'Your answer · correct' : 'Correct answer') : 'Your answer'}
                  </span>
                )}
              </label>
            )
          })}
        </div>
      )}
      {question.type === 'spot_bottleneck' && (
        <BottleneckDiagram
          question={question}
          picked={Array.isArray(answer) ? (answer as string[]) : []}
          disabled={submitted}
          reveal={shown !== null}
          onPick={(id) => setAnswer([id])}
        />
      )}
      {question.type === 'drag_order' && (
        <OrderList
          items={question.items}
          order={Array.isArray(answer) && (answer as string[]).length === question.items.length ? (answer as string[]) : scrambled(question.items.map((i) => i.id), question.id + scrambleSeed)}
          disabled={submitted}
          onChange={setAnswer}
        />
      )}
      {question.type === 'drag_order' && shown && !shown.correct && (
        <div className="rounded-2xl border border-right-edge bg-right-wash p-3">
          <p className="text-sm font-semibold text-[var(--color-clear)] mb-1.5">{question.alternativeOrders?.length ? 'One correct sequence' : 'Correct sequence'}</p>
          <ol className="list-decimal pl-5 text-sm text-chalk space-y-0.5">
            {question.correctOrder.map((id) => (
              <li key={id}>{question.items.find((i) => i.id === id)?.label}</li>
            ))}
          </ol>
        </div>
      )}
      {question.type === 'estimation' && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-extrabold text-dim">Your estimate</span>
            <span className="mt-2 flex max-w-md items-stretch">
              <input
                type="number"
                inputMode="decimal"
                enterKeyHint="done"
                min={0}
                // Phones: once the keyboard is up, bring the field to the middle so neither the keyboard nor the Submit bar hides it
                onFocus={(e) => {
                  const el = e.currentTarget
                  if (window.matchMedia?.('(max-width: 1023px)').matches) window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
                }}
                disabled={submitted}
                className="field w-full rounded-r-none !min-h-[60px] !text-2xl font-extrabold tabular-nums"
                value={typeof answer === 'string' ? answer : ''}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer"
                aria-label={`Your estimate in ${question.unit}`}
              />
              <span className="grid max-w-[50%] place-items-center rounded-r-2xl border-2 border-l-0 border-[var(--color-rail)] bg-[var(--color-sky)] px-3 text-center leading-tight font-extrabold text-teal sm:px-4">
                {question.unit}
              </span>
            </span>
            <span className="mt-1.5 block text-xs text-dim" data-testid="estimation-tolerance">
              {question.tolerance === 0 ? 'Needs the exact number.' : `${describeTolerance(question.tolerance)} of the target counts as correct.`}
            </span>
          </label>
          {submitted && (
            <dl className="rounded-2xl border-2 border-[var(--color-rail)] bg-white p-4 grid gap-2 sm:grid-cols-[110px_1fr]">
              <dt className="text-dim">Assumptions</dt>
              <dd className="text-chalk">{question.assumptions.join(' · ')}</dd>
              <dt className="text-dim">Formula</dt>
              <dd className="text-chalk tabular-nums">{question.formula}</dd>
              <dt className="text-dim">Worked answer</dt>
              <dd className="text-chalk tabular-nums">{question.workedAnswer}</dd>
            </dl>
          )}
        </div>
      )}
      {question.type === 'tradeoff' && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-extrabold text-dim mb-2">Constraints</p>
            <ul className="flex flex-wrap gap-2">
              {question.constraints.map((c) => (
                <li key={c} className="rounded-full bg-flame-wash px-3 py-1 text-sm font-extrabold text-flame-ink-2">{c}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm font-extrabold text-dim pt-1">Choose an approach</p>
          {question.approaches.map((a) => (
            <label key={a.id} className={`choice-row flex gap-3 items-center p-3.5 ${submitted ? '' : 'cursor-pointer'} ${(answer as { approachId?: string })?.approachId === a.id ? 'choice-row-selected' : ''}`}>
              <input
                type="radio"
                className="mt-1"
                name={`approach-${question.id}`}
                disabled={submitted}
                checked={(answer as { approachId?: string })?.approachId === a.id}
                onChange={() =>
                  setAnswer({
                    approachId: a.id,
                    rationaleIds: (answer as { rationaleIds?: string[] })?.rationaleIds ?? [],
                  })
                }
              />
              <span>
                <span className="block font-extrabold text-chalk">{a.label}</span>
                <span className="block text-[0.9375rem] font-semibold text-dim mt-0.5">{a.description}</span>
              </span>
            </label>
          ))}
          {hasStructuredTradeoff(question) ? (
            <div className="space-y-2.5 pt-3">
              <p className="text-sm font-extrabold text-dim">Why? Pick every reason that applies</p>
              {question.rationaleOptions.map((opt) => {
                const ids = (answer as { rationaleIds?: string[] })?.rationaleIds ?? []
                const checked = ids.includes(opt.id)
                return (
                  <label key={opt.id} className={`choice-row flex gap-3 items-center p-3 font-bold text-chalk ${submitted ? '' : 'cursor-pointer'} ${checked ? 'choice-row-selected' : ''}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      disabled={submitted}
                      checked={checked}
                      onChange={(e) => {
                        const cur = new Set(ids)
                        if (e.target.checked) cur.add(opt.id)
                        else cur.delete(opt.id)
                        setAnswer({
                          approachId: (answer as { approachId?: string })?.approachId ?? '',
                          rationaleIds: [...cur],
                        })
                      }}
                    />
                    {opt.label}
                  </label>
                )
              })}
            </div>
          ) : (
            <textarea
              disabled={submitted}
              className="w-full field"
              rows={3}
              placeholder="Legacy rationale field…"
              value={(answer as { rationale?: string })?.rationale ?? ''}
              onChange={(e) =>
                setAnswer({
                  approachId: (answer as { approachId?: string })?.approachId ?? '',
                  rationale: e.target.value,
                })
              }
            />
          )}
        </div>
      )}
      {!submitted && !sheet && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={submit} className="btn-cta" disabled={pending !== null}>
            Submit
          </button>
          {pending && <span className="text-sm text-dim">{pending}</span>}
        </div>
      )}
      {!submitted && sheet && (
        <div className="quizbar">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 short:py-2">
            <span className="text-sm font-bold text-dim">{pending ?? 'Ready when you are.'}</span>
            <button type="button" onClick={submit} className="btn-cta min-w-[160px]" disabled={pending !== null}>
              Submit
            </button>
          </div>
        </div>
      )}
      {shown && !sheet && (
        <div className={`feedback ${shown.correct ? 'feedback-ok' : 'feedback-miss'}`} role="status">
          <p className="font-display flex items-center gap-2">
            <FeedbackMark ok={shown.correct} />
            {shown.correct ? 'Correct' : 'Not this time'}
          </p>
          <p className="text-sm mt-1">{shown.feedback}</p>
        </div>
      )}
      {submitted && !sheet && (
        <p className="text-sm text-dim leading-relaxed border-t-2 border-[var(--color-rail)] pt-3">
          <span className="text-chalk font-extrabold">Why: </span>
          {question.explanation}
        </p>
      )}
      {submitted && !sheet && <WhyNotOthers question={question} />}
      {shown && sheet && (
        <>
          <div aria-hidden className="h-72" />
          <div className={`sheet ${shown.correct ? 'sheet-ok' : 'sheet-miss'}`} role="status" data-testid="feedback-sheet">
            <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end">
              <div className="flex min-w-0 flex-1 gap-3">
                <Mascot mood={shown.correct ? 'happy' : 'sad'} size={76} className={`shrink-0 ${shown.correct ? 'anim-pop' : 'anim-wiggle'}`} />
                <div className="min-w-0">
                  <p className="sheet-title flex items-center gap-2">
                    <FeedbackMark ok={shown.correct} />
                    {shown.correct ? 'Correct' : 'Not this time'}
                  </p>
                  {result && sheet.reaction && <p className="text-sm font-extrabold" data-testid="byte-reaction">{sheet.reaction}</p>}
                  {!/^correct\.?$/i.test(shown.feedback.trim()) && <p className="font-bold">{shown.feedback}</p>}
                  <p className="mt-1 text-[0.9375rem] leading-relaxed text-chalk">
                    <span className="font-extrabold">Why: </span>
                    {question.explanation}
                  </p>
                  <WhyNotOthers question={question} />
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <button
                  type="button"
                  autoFocus
                  // A held-down Enter (auto-repeat) must not skip straight past the feedback
                  onKeyDown={(e) => { if (e.repeat && e.key === 'Enter') e.preventDefault() }}
                  className={`${shown.correct ? 'btn-cta' : 'btn-danger'} min-w-[180px]`}
                  onClick={sheet.onContinue}
                >
                  {sheet.continueLabel}
                </button>
                {sheet.extra}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/** Tradeoff questions explain every tempting-but-wrong reason, not just the one you picked */
function WhyNotOthers({ question }: { question: Question }) {
  if (question.type !== 'tradeoff' || !question.rationaleConflicts) return null
  const items = Object.entries(question.rationaleConflicts)
    .map(([id, why]) => ({ id, why, label: question.rationaleOptions.find((o) => o.id === id)?.label }))
    .filter((x) => x.label)
  if (!items.length) return null
  return (
    <details className="why-others mt-2" data-testid="why-others">
      <summary className="tap-link cursor-pointer text-sm font-extrabold">Why the other reasons fail ({items.length})</summary>
      <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1 text-sm leading-relaxed">
        {items.map((x) => (
          <li key={x.id}><span className="font-extrabold">“{x.label}”</span>: {x.why}</li>
        ))}
      </ul>
    </details>
  )
}
