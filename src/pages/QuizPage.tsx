import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { allTopics } from '../content/catalog'
import { QuestionRenderer } from '../components/QuestionRenderer'
import { fireConfetti, playCelebrationSound } from '../lib/celebrate'
import { INITIAL_HEARTS } from '../lib/scoring/quiz'
import { useGameStore } from '../stores/gameStore'

export function QuizPage() {
  const { slug } = useParams()
  const topic = allTopics.find((t) => t.slug === slug)
  const topicId = topic?.id
  const attemptKey = topicId ? `topic-${topicId}` : ''
  const startQuizAttempt = useGameStore((s) => s.startQuizAttempt)
  const recordQuizAnswer = useGameStore((s) => s.recordQuizAnswer)
  const finishQuizIfReady = useGameStore((s) => s.finishQuizIfReady)
  const attempt = useGameStore((s) =>
    attemptKey
      ? s.quizAttempts[attemptKey] ?? {
          hearts: INITIAL_HEARTS,
          answers: {},
          results: {},
          completed: false,
        }
      : { hearts: INITIAL_HEARTS, answers: {}, results: {}, completed: false },
  )
  const prefs = useGameStore((s) => s.preferences)

  useEffect(() => {
    if (topicId) startQuizAttempt(topicId)
  }, [topicId, startQuizAttempt])

  if (!topic) return <p>Topic not found</p>

  const answered = Object.keys(attempt.results)
  const allDone = topic.questions.every((q) => q.id in attempt.results)
  const heartsOut = attempt.hearts <= 0

  const tryFinish = () => {
    const res = finishQuizIfReady(topic.id)
    if (res.cleared) {
      fireConfetti(prefs.reducedMotion)
      playCelebrationSound(prefs.soundEnabled, prefs.hasGestureForSound)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quiz: {topic.title}</h1>
        <div className="text-rose-300" aria-label="Hearts">
          {'❤️'.repeat(attempt.hearts)}{'🖤'.repeat(Math.max(0, INITIAL_HEARTS - attempt.hearts))}
        </div>
      </div>
      {heartsOut && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4">
          <p>Out of hearts. Review the lesson and retry.</p>
          <div className="flex gap-2 mt-2">
            <Link to={`/topic/${topic.slug}`} className="px-3 py-1 rounded border border-slate-600">Review</Link>
            <button type="button" className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-400/40" onClick={() => startQuizAttempt(topic.id)}>
              Retry
            </button>
          </div>
        </div>
      )}
      <div className="space-y-6">
        {topic.questions.map((q) => (
          <QuestionRenderer
            key={q.id}
            question={q}
            locked={q.id in attempt.results}
            initialAnswer={attempt.answers[q.id]}
            onSubmit={(answer) => recordQuizAnswer(topic.id, q, answer)}
          />
        ))}
      </div>
      {allDone && !heartsOut && (
        <button type="button" onClick={tryFinish} className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/50">
          Claim progress
        </button>
      )}
      <p className="text-xs text-slate-500">Answered {answered.length}/{topic.questions.length}. Need ≥70% correct with hearts remaining.</p>
    </div>
  )
}
