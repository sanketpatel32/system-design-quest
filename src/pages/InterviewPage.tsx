import { useEffect, useMemo, useState } from 'react'
import { Mascot } from '../components/art/Mascot'
import { PageHero } from '../components/ui/PageHero'
import { Link } from 'react-router-dom'
import { allTopics } from '../content/catalog'
import type { CanvasComponentType } from '../content/types'
import { BossCanvas, type CanvasSnapshot } from '../components/BossCanvas'
import { INTERVIEW_STAGE_MINUTES, overallDeadlineMs, remainingMs, stageDeadlineMs } from '../lib/interview/timer'
import { badgeAfterMock } from '../lib/progression/badges'
import { useGameStore } from '../stores/gameStore'

const STAGES = [
  { label: 'Requirements', ask: 'Ask clarifying questions. Who uses it, which flows matter, what scale, what is out of scope?' },
  { label: 'Estimation', ask: 'Turn the scale into numbers: requests per second at peak, storage per year, bandwidth.' },
  { label: 'API', ask: 'Sketch the main endpoints, their inputs and outputs, and how retries stay safe.' },
  { label: 'High-level design', ask: 'Draw the request path on the canvas: clients, services, stores, queues.' },
  { label: 'Deep dive', ask: 'Pick the riskiest part and go deep: hot keys, failure modes, consistency.' },
  { label: 'Wrap-up', ask: 'Summarise the design, the main trade-off and what you would do next.' },
] as const

