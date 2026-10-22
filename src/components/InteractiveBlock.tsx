import { useId, useState } from 'react'
import type { Interactive, InteractivePredict, InteractiveSlider } from '../content/types'
import { MODELS, fmt } from '../lib/interactive/models'

/** In-lesson experiment (slider) or decision (predict / trade-off) with immediate feedback. */
export function InteractiveBlock({ item, onDone }: { item: Interactive; onDone?: () => void }) {
  return item.kind === 'slider' ? <Slider item={item} onDone={onDone} /> : <Predict item={item} onDone={onDone} />
}

function Slider({ item, onDone }: { item: InteractiveSlider; onDone?: () => void }) {
  const id = useId()
  const [x, setX] = useState(item.control.initial)
  const [moved, setMoved] = useState(false)
  const out = MODELS[item.model].run(x, item.params)
  const shown = item.control.log10 ? fmt(Math.pow(10, x)) : fmt(x, item.control.step < 1 ? 1 : 0)
  return (
    <div className="space-y-4" data-testid="interactive" data-kind="slider">
      <p className="text-chalk font-semibold text-[1.0625rem] leading-relaxed">{item.prompt}</p>
      <div className="rounded-2xl border-2 border-[var(--color-rail)] bg-white p-4">
        <label htmlFor={id} className="flex items-baseline justify-between gap-3 font-extrabold text-chalk">
          <span>{item.control.label}</span>
          <span className="tabular-nums text-teal" data-testid="interactive-value">
            {shown}
            {item.control.unit ? ` ${item.control.unit}` : ''}
          </span>
        </label>
        <input
          id={id}
          type="range"
          className="sdq-range mt-3 w-full"
          style={{ ['--fill' as string]: `${((x - item.control.min) / (item.control.max - item.control.min || 1)) * 100}%` }}
          min={item.control.min}
          max={item.control.max}
          step={item.control.step}
          value={x}
          onChange={(e) => {
            setX(Number(e.target.value))
            if (!moved) {
              setMoved(true)
              onDone?.()
            }
          }}
        />
        <div className="flex justify-between text-xs font-bold text-dim tabular-nums" aria-hidden>
          <span>{item.control.log10 ? fmt(Math.pow(10, item.control.min)) : fmt(item.control.min)}</span>
          <span>{item.control.log10 ? fmt(Math.pow(10, item.control.max)) : fmt(item.control.max)}</span>
        </div>
        <dl className="mt-4 grid gap-1.5" aria-live="polite">
          {out.rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-dim font-bold">{r.label}</dt>
              <dd className={`tabular-nums ${r.strong ? 'font-display text-xl text-chalk' : 'font-extrabold text-chalk'}`}>{r.value}</dd>
            </div>
          ))}
        </dl>
        {out.verdict && (
          <p
            className={`mt-3 rounded-xl px-3 py-2 text-sm font-extrabold ${out.verdict.neutral ? 'bg-sky-wash text-teal' : out.verdict.ok ? 'bg-right-wash text-hero-deep' : 'bg-wrong-wash text-wrong-text'}`}
            data-testid="interactive-verdict"
            data-ok={out.verdict.ok}
          >
            {out.verdict.neutral ? '→ ' : out.verdict.ok ? '✓ ' : '✗ '}
            {out.verdict.text}
          </p>
        )}
      </div>
      {moved ? (
        <p className="rounded-2xl bg-right-wash p-4 font-semibold text-chalk" data-testid="interactive-takeaway">
          <span className="font-extrabold">Takeaway. </span>
          {item.takeaway}
        </p>
      ) : (
        <p className="text-sm font-bold text-dim">Move the slider to see what changes.</p>
      )}
    </div>
  )
}

function Predict({ item, onDone }: { item: InteractivePredict; onDone?: () => void }) {
  const [picked, setPicked] = useState<string | null>(null)
  // Authored with the answer first; shuffle once per visit so position gives nothing away
  const [order] = useState(() => item.choices.map((c) => ({ c, k: Math.random() })).sort((a, b) => a.k - b.k).map((x) => x.c))
  const choice = item.choices.find((c) => c.id === picked)
  const right = picked === item.correctId
  return (
    <div className="space-y-4" data-testid="interactive" data-kind={item.kind}>
      <p className="text-chalk font-semibold text-[1.0625rem] leading-relaxed">{item.prompt}</p>
      {item.setup && item.setup.length > 0 && (
        <ul className="space-y-1 rounded-2xl bg-paper-2 p-3 text-[0.9375rem] font-bold text-chalk">
          {item.setup.map((s) => (
            <li key={s} className="flex gap-2">
              <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-dim-warm" />
              {s}
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-2" role="group" aria-label={item.kind === 'tradeoff' ? 'Choose a trade-off' : 'Make a prediction'}>
        {order.map((c) => {
          const state = picked === null ? 'idle' : c.id === item.correctId ? 'right' : c.id === picked ? 'wrong' : 'idle'
          return (
            <button
              key={c.id}
              type="button"
              disabled={picked !== null}
              onClick={() => {
                setPicked(c.id)
                onDone?.()
              }}
              data-testid={`interactive-choice-${c.id}`}
              className={`rounded-2xl border-2 px-4 py-3 text-left font-bold transition-colors ${
                state === 'right' ? 'border-hero bg-right-wash text-hero-deep' : state === 'wrong' ? 'border-heart bg-wrong-wash text-wrong-text' : 'border-[var(--color-rail)] bg-white text-chalk hover:bg-paper-2'
              } disabled:cursor-default`}
            >
              {c.label}
            </button>
          )
        })}
      </div>
      {choice && (
        <div className="space-y-2" aria-live="polite" data-testid="interactive-feedback">
          <p className={`font-extrabold ${right ? 'text-hero-deep' : 'text-wrong-text'}`}>{right ? 'Yes. ' : 'Not quite. '}{choice.feedback}</p>
          <p className="rounded-2xl bg-right-wash p-4 font-semibold text-chalk">
            <span className="font-extrabold">Why. </span>
            {item.reveal}
          </p>
          <button type="button" className="text-sm font-extrabold text-teal" onClick={() => setPicked(null)}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
