import { useEffect, useMemo, useState } from 'react'
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
      <h1 className="text-3xl font-bold text-lime-200">Interview Mode (45 min)</h1>
      <p className="text-slate-400">Timers use wall-clock timestamps — refresh won&apos;t reset them. Reference solutions stay hidden.</p>

      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          Boss scenario
          <select
            className="ml-2 bg-slate-800 border border-slate-600 rounded px-2 py-1"
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
          <button type="button" onClick={start} className="px-4 py-2 rounded-lg bg-lime-500/20 border border-lime-400/50">
            Start mock
          </button>
        )}
        {startedAt && !finished && (
          <button type="button" onClick={finishEarly} className="px-4 py-2 rounded-lg border border-slate-600">
            Finish early
          </button>
        )}
      </div>

      {startedAt && !finished && (
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-cyan-500/30 p-3">Overall: {fmt(overallLeft)}</div>
          <div className="rounded-lg border border-violet-500/30 p-3">Stage {stageIndex + 1}: {STAGE_LABELS[stageIndex]} ({INTERVIEW_STAGE_MINUTES[stageIndex]}m) — {fmt(stageLeft)}</div>
          <div className="rounded-lg border border-slate-600 p-3">Prompt: {boss?.boss?.apiPrompt ?? 'Clarify users, scale, and constraints.'}</div>
        </div>
      )}

      {startedAt && !finished && (
        <>
          <textarea
            className="w-full min-h-[120px] bg-slate-900 border border-slate-700 rounded p-3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Interview notes…"
          />
          <BossCanvas initial={canvas} onChange={setCanvas} />
        </>
      )}

      {summary && (
        <section className="rounded-xl border border-lime-400/30 p-4 space-y-2">
          <h2 className="text-xl font-semibold">Mock summary</h2>
          <p>{summary.auto}</p>
          <p className="text-sm text-slate-400">Self-assessment rubric (not AI-graded): rate 1–5 on requirements clarity, estimation, and communication.</p>
        </section>
      )}
    </div>
  )
}
