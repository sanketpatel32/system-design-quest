import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { allTopics } from '../content/catalog'
import { BossCanvas, type CanvasSnapshot } from '../components/BossCanvas'
import { QuestionRenderer } from '../components/QuestionRenderer'
import { gradeBossSubmission, type BossBreakdown } from '../lib/scoring/boss'
import type { UserGraph } from '../lib/scoring/graph'
import { INITIAL_HEARTS } from '../lib/scoring/quiz'
import { HeartsHud } from '../components/ui/Hud'
import { useGameStore } from '../stores/gameStore'

const RUBRIC: { key: keyof BossBreakdown; label: string; max: number }[] = [
  { key: 'requirements', label: 'Requirements', max: 15 },
  { key: 'estimation', label: 'Estimation', max: 15 },
  { key: 'api', label: 'API design', max: 10 },
  { key: 'architecture', label: 'Architecture', max: 30 },
  { key: 'deepDive', label: 'Deep dive', max: 20 },
  { key: 'tradeoffs', label: 'Trade-offs', max: 10 },
]

export function BossPage() {
  const { slug } = useParams()
  const topic = allTopics.find((t) => t.slug === slug && t.kind === 'boss')
  const markBossSubmission = useGameStore((s) => s.markBossSubmission)
  const saveBossDraft = useGameStore((s) => s.saveBossDraft)
  const draft = useGameStore((s) => (topic ? s.bossProgress.drafts[topic.id] : undefined))

  const [hearts, setHearts] = useState(INITIAL_HEARTS)
  const [stageResults, setStageResults] = useState<Record<string, boolean>>({})
  const [canvas, setCanvas] = useState<CanvasSnapshot | undefined>(draft as CanvasSnapshot | undefined)
  const [submitted, setSubmitted] = useState(false)
  const [grade, setGrade] = useState<ReturnType<typeof gradeBossSubmission> | null>(null)

  const graph: UserGraph = useMemo(
    () => ({
      nodes: (canvas?.nodes ?? []).map((n) => ({ id: n.id, type: n.type, label: n.label })),
      edges: (canvas?.edges ?? []).map((e) => ({ source: e.source, target: e.target, label: e.label })),
    }),
    [canvas],
  )

  const activeId = topic?.bossStages?.flatMap((st) => (st.kind === 'architecture' ? [] : st.questions)).find((q) => !(q.id in stageResults))?.id

  if (!topic || !topic.boss || !topic.bossStages) {
    return (
      <div className="py-6">
        <h1 className="font-display text-3xl font-extrabold text-chalk">Boss not found</h1>
        <Link to="/" className="btn-cta mt-4">Back to the map</Link>
      </div>
    )
  }

  const onAnswer = (qid: string, correct: boolean) => {
    setStageResults((r) => ({ ...r, [qid]: correct }))
    if (!correct) setHearts((h) => Math.max(0, h - 1))
  }

  const submitBoss = () => {
    if (hearts <= 0) return
    const allQuestions = topic.bossStages!.flatMap((s) => s.questions)
    const result = gradeBossSubmission(topic.boss!, stageResults, allQuestions, graph)
    setGrade(result)
    setSubmitted(true)
    markBossSubmission(topic.id, result.total, result.breakdown as unknown as Record<string, number>)
  }

  return (
    <div className="space-y-6 max-w-[960px]">
      <header className="flex justify-between items-start gap-4 flex-wrap border-b border-[var(--color-rail)] pb-4">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[var(--color-fault)]">Boss · topic {topic.id}</p>
          <h1 className="font-display text-4xl font-extrabold text-chalk mt-1 leading-tight">{topic.title}</h1>
          <p className="text-[15px] text-dim mt-2">{topic.boss.estimationScenario}</p>
        </div>
        <HeartsHud hearts={hearts} />
      </header>

      {topic.bossStages.map((stage, si) => (
        <section key={stage.id} className="boss-stage" aria-labelledby={`stage-${stage.id}`}>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="boss-stage-num" aria-hidden>{si + 1}</span>
            <div>
              <h2 id={`stage-${stage.id}`} className="font-display text-xl font-bold text-chalk">{stage.title}</h2>
              <p className="text-sm text-dim">{stage.prompt}</p>
            </div>
          </div>
          <div className="space-y-4">
          {stage.kind === 'architecture' ? (
            <BossCanvas
              initial={canvas}
              onChange={(snap) => {
                setCanvas(snap)
                saveBossDraft(topic.id, { ...snap, stageAnswers: {}, updatedAt: new Date().toISOString() })
              }}
            />
          ) : (
            stage.questions.map((q) => (
              <QuestionRenderer
                key={q.id}
                question={q}
                locked={q.id in stageResults}
                hotkeys={q.id === activeId}
                onSubmit={(_answer, result) => onAnswer(q.id, result.correct)}
              />
            ))
          )}
          </div>
        </section>
      ))}

      {!submitted && (
        <button
          type="button"
          disabled={hearts <= 0}
          onClick={submitBoss}
          className="btn-cta disabled:opacity-40"
        >
          Submit boss attempt
        </button>
      )}

      {grade && (
        <section className="panel p-5 space-y-5" aria-labelledby="boss-score" role="status">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={`text-sm font-semibold ${grade.passed ? 'text-[var(--color-clear)]' : 'text-[var(--color-amber)]'}`}>
                {grade.passed ? 'Boss cleared · 70 needed to pass' : 'Not cleared yet · 70 needed to pass'}
              </p>
              <h2 id="boss-score" className="font-display text-3xl font-extrabold text-chalk mt-1">
                Score: <span className="tabular-nums">{grade.total}</span>
                <span className="text-dim text-xl font-semibold">/100</span>
              </h2>
            </div>
          </div>
          <div className="score-track" aria-hidden>
            <div className="score-fill" style={{ width: `${grade.total}%`, background: grade.passed ? 'var(--color-clear)' : 'var(--color-amber)' }} />
            <div className="score-pass" />
          </div>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {RUBRIC.map(({ key, label, max }) => {
              const v = grade.breakdown[key]
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm">
                    <dt className="text-chalk">{label}</dt>
                    <dd className="tabular-nums text-dim">
                      <span className="text-chalk font-semibold">{v}</span> / {max}
                    </dd>
                  </div>
                  <div className="score-track score-track-thin mt-1" aria-hidden>
                    <div className="score-fill" style={{ width: `${(v / max) * 100}%`, background: v === max ? 'var(--color-clear)' : 'var(--color-dim)' }} />
                  </div>
                </div>
              )
            })}
          </dl>
          {grade.feedback.length > 0 && (
            <div>
              <h3 className="font-display font-semibold text-chalk mb-2">What to fix</h3>
              <ul className="text-sm text-chalk space-y-1.5">
                {grade.feedback.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-amber)]" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <details className="reference rounded-2xl border border-[var(--color-rail)] bg-[var(--color-ink)]">
            <summary className="cursor-pointer px-4 py-3 font-display font-semibold text-chalk">Reference architecture and notes</summary>
            <div className="px-4 pb-4 space-y-3 text-sm text-chalk leading-relaxed">
              <p>{topic.boss.referenceNotes}</p>
              <p>
                <span className="text-chalk font-semibold">Estimate: </span>
                {topic.boss.workedEstimate}
              </p>
              <pre className="whitespace-pre-wrap rounded-2xl border border-[var(--color-rail)] bg-[#f7f5f0] p-3 text-[13px] text-chalk">{topic.boss.exampleApi}</pre>
              <p>
                <span className="text-chalk font-semibold">Trade-offs: </span>
                {topic.boss.tradeoffAnalysis}
              </p>
            </div>
          </details>
          {!grade.passed && (
            <button type="button" className="btn-quiet" onClick={() => { setSubmitted(false); setGrade(null) }}>
              Revise the design and resubmit
            </button>
          )}
        </section>
      )}

      <Link to="/" className="btn-quiet">Back to map</Link>
    </div>
  )
}
