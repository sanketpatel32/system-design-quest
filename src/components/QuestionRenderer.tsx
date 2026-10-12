import { useState } from 'react'
import type { Question } from '../content/types'
import { gradeQuestion } from '../lib/scoring/questions'

interface Props {
  question: Question
  onSubmit: (answer: unknown, result: ReturnType<typeof gradeQuestion>) => void
  locked?: boolean
  initialAnswer?: unknown
}

export function QuestionRenderer({ question, onSubmit, locked, initialAnswer }: Props) {
  const [answer, setAnswer] = useState<unknown>(initialAnswer)
  const [result, setResult] = useState<ReturnType<typeof gradeQuestion> | null>(null)
  const submitted = locked || result !== null

  const submit = () => {
    if (submitted) return
    const r = gradeQuestion(question, answer)
    setResult(r)
    onSubmit(answer, r)
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
      <p className="font-medium text-slate-100">{question.prompt}</p>
      {question.type === 'multiple_choice' && (
        <div className="space-y-2">
          {question.choices.map((c, idx) => (
            <label key={c.id} className="flex gap-2 items-center p-2 rounded border border-slate-700 cursor-pointer hover:border-cyan-500/40">
              <input
                type="checkbox"
                disabled={submitted}
                checked={Array.isArray(answer) && answer.includes(c.id)}
                onChange={(e) => {
                  const cur = new Set(Array.isArray(answer) ? answer : [])
                  if (e.target.checked) cur.add(c.id)
                  else cur.delete(c.id)
                  setAnswer([...cur])
                }}
              />
              <span><kbd className="text-xs text-slate-500 mr-2">{idx + 1}</kbd>{c.label}</span>
            </label>
          ))}
        </div>
      )}
      {question.type === 'spot_bottleneck' && (
        <div className="relative h-40 bg-slate-950 rounded-lg border border-slate-800">
          {question.diagramNodes.map((n) => (
            <button
              key={n.id}
              type="button"
              disabled={submitted}
              onClick={() => setAnswer([n.id])}
              className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 text-xs rounded border ${
                Array.isArray(answer) && answer.includes(n.id)
                  ? 'border-cyan-400 bg-cyan-500/20'
                  : 'border-slate-600 bg-slate-800'
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
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1"
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
              <span className="text-slate-400 text-sm">Step {idx + 1}</span>
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
            className="w-full max-w-xs bg-slate-800 border border-slate-600 rounded px-3 py-2"
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={`Answer in ${question.unit}`}
          />
          {submitted && (
            <div className="text-sm text-slate-400 space-y-1">
              <p>Assumptions: {question.assumptions.join(' · ')}</p>
              <p>Formula: {question.formula}</p>
              <p>Worked: {question.workedAnswer}</p>
            </div>
          )}
        </div>
      )}
      {question.type === 'tradeoff' && (
        <div className="space-y-3">
          <ul className="text-sm text-slate-400 list-disc pl-5">
            {question.constraints.map((c) => <li key={c}>{c}</li>)}
          </ul>
          {question.approaches.map((a) => (
            <label key={a.id} className="block border border-slate-700 rounded p-2">
              <input
                type="radio"
                name="approach"
                disabled={submitted}
                checked={(answer as { approachId?: string })?.approachId === a.id}
                onChange={() => setAnswer({ approachId: a.id, rationale: (answer as { rationale?: string })?.rationale ?? '' })}
              />
              <span className="ml-2 font-medium">{a.label}</span>
              <p className="text-sm text-slate-400 ml-6">{a.description}</p>
            </label>
          ))}
          <textarea
            disabled={submitted}
            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm"
            rows={3}
            placeholder="Structured rationale (mention constraints)…"
            value={(answer as { rationale?: string })?.rationale ?? ''}
            onChange={(e) =>
              setAnswer({
                approachId: (answer as { approachId?: string })?.approachId ?? '',
                rationale: e.target.value,
              })
            }
          />
        </div>
      )}
      {!submitted && (
        <button type="button" onClick={submit} className="px-4 py-2 rounded-lg bg-violet-500/30 border border-violet-400/50">
          Submit
        </button>
      )}
      {result && (
        <p className={`text-sm ${result.correct ? 'text-emerald-300' : 'text-rose-300'}`} role="status">
          {result.feedback}
        </p>
      )}
      {submitted && !result && (
        <p className="text-sm text-slate-400">{question.explanation}</p>
      )}
      {result && (
        <p className="text-sm text-slate-400 border-t border-slate-700 pt-2">{question.explanation}</p>
      )}
    </div>
  )
}
