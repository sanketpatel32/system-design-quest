import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { allTopics } from '../content/catalog'
import { BossCanvas, type CanvasSnapshot } from '../components/BossCanvas'
import { QuestionRenderer } from '../components/QuestionRenderer'
import { gradeBossSubmission } from '../lib/scoring/boss'
import type { UserGraph } from '../lib/scoring/graph'
import { INITIAL_HEARTS } from '../lib/scoring/quiz'
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
    <div className="space-y-6">
      <header className="flex justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl text-red-200">Boss: {topic.title}</h1>
          <p className="text-slate-400">{topic.boss.estimationScenario}</p>
        </div>
        <div className="text-rose-300">{'❤️'.repeat(hearts)}</div>
      </header>

      {topic.bossStages.map((stage) => (
        <section key={stage.id} className="rounded-xl border border-slate-700 p-4">
          <h2 className="text-lg font-semibold text-violet-200">{stage.title}</h2>
          <p className="text-sm text-slate-400 mb-3">{stage.prompt}</p>
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
                onSubmit={(_answer, result) => onAnswer(q.id, result.correct)}
              />
            ))
          )}
        </section>
      ))}

      {!submitted && (
        <button
          type="button"
          disabled={hearts <= 0}
          onClick={submitBoss}
          className="px-4 py-2 rounded-lg bg-red-500/30 border border-red-400/60 disabled:opacity-40"
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