const RUBRIC = [
  { key: 'requirements', label: 'Requirements', def: '5: scoped core flows, scale and exclusions before designing. 1: started drawing immediately.' },
  { key: 'estimation', label: 'Estimation', def: '5: clear assumptions, right order of magnitude, used the numbers later. 1: no numbers.' },
  { key: 'design', label: 'Design', def: '5: complete request path with sensible stores, caches and queues. 1: boxes without data flow.' },
  { key: 'depth', label: 'Deep dive', def: '5: found the real bottleneck and handled failure. 1: stayed at the surface.' },
  { key: 'communication', label: 'Communication', def: '5: narrated decisions and trade-offs, managed time. 1: silent or rambling.' },
] as const

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function InterviewPage() {
  const bosses = allTopics.filter((t) => t.kind === 'boss')
  const interviews = useGameStore((s) => s.interviews)
  const upsertInterview = useGameStore((s) => s.upsertInterview)
  const setPrefs = useGameStore((s) => s.setPreferences)

  const latest = [...interviews].sort((a, b) => b.startedAt - a.startedAt)[0]
  const [bossId, setBossId] = useState(latest?.bossId ?? bosses[0]?.id ?? 75)
  const existing = interviews.find((i) => i.id === `mock-${bossId}`)
  const sessionId = `mock-${bossId}`
  const boss = bosses.find((b) => b.id === bossId)

  const [startedAt, setStartedAt] = useState(existing?.startedAt ?? 0)
  const [stageIndex, setStageIndex] = useState(existing?.stageIndex ?? 0)
  const [stageStartedAt, setStageStartedAt] = useState(existing?.stageStartedAt ?? 0)
  const [stageNotes, setStageNotes] = useState<string[]>(
    existing?.stageNotes ?? (existing?.notes ? [existing.notes] : []),
  )
  const [canvas, setCanvas] = useState<CanvasSnapshot | undefined>(existing?.draft as CanvasSnapshot | undefined)
  const [finished, setFinished] = useState(existing?.finished ?? false)
  const [ratings, setRatings] = useState<Record<string, number>>(existing?.selfAssessment ?? {})
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const switchScenario = (id: number) => {
    const s = interviews.find((i) => i.id === `mock-${id}`)
    setBossId(id)
    setStartedAt(s?.startedAt ?? 0)
    setStageIndex(s?.stageIndex ?? 0)
    setStageStartedAt(s?.stageStartedAt ?? 0)
    setStageNotes(s?.stageNotes ?? [])
    setCanvas(s?.draft as CanvasSnapshot | undefined)
    setFinished(s?.finished ?? false)
    setRatings(s?.selfAssessment ?? {})
  }

  const start = () => {
    const ts = Date.now()
    setStartedAt(ts)
    setStageStartedAt(ts)
    setStageIndex(0)
    setFinished(false)
    setStageNotes([])
    setCanvas(undefined)
    setRatings({})
    setPrefs({ hasGestureForSound: true })
  }

  useEffect(() => {
    if (!startedAt) return
    upsertInterview({
      id: sessionId,
      bossId,
      startedAt,
      stageIndex,
      stageStartedAt,
      finished,
      notes: stageNotes.filter(Boolean).join('\n\n'),
      stageNotes,
      selfAssessment: ratings,
      draft: canvas ? { nodes: canvas.nodes, edges: canvas.edges, stageAnswers: {}, updatedAt: new Date().toISOString() } : undefined,
    })
  }, [startedAt, stageIndex, stageStartedAt, finished, stageNotes, ratings, canvas, bossId, sessionId, upsertInterview])

  const overallLeft = startedAt ? remainingMs(overallDeadlineMs(startedAt), now) : 0
  const stageLeft = startedAt ? remainingMs(stageDeadlineMs(startedAt, stageIndex, stageStartedAt), now) : 0

  useEffect(() => {
    if (!startedAt || finished) return
    if (stageLeft <= 0 && stageIndex < STAGES.length - 1) {
      setStageIndex((i) => i + 1)
      setStageStartedAt(Date.now())
    }
    if (overallLeft <= 0) setFinished(true)
  }, [stageLeft, overallLeft, startedAt, finished, stageIndex])

  const finish = () => {
    setFinished(true)
    useGameStore.setState({ badges: [...new Set(badgeAfterMock(useGameStore.getState().badges))] })
    useGameStore.getState().recordActivity()
  }

  const goToStage = (i: number) => {
    setStageIndex(i)
    setStageStartedAt(Date.now())
  }

  const suggested = useMemo(
    () => (boss?.boss?.rubric.requiredCapabilities ?? []) as CanvasComponentType[],
    [boss],
  )
  const running = Boolean(startedAt) && !finished
  const scenario = boss?.boss

  return (
    <div className="space-y-5">
      <PageHero eyebrow="Mock interview · 45 minutes" title="Interview mode" icon="interview" tone="orange">
        One scenario, six timed stages, no hints. The reference answer appears only after you finish.
      </PageHero>

      {!running && (
        <div className="flex flex-wrap gap-3 items-end">
          <label className="text-sm text-dim">
            Scenario
            <select className="field mt-1 block min-w-[260px]" value={bossId} onChange={(e) => switchScenario(Number(e.target.value))}>
              {bosses.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </label>
          {!startedAt && (
            <button type="button" onClick={start} className="btn-cta">Start mock</button>
          )}
        </div>
      )}

      {!startedAt && scenario && (
        <section className="panel p-5 space-y-4" aria-labelledby="brief">
          <div>
            <h2 id="brief" className="font-display text-xl font-bold text-chalk">Brief: {boss.title}</h2>
            <p className="text-[0.9375rem] text-chalk mt-1">
              Your interviewer says: “Design {boss.title}.” Treat the details below as what you would learn by asking.
            </p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3 text-sm">
            <div><dt className="text-dim">Users want to</dt><dd className="text-chalk mt-0.5">{scenario.functionalRequirements.join('; ')}</dd></div>
            <div><dt className="text-dim">It must</dt><dd className="text-chalk mt-0.5">{scenario.nonFunctionalRequirements.join('; ')}</dd></div>
            <div><dt className="text-dim">Out of scope</dt><dd className="text-chalk mt-0.5">{scenario.exclusions.join('; ')}</dd></div>
          </dl>
          <ol className="grid gap-2 sm:grid-cols-3">
            {STAGES.map((s, i) => (
              <li key={s.label} className="flex items-center gap-3 rounded-2xl border border-[var(--color-rail)] bg-[var(--color-ink)] px-3 py-2">
                <span className="order-num tabular-nums" aria-hidden>{i + 1}</span>
                <span className="text-sm text-chalk flex-1">{s.label}</span>
                <span className="text-sm text-dim tabular-nums">{INTERVIEW_STAGE_MINUTES[i]} min</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {running && (
        <>
          <section className="panel p-5 space-y-4" aria-label="Interview clock">
            <div className="flex flex-wrap items-end gap-x-10 gap-y-3">
              <div>
                <p className="text-xs text-dim">{boss?.title} · time left</p>
                <p className="font-display text-5xl font-extrabold tabular-nums text-chalk leading-none mt-1" data-testid="interview-overall-timer">
                  {fmt(overallLeft)}
                </p>
              </div>
              <div>
                <p className="text-xs text-dim">Stage {stageIndex + 1} of {STAGES.length} · {STAGES[stageIndex]!.label}</p>
                <p className={`font-display text-3xl font-bold tabular-nums leading-none mt-1 ${stageLeft < 60_000 ? 'text-[var(--color-fault)]' : 'text-[var(--color-amber)]'}`}>
                  {fmt(stageLeft)}
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                {stageIndex < STAGES.length - 1 && (
                  <button type="button" className="btn-quiet" onClick={() => goToStage(stageIndex + 1)}>Next stage</button>
                )}
                <button type="button" onClick={finish} className="btn-quiet">Finish early</button>
              </div>
            </div>
            <ol className="flex gap-1" aria-label="Stages">
              {STAGES.map((s, i) => (
                <li key={s.label} className="flex-1" style={{ flexGrow: INTERVIEW_STAGE_MINUTES[i] }} aria-current={i === stageIndex ? 'step' : undefined}>
                  <div className="h-3 rounded-full" style={{ background: i < stageIndex ? 'var(--color-hero)' : i === stageIndex ? '#1CB0F6' : '#ECE7DF' }} />
                  <p className={`mt-1 text-[0.6875rem] truncate ${i === stageIndex ? 'text-chalk' : 'text-dim'}`}>{s.label}</p>
                </li>
              ))}
            </ol>
            <p className="text-[0.9375rem] text-chalk border-t border-[var(--color-rail)] pt-3">{STAGES[stageIndex]!.ask}</p>
          </section>
          <div>
            <label htmlFor="mock-notes" className="block text-sm font-semibold text-chalk mb-1">
              Notes for {STAGES[stageIndex]!.label.toLowerCase()}
            </label>
            <textarea
              id="mock-notes"
              className="field w-full min-h-[130px] text-[0.9375rem] leading-relaxed"
              value={stageNotes[stageIndex] ?? ''}
              onChange={(e) => {
                const next = [...stageNotes]
                next[stageIndex] = e.target.value
                setStageNotes(next)
              }}
              placeholder="Saved as you type."
            />
          </div>
          {stageIndex >= 3 && <BossCanvas key={sessionId} initial={canvas} onChange={setCanvas} suggested={suggested} />}
        </>
      )}

      {startedAt > 0 && finished && boss && (
        <section className="space-y-4" aria-labelledby="mock-summary">
          <div className="panel p-5">
            <div className="flex items-center gap-4">
              <Mascot mood="happy" size={84} className="anim-pop shrink-0" />
              <div>
                <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-clear)]">Mock finished</p>
                <h2 id="mock-summary" className="font-display text-3xl text-chalk mt-1">{boss.title}: your answers</h2>
                <p className="font-bold text-dim">Rate each part honestly, then compare with the reference.</p>
              </div>
            </div>
            <ol className="mt-3 space-y-2">
              {STAGES.map((s, i) => (
                <li key={s.label} className="rounded-2xl border-2 border-[var(--color-rail)] bg-white p-3">
                  <p className="text-xs text-dim">{s.label}</p>
                  <p className="text-sm text-chalk whitespace-pre-wrap mt-0.5">{stageNotes[i]?.trim() || 'No notes for this stage.'}</p>
                </li>
              ))}
            </ol>
            <p className="text-sm text-dim mt-3">
              Canvas: {canvas?.nodes.length ? `${canvas.nodes.map((n) => n.label).join(', ')}; ${canvas.edges.length} connection${canvas.edges.length === 1 ? '' : 's'}.` : 'nothing drawn.'}
            </p>
          </div>

          <fieldset className="panel p-5 space-y-3">
            <legend className="font-display text-xl text-chalk px-1">Rate yourself, 1 to 5</legend>
            {RUBRIC.map((r) => (
              <div key={r.key} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center border-b border-[var(--color-rail)] pb-3 last:border-0">
                <div>
                  <p className="text-chalk">{r.label}</p>
                  <p className="text-xs text-dim">{r.def}</p>
                </div>
                <div className="flex gap-1" role="radiogroup" aria-label={`${r.label} rating`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={ratings[r.key] === n}
                      className={`rating-btn ${ratings[r.key] === n ? 'rating-btn-on' : ''}`}
                      onClick={() => setRatings({ ...ratings, [r.key]: n })}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>

          <details className="panel p-5" open>
            <summary className="cursor-pointer font-display text-lg font-bold text-chalk">Reference solution</summary>
            <div className="mt-3 space-y-2 text-sm text-chalk leading-relaxed">
              <p>{boss.boss?.referenceNotes}</p>
              <p><span className="text-chalk font-semibold">Estimate: </span>{boss.boss?.workedEstimate}</p>
              <pre className="whitespace-pre-wrap rounded-2xl border border-[var(--color-rail)] bg-[#f7f5f0] p-3 text-[0.8125rem] text-chalk">{boss.boss?.exampleApi}</pre>
              <p><span className="text-chalk font-semibold">Trade-offs: </span>{boss.boss?.tradeoffAnalysis}</p>
            </div>
          </details>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-cta" onClick={start}>Retry this scenario</button>
            <button type="button" className="btn-quiet" onClick={() => { setStartedAt(0); setFinished(false) }}>New mock</button>
            <Link to={`/topic/${boss.slug}`} className="btn-quiet">Open the {boss.title} boss</Link>
          </div>
        </section>
      )}
    </div>
  )
}
