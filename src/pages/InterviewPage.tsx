import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { allTopics } from '../content/catalog'
import { BossCanvas, type CanvasSnapshot } from '../components/BossCanvas'
import {
  INTERVIEW_STAGE_MINUTES,
  overallDeadlineMs,
  remainingMs,
  stageDeadlineMs,
} from '../lib/interview/timer'
import { badgeAfterMock } from '../lib/progression/badges'
import { useGameStore } from '../stores/gameStore'

const STAGE_LABELS = ['Requirements', 'Estimation', 'API', 'HLD', 'Deep dive', 'Wrap-up']

export function InterviewPage() {
  const bosses = allTopics.filter((t) => t.kind === 'boss')
  const [bossId, setBossId] = useState(bosses[0]?.id ?? 75)
  const upsertInterview = useGameStore((s) => s.upsertInterview)
  const interviews = useGameStore((s) => s.interviews)
  const setPrefs = useGameStore((s) => s.setPreferences)

  const sessionId = `mock-${bossId}`
  const existing = interviews.find((i) => i.id === sessionId && !i.finished)

  const [startedAt, setStartedAt] = useState(existing?.startedAt ?? 0)
  const [stageIndex, setStageIndex] = useState(existing?.stageIndex ?? 0)
  const [stageStartedAt, setStageStartedAt] = useState(existing?.stageStartedAt ?? 0)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [canvas, setCanvas] = useState<CanvasSnapshot | undefined>(existing?.draft as CanvasSnapshot | undefined)
  const [finished, setFinished] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const boss = bosses.find((b) => b.id === bossId)

  const start = () => {
    const ts = Date.now()
    setStartedAt(ts)
    setStageStartedAt(ts)
    setStageIndex(0)
    setFinished(false)
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
      notes,
      draft: canvas
        ? { nodes: canvas.nodes, edges: canvas.edges, stageAnswers: {}, updatedAt: new Date().toISOString() }
        : undefined,
    })
  }, [startedAt, stageIndex, stageStartedAt, finished, notes, canvas, bossId, sessionId, upsertInterview])

  const overallLeft = startedAt ? remainingMs(overallDeadlineMs(startedAt), now) : 0
  const stageLeft = startedAt ? remainingMs(stageDeadlineMs(startedAt, stageIndex, stageStartedAt), now) : 0

  useEffect(() => {
    if (!startedAt || finished) return
    if (stageLeft <= 0 && stageIndex < STAGE_LABELS.length - 1) {
      const ts = Date.now()
      setStageIndex((i) => i + 1)
      setStageStartedAt(ts)
    }
    if (overallLeft <= 0) setFinished(true)
  }, [stageLeft, overallLeft, startedAt, finished, stageIndex])

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }

  const finishEarly = () => {
    setFinished(true)
    const badges = badgeAfterMock(useGameStore.getState().badges)
    useGameStore.setState({ badges: [...new Set(badges)] })
    useGameStore.getState().recordActivity()
  }

  const summary = useMemo(() => {
    if (!finished) return null
    return {
      auto: 'Structured stages captured locally. Review your notes and canvas against the boss rubric after the mock.',
      self: {
        requirements: 3,
        estimation: 3,
        communication: 3,
      },
    }
  }, [finished])

  return (
    <div className="space-y-4">
      <header className="border-b border-[var(--color-rail)] pb-4">
        <p className="text-sm font-semibold text-[var(--color-amber)]">Mock interview · 45 minutes</p>
        <h1 className="font-display text-4xl font-extrabold text-chalk mt-1">Interview mode</h1>
        <p className="text-[15px] text-dim mt-2 max-w-2xl">
          One scenario, six timed stages, no hints and no reference answer. The clock runs on wall time, so a refresh will not reset it.
        </p>
      </header>

      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm text-dim">
          Scenario
          <select
            className="field mt-1 block min-w-[240px]"
            value={bossId}
            onChange={(e) => setBossId(Number(e.target.value))}
            disabled={Boolean(startedAt && !finished)}
          >
            {bosses.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        </label>
        {!startedAt && (
          <button type="button" onClick={start} className="btn-cta">
            Start mock
          </button>
        )}
        {startedAt && !finished && (
          <button type="button" onClick={finishEarly} className="btn-quiet">
            Finish early
          </button>
        )}
      </div>

      {!startedAt && (
        <section className="panel p-5" aria-labelledby="mock-plan">
          <h2 id="mock-plan" className="font-display text-lg font-bold text-chalk">How the 45 minutes split</h2>
          <ol className="mt-3 grid gap-2 sm:grid-cols-3">
            {STAGE_LABELS.map((label, i) => (
              <li key={label} className="flex items-center gap-3 rounded-md border border-[var(--color-rail)] bg-[var(--color-ink)] px-3 py-2">
                <span className="order-num tabular-nums" aria-hidden>{i + 1}</span>
                <span className="text-sm text-chalk flex-1">{label}</span>
                <span className="text-sm text-dim tabular-nums">{INTERVIEW_STAGE_MINUTES[i]} min</span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-dim mt-3">You get a notes pad and the same architecture canvas as the bosses. Talk through it out loud as you would with an interviewer.</p>
        </section>
      )}

      {startedAt && !finished && (
        <section className="panel p-5 space-y-4" aria-label="Interview clock">
          <div className="flex flex-wrap items-end gap-x-10 gap-y-3">
            <div>
              <p className="text-xs text-dim">Time left overall</p>
              <p className="font-display text-5xl font-extrabold tabular-nums text-chalk leading-none mt-1" data-testid="interview-overall-timer">
                {fmt(overallLeft)}
              </p>
            </div>
            <div>
              <p className="text-xs text-dim">
                Stage {stageIndex + 1} of {STAGE_LABELS.length} · {STAGE_LABELS[stageIndex]}
              </p>
              <p
                className={`font-display text-3xl font-bold tabular-nums leading-none mt-1 ${stageLeft < 60_000 ? 'text-[var(--color-fault)]' : 'text-[var(--color-amber)]'}`}
                aria-live={stageLeft < 60_000 ? 'polite' : 'off'}
              >
                {fmt(stageLeft)}
              </p>
            </div>
          </div>
          <ol className="flex gap-1" aria-label="Stages">
            {STAGE_LABELS.map((label, i) => (
              <li key={label} className="flex-1" style={{ flexGrow: INTERVIEW_STAGE_MINUTES[i] }} aria-current={i === stageIndex ? 'step' : undefined}>
                <div
                  className="h-1.5 rounded-full"
                  style={{ background: i < stageIndex ? 'var(--color-clear)' : i === stageIndex ? 'var(--color-amber)' : 'var(--color-rail)' }}
                />
                <p className={`mt-1 text-[11px] truncate ${i === stageIndex ? 'text-chalk' : 'text-dim'}`}>{label}</p>
              </li>
            ))}
          </ol>
          <p className="text-sm text-[#d6d0c2] border-t border-[var(--color-rail)] pt-3">
            <span className="text-chalk font-semibold">Prompt: </span>
            {boss?.boss?.apiPrompt ?? 'Clarify users, scale, and constraints.'}
          </p>
        </section>
      )}

      {startedAt && !finished && (
        <>
          <label htmlFor="mock-notes" className="block text-sm font-semibold text-chalk -mb-2">Your notes</label>
          <textarea
            id="mock-notes"
            className="field w-full min-h-[140px] text-[15px] leading-relaxed"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Requirements, numbers, API sketch… saved as you type."
          />
          <BossCanvas initial={canvas} onChange={setCanvas} />
        </>
      )}

      {summary && (
        <section className="panel p-5 space-y-4" aria-labelledby="mock-summary">
          <div>
            <p className="text-sm font-semibold text-[var(--color-clear)]">Mock finished</p>
            <h2 id="mock-summary" className="font-display text-2xl font-bold text-chalk mt-1">How did it go?</h2>
            <p className="text-sm text-dim mt-1">{summary.auto}</p>
          </div>
          {notes.trim() && (
            <div className="rounded-md border border-[var(--color-rail)] bg-[var(--color-ink)] p-3">
              <p className="text-xs text-dim mb-1">Your notes</p>
              <p className="text-sm text-chalk whitespace-pre-wrap">{notes}</p>
            </div>
          )}
          <p className="text-sm text-dim">
            Rate yourself 1 to 5 on requirements clarity, estimation and communication. This is self-assessed, nothing is auto-graded.
          </p>
          <div className="flex flex-wrap gap-2">
            {boss && (
              <Link to={`/topic/${boss.slug}`} className="btn-cta">
                Compare with the {boss.title} boss
              </Link>
            )}
            <button type="button" className="btn-quiet" onClick={start}>
              Start a new mock
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
