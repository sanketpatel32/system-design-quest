import { useEffect, useState } from 'react'
import type { Question, TradeoffQuestion } from '../content/types'
import { gradeQuestion } from '../lib/scoring/questions'

interface Props {
  question: Question
  onSubmit: (answer: unknown, result: ReturnType<typeof gradeQuestion>) => void
  locked?: boolean
  initialAnswer?: unknown
  /** MCQ hotkeys 1-4 */
  hotkeys?: boolean
}

function hasStructuredTradeoff(q: TradeoffQuestion) {
  return Boolean(q.rationaleOptions?.length && q.correctRationaleIds?.length)
}

export function QuestionRenderer({ question, onSubmit, locked, initialAnswer, hotkeys = true }: Props) {
  const [answer, setAnswer] = useState<unknown>(initialAnswer)
  const [result, setResult] = useState<ReturnType<typeof gradeQuestion> | null>(null)
  const submitted = locked || result !== null

  const submit = () => {
    if (submitted) return
    const r = gradeQuestion(question, answer)
    setResult(r)
    onSubmit(answer, r)
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
    <div className="panel-slab p-4 space-y-4">
      <p className="font-medium text-[#f1f5f9] text-[15px] leading-snug">{question.prompt}</p>
      {question.type === 'multiple_choice' && (
        <div className="space-y-2">
          {question.choices.map((c, idx) => {
            const selected = Array.isArray(answer) && answer.includes(c.id)
            return (
              <label
                key={c.id}
                className={`choice-row flex gap-3 items-start p-3 cursor-pointer ${selected ? 'choice-row-selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`mcq-${question.id}`}
                  className="mt-0.5"
                  disabled={submitted}
                  checked={selected}
                  onChange={() => setAnswer([c.id])}
                />
                <span className="text-sm text-[#d1d5db]">
                  <kbd className="font-mono text-[10px] text-[var(--color-muted)] mr-2">{idx + 1}</kbd>
                  {c.label}
                </span>
              </label>
            )
          })}
        </div>
      )}
      {question.type === 'spot_bottleneck' && (
        <div className="relative h-44 bg-[#080b0f] border border-[var(--color-line)]">
          {question.diagramNodes.map((n) => (
            <button
              key={n.id}
              type="button"
              disabled={submitted}
              onClick={() => setAnswer([n.id])}
              className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 text-[11px] font-semibold border ${
                Array.isArray(answer) && answer.includes(n.id)
                  ? 'border-[var(--color-teal)] bg-[#0f1f1c] text-[var(--color-teal)]'
                  : 'border-[var(--color-line)] bg-[#0d1117] text-[#94a3b8]'
              }`}
              style={{ left: `${n.x}px`, top: `${n.y}px` }}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}
      {question.type === 'drag_order' && (
        <ol className="space-y-2">
          {question.items.map((item, idx) => (
            <li key={item.id} className="flex gap-2 items-center">
              <select
                disabled={submitted}
                className="bg-[#0a0e13] border border-[var(--color-line)] text-sm px-2 py-1.5 text-[var(--color-ink)]"
                value={(answer as string[] | undefined)?.[idx] ?? ''}
                onChange={(e) => {
                  const arr = [...(Array.isArray(answer) ? (answer as string[]) : question.items.map((i) => i.id))]
                  arr[idx] = e.target.value
                  setAnswer(arr)
                }}
                aria-label={`Position ${idx + 1}`}
              >
                <option value="">Pick…</option>
                {question.items.map((i) => (
                  <option key={i.id} value={i.id}>{i.label}</option>
                ))}
              </select>
              <span className="text-[var(--color-muted)] text-xs font-mono">#{idx + 1}</span>
            </li>
          ))}
        </ol>
      )}
      {question.type === 'estimation' && (
        <div className="space-y-2">
          <input
            type="number"
            min={0}
            disabled={submitted}
            className="w-full max-w-xs bg-[#0a0e13] border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink)]"
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={`Answer in ${question.unit}`}
          />
          {submitted && (
            <div className="text-xs text-[var(--color-muted)] space-y-1 border-l-2 border-[var(--color-teal)] pl-3">
              <p>Assumptions: {question.assumptions.join(' · ')}</p>
              <p>Formula: {question.formula}</p>
              <p>Worked: {question.workedAnswer}</p>
            </div>
          )}
        </div>
      )}
      {question.type === 'tradeoff' && (
        <div className="space-y-3">
          <ul className="text-xs text-[var(--color-muted)] list-none space-y-1">
            {question.constraints.map((c) => (
              <li key={c} className="before:content-['—'] before:mr-2 before:text-[var(--color-teal)]">{c}</li>
            ))}
          </ul>
          {question.approaches.map((a) => (
            <label key={a.id} className={`choice-row block p-3 ${(answer as { approachId?: string })?.approachId === a.id ? 'choice-row-selected' : ''}`}>
              <input
                type="radio"
                name="approach"
                disabled={submitted}
                checked={(answer as { approachId?: string })?.approachId === a.id}
                onChange={() =>
                  setAnswer({
                    approachId: a.id,
                    rationaleIds: (answer as { rationaleIds?: string[] })?.rationaleIds ?? [],
                  })
                }
              />
              <span className="ml-2 font-semibold text-sm">{a.label}</span>
              <p className="text-xs text-[var(--color-muted)] ml-6 mt-1">{a.description}</p>
            </label>
          ))}
          {hasStructuredTradeoff(question) ? (
            <div className="space-y-2 pt-2 border-t border-[var(--color-line)]">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]">Why (pick all that apply)</p>
              {question.rationaleOptions.map((opt) => {
                const ids = (answer as { rationaleIds?: string[] })?.rationaleIds ?? []
                const checked = ids.includes(opt.id)
                return (
                  <label key={opt.id} className={`choice-row flex gap-2 p-2 text-sm ${checked ? 'choice-row-selected' : ''}`}>
                    <input
                      type="checkbox"
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
              className="w-full bg-[#0a0e13] border border-[var(--color-line)] p-2 text-sm text-[var(--color-ink)]"
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
        <button type="button" onClick={submit} className="btn-cta">
          Submit
        </button>
      )}
      {result && (
        <p className={`text-sm ${result.correct ? 'text-[var(--color-teal)]' : 'text-rose-400'}`} role="status">
          {result.feedback}
        </p>
      )}
      {(submitted || result) && (
        <p className="text-xs text-[var(--color-muted)] border-t border-[var(--color-line)] pt-2">{question.explanation}</p>
      )}
    </div>
  )
}
