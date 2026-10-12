import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { allTopics } from '../content/catalog'
import { BossCanvas, type CanvasSnapshot } from '../components/BossCanvas'
import { QuestionRenderer } from '../components/QuestionRenderer'
import { gradeBossSubmission } from '../lib/scoring/boss'
import type { UserGraph } from '../lib/scoring/graph'
import { INITIAL_HEARTS } from '../lib/scoring/quiz'
import { HeartsHud } from '../components/ui/Hud'
import { useGameStore } from '../stores/gameStore'

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
    return <p>Boss not found</p>
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
        <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
          <h3 className="text-xl font-semibold">Score: {grade.total}/100 {grade.passed ? '✅' : '— keep iterating'}</h3>
          <ul className="text-sm text-slate-300 grid sm:grid-cols-2 gap-1">
            {Object.entries(grade.breakdown).map(([k, v]) => (
              <li key={k}>{k}: {v}</li>
            ))}
          </ul>
          <ul className="text-sm text-slate-400 list-disc pl-5">
            {grade.feedback.map((f) => <li key={f}>{f}</li>)}
          </ul>
          <details className="text-sm">
            <summary className="cursor-pointer text-cyan-300">Reference architecture & notes</summary>
            <p className="mt-2">{topic.boss.referenceNotes}</p>
            <p>{topic.boss.workedEstimate}</p>
            <pre className="whitespace-pre-wrap bg-slate-900/60 p-2 rounded">{topic.boss.exampleApi}</pre>
            <p>{topic.boss.tradeoffAnalysis}</p>
          </details>
        </section>
      )}

      <Link to="/" className="text-cyan-300">← Map</Link>
    </div>
  )
}
