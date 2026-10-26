import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { allTopics } from '../content/catalog'
import { SECTIONS, isSectionId, sectionTopics, shortName } from '../content/sections'
import { QuestionRenderer } from '../components/QuestionRenderer'
import { Mascot } from '../components/art/Mascot'
import { ComboChip } from '../components/ui/ComboChip'
import { ROUND_SIZE, bestRun, byteReaction, pickRound } from '../lib/fun/fun'


const newSeed = () => Math.random().toString(36).slice(2)

/** Quick play: a short mixed round of questions from across the course. Nothing to lose, nothing gated. */
export function PlayPage() {
  const [params, setParams] = useSearchParams()
  const s = params.get('s') ?? undefined
  const section = isSectionId(s) ? s : undefined
  const [seed, setSeed] = useState(() => params.get('seed') ?? newSeed())
  /** ?n= picks a shorter or longer round (3 to 15) */
  const size = Math.min(15, Math.max(3, Number(params.get('n')) || ROUND_SIZE))
  const round = useMemo(() => pickRound(section ? sectionTopics(section) : allTopics, size, `${section ?? 'all'}-${seed}`), [section, seed, size])
  const [step, setStep] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [reaction, setReaction] = useState('')

  const restart = (next?: string) => {
    setSeed(newSeed())
    setStep(0)
    setResults([])
    setReaction('')
    if (next !== undefined) setParams(next ? { s: next } : {}, { replace: true })
  }

  const done = step >= round.length
  const correct = results.filter(Boolean).length
  const combo = (() => {
    let n = 0
    for (let i = results.length - 1; i >= 0 && results[i]; i--) n++
    return n
  })()
  const item = round[Math.min(step, round.length - 1)]

  if (!item) return <p className="py-10 text-center font-bold text-dim">No questions here yet.</p>

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <header className="mb-3 flex items-center gap-3 sm:mb-6 sm:gap-4">
        <Link to="/" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-dim hover:bg-paper-3" aria-label="Leave quick play">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" /></svg>
        </Link>
        <div className="progress-track flex-1" role="progressbar" aria-label="Round progress" aria-valuemin={0} aria-valuemax={round.length} aria-valuenow={results.length}>
          <div className="progress-fill" style={{ ['--fill' as string]: `${Math.max(results.length ? 6 : 0, (results.length / round.length) * 100)}%` }} />
        </div>
        <ComboChip combo={combo} />
      </header>

      {!done && step === 0 && results.length === 0 && (
        <label className="mb-4 flex items-center gap-2 sm:hidden">
          <span className="whitespace-nowrap text-sm font-extrabold text-dim">Mix from</span>
          <select className="field !min-h-[44px] min-w-0 flex-1 font-extrabold" value={section ?? ''} onChange={(e) => restart(e.target.value)} data-testid="play-mix">
            <option value="">Everything</option>
            {SECTIONS.map((x) => <option key={x.id} value={x.id}>{shortName(x)}</option>)}
          </select>
        </label>
      )}
      {!done && step === 0 && results.length === 0 && (
        <div className="mb-4 hidden flex-wrap items-center gap-2 sm:flex" role="group" aria-label="Pick what to mix">
          <span className="text-sm font-extrabold text-dim">Mix from</span>
          <button type="button" className={`play-pill ${!section ? 'play-pill-on' : ''}`} aria-pressed={!section} onClick={() => restart('')}>Everything</button>
          {SECTIONS.map((x) => (
            <button key={x.id} type="button" className={`play-pill ${section === x.id ? 'play-pill-on' : ''}`} aria-pressed={section === x.id} onClick={() => restart(x.id)}>
              {x.name.replace('Operating Systems & Concurrency', 'OS')}
            </button>
          ))}
        </div>
      )}

      {done ? (
        <section className="py-4 text-center" aria-labelledby="play-result" role="status" data-testid="play-result">
          <Mascot mood={correct >= Math.ceil(round.length * 0.7) ? 'happy' : 'think'} size={130} className="mx-auto anim-pop" />
          <h1 id="play-result" className="font-display mt-3 text-4xl text-chalk">{correct}/{round.length} correct</h1>
          <p className="mt-1 text-lg font-bold text-dim">
            {bestRun(results) >= 2 ? `Best run: ${bestRun(results)} in a row. ` : ''}
            {correct === round.length ? 'Flawless round.' : correct >= round.length / 2 ? 'Solid round.' : 'Every miss points at a lesson worth a look.'}
          </p>
          {results.some((r) => !r) && (
            <div className="mx-auto mt-6 max-w-xl text-left">
              <h2 className="font-display text-xl text-chalk mb-3">Worth a look</h2>
              <ul className="space-y-2">
                {round.map((x, i) => (results[i] ? null : (
                  <li key={x.question.id + i} className="panel flex flex-wrap items-center justify-between gap-2 p-3">
                    <span className="min-w-0 font-bold text-chalk">{x.topicTitle}</span>
                    <Link to={`/topic/${x.topicSlug}`} className="tap-link font-extrabold text-teal hover:underline">Read the lesson</Link>
                  </li>
                )))}
              </ul>
            </div>
          )}
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button type="button" className="btn-cta min-w-[220px]" onClick={() => restart()} data-testid="play-again">Play another round</button>
            <Link to="/" className="btn-quiet min-w-[220px]">Back to learning</Link>
          </div>
        </section>
      ) : (
        <>
          <p className="mb-2 text-sm font-extrabold text-dim">
            Quick play · from <Link to={`/topic/${item.topicSlug}`} className="text-teal hover:underline">{item.topicTitle}</Link>
          </p>
          <QuestionRenderer
            key={`${item.question.id}-${step}-${seed}`}
            scrambleSeed={seed}
            question={item.question}
            number={step + 1}
            total={round.length}
            sheet={{
              onContinue: () => setStep((x) => x + 1),
              continueLabel: step === round.length - 1 ? 'See result' : 'Continue',
              reaction,
            }}
            onSubmit={(_, r) => {
              setReaction(byteReaction(r.correct, r.correct ? combo + 1 : 0, `${item.question.id}-${seed}`))
              setResults((x) => [...x.slice(0, step), r.correct])
            }}
          />
        </>
      )}
    </div>
  )
}
