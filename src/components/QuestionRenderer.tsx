import { useEffect, useState } from 'react'
import type { Question, TradeoffQuestion } from '../content/types'
import { gradeQuestion, incompleteReason } from '../lib/scoring/questions'

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
}

const TYPE_LABEL: Record<Question['type'], string> = {
  multiple_choice: 'Pick one',
  spot_bottleneck: 'Spot the bottleneck',
  drag_order: 'Put in order',
  estimation: 'Estimate',
  tradeoff: 'Make the call',
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
  const NW = 150
  const NH = 44
  const GX = 70
  const GY = 22
  const pos = new Map<string, { x: number; y: number }>()
  const maxRows = Math.max(1, ...[...cols.values()].map((c) => c.length))
  for (const [d, ids] of cols) {
    const offset = ((maxRows - ids.length) * (NH + GY)) / 2
    ids.forEach((id, i) => pos.set(id, { x: 10 + d * (NW + GX), y: 10 + offset + i * (NH + GY) }))
  }
  const W = 20 + cols.size * NW + (cols.size - 1) * GX
  const H = 20 + maxRows * NH + (maxRows - 1) * GY
  return (
    <div className="rounded-2xl border border-[var(--color-rail)] bg-[#f7f5f0] p-3 overflow-x-auto">
      <p className="text-xs text-dim mb-2">Requests flow left to right. Select the component that saturates first.</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-full" style={{ minWidth: Math.min(W, 520), maxHeight: 260 }} role="group" aria-label="Request path diagram">
        <defs>
          <marker id={`arrow-${question.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="#9AA3AF" />
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
              stroke="#9AA3AF"
              strokeWidth={2}
              markerEnd={`url(#arrow-${question.id})`}
            />
          )
        })}
        {question.diagramNodes.map((n) => {
          const p = pos.get(n.id)!
          const sel = picked.includes(n.id)
          const right = reveal && question.correctNodeIds.includes(n.id)
          const wrong = reveal && sel && !right
          const stroke = right ? '#58CC02' : wrong ? '#FF4B4B' : sel ? '#1CB0F6' : '#E6E0D6'
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
              <rect className="station-focus" x={p.x - 4} y={p.y - 4} width={NW + 8} height={NH + 8} rx={9} fill="none" stroke="#1CB0F6" strokeWidth={3} />
              <rect x={p.x} y={p.y} width={NW} height={NH} rx={6} fill={sel ? '#DDF4FE' : '#FFFFFF'} stroke={stroke} strokeWidth={2} />
              <text x={p.x + NW / 2} y={p.y + NH / 2 + 4} textAnchor="middle" fontSize={13} fontWeight={600} fill="#29303D" className="font-display">
                {n.label}
              </text>
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
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      {ok ? (
        <path d="M6 10.5l2.6 2.6L14 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M7 7l6 6M13 7l-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  )
}

function hasStructuredTradeoff(q: TradeoffQuestion) {
  return Boolean(q.rationaleOptions?.length && q.correctRationaleIds?.length)
}

export function QuestionRenderer({ question, onSubmit, locked, initialAnswer, hotkeys = true, number, total, reveal }: Props) {
  const [answer, setAnswer] = useState<unknown>(initialAnswer)
  const [result, setResult] = useState<ReturnType<typeof gradeQuestion> | null>(null)
  const submitted = locked || result !== null
  const shown: { correct: boolean; feedback: string } | null =
    result ?? (reveal ? { correct: reveal.correct, feedback: reveal.correct ? 'You answered this one correctly.' : 'You missed this one; the right answer is marked.' } : null)
  const pending = incompleteReason(
    question,
    question.type === 'drag_order' && !(Array.isArray(answer) && answer.length === question.items.length)
      ? scrambled(question.items.map((i) => i.id), question.id)
      : answer,
  )

  const submit = () => {
    if (submitted) return
    // A reorder list always has an order on screen; submit that one even if untouched
    const final =
      question.type === 'drag_order' && !(Array.isArray(answer) && answer.length === question.items.length)
        ? scrambled(question.items.map((i) => i.id), question.id)
        : answer
    if (incompleteReason(question, final)) return
    const r = gradeQuestion(question, final)
    setResult(r)
    onSubmit(final, r)
  }

  useEffect(() => {
    if (!hotkeys || question.type !== 'multiple_choice' || submitted) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      const n = Number(e.key)
      if (n >= 1 && n <= 4) {
        const choice = question.choices[n - 1]
        if (!choice) return
        e.preventDefault()
        setAnswer([choice.id])
      }
      if (e.key === 'Enter') submit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className={`panel-slab p-5 space-y-4 ${hotkeys && !submitted ? 'question-active' : ''}`}>
      {number !== undefined && (
        <p className="text-xs text-dim tabular-nums">
          Question {number}
          {total ? ` of ${total}` : ''} · {TYPE_LABEL[question.type]}
        </p>
      )}
      <p className="font-display font-semibold text-chalk text-lg leading-snug">{question.prompt}</p>
      {question.type === 'multiple_choice' && (
        <div className="space-y-2">
          {question.choices.map((c, idx) => {
            const selected = Array.isArray(answer) && answer.includes(c.id)
            const isRight = question.correctChoiceIds.includes(c.id) || (question.alternativeChoiceIds ?? []).includes(c.id)
            const revealNow = shown !== null
            const stateClass = revealNow && isRight ? 'choice-row-right' : revealNow && selected ? 'choice-row-wrong' : selected ? 'choice-row-selected' : ''
            return (
              <label
                key={c.id}
                className={`choice-row flex gap-3 items-start p-3 ${submitted ? '' : 'cursor-pointer'} ${stateClass}`}
              >
                <input
                  type="radio"
                  name={`mcq-${question.id}`}
                  className="mt-0.5"
                  disabled={submitted}
                  checked={selected}
                  onChange={() => setAnswer([c.id])}
                />
                <span className="text-[15px] text-chalk">
                  <kbd className="kbd mr-2.5">{idx + 1}</kbd>
                  {c.label}
                </span>
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
          order={Array.isArray(answer) && (answer as string[]).length === question.items.length ? (answer as string[]) : scrambled(question.items.map((i) => i.id), question.id)}
          disabled={submitted}
          onChange={setAnswer}
        />
      )}
      {question.type === 'drag_order' && shown && !shown.correct && (
        <div className="rounded-2xl border border-[#79d634] bg-[#effbe5] p-3">
          <p className="text-sm font-semibold text-[var(--color-clear)] mb-1.5">Correct sequence</p>
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
            <span className="text-xs text-dim">Your estimate</span>
            <span className="mt-1 flex max-w-xs items-stretch">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                disabled={submitted}
                className="field w-full rounded-r-none text-base tabular-nums"
                value={typeof answer === 'string' ? answer : ''}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="e.g. 1200"
              />
              <span className="grid place-items-center rounded-r-md border border-l-0 border-[var(--color-rail)] bg-[var(--color-platform)] px-3 text-sm text-dim">
                {question.unit}
              </span>
            </span>
          </label>
          {submitted && (
            <dl className="rounded-2xl border border-[var(--color-rail)] bg-[#f7f5f0] p-3 text-sm grid gap-2 sm:grid-cols-[110px_1fr]">
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
          <div className="rounded-2xl bg-[#f7f5f0] border border-[var(--color-rail)] p-3">
            <p className="text-xs text-dim mb-1.5">Constraints</p>
            <ul className="flex flex-wrap gap-1.5">
              {question.constraints.map((c) => (
                <li key={c} className="rounded-full border border-[var(--color-rail)] px-2.5 py-0.5 text-xs text-chalk">{c}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-dim">Choose an approach</p>
          {question.approaches.map((a) => (
            <label key={a.id} className={`choice-row flex gap-3 items-start p-3 ${submitted ? '' : 'cursor-pointer'} ${(answer as { approachId?: string })?.approachId === a.id ? 'choice-row-selected' : ''}`}>
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
                <span className="block font-semibold text-sm text-chalk">{a.label}</span>
                <span className="block text-sm text-dim mt-0.5">{a.description}</span>
              </span>
            </label>
          ))}
          {hasStructuredTradeoff(question) ? (
            <div className="space-y-2 pt-2 border-t border-[var(--color-line)]">
              <p className="text-xs text-dim">Why? Pick every reason that applies</p>
              {question.rationaleOptions.map((opt) => {
                const ids = (answer as { rationaleIds?: string[] })?.rationaleIds ?? []
                const checked = ids.includes(opt.id)
                return (
                  <label key={opt.id} className={`choice-row flex gap-2.5 items-start p-2.5 text-sm text-chalk ${submitted ? '' : 'cursor-pointer'} ${checked ? 'choice-row-selected' : ''}`}>
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
      {!submitted && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={submit} className="btn-cta disabled:opacity-40" disabled={pending !== null}>
            Submit
          </button>
          {pending && <span className="text-sm text-dim">{pending}</span>}
        </div>
      )}
      {shown && (
        <div className={`feedback ${shown.correct ? 'feedback-ok' : 'feedback-miss'}`} role="status">
          <p className="font-display font-semibold flex items-center gap-2">
            <FeedbackMark ok={shown.correct} />
            {shown.correct ? 'Correct' : 'Not this time'}
          </p>
          <p className="text-sm mt-1">{shown.feedback}</p>
        </div>
      )}
      {submitted && (
        <p className="text-sm text-dim leading-relaxed border-t border-[var(--color-rail)] pt-3">
          <span className="text-chalk font-semibold">Why: </span>
          {question.explanation}
        </p>
      )}
    </div>
  )
}
