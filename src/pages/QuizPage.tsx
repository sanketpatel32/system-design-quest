import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { allTopics } from '../content/catalog'
import { QuestionRenderer } from '../components/QuestionRenderer'
import { HeartsHud } from '../components/ui/Hud'
import { transitLineColor } from '../lib/design/transitTheme'
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
  const accent = topic ? transitLineColor(topic.region) : 'var(--color-amber)'

  useEffect(() => {
    if (topicId) startQuizAttempt(topicId)
  }, [topicId, startQuizAttempt])

  if (!topic) return <p className="text-[var(--color-muted)]">Topic not found</p>

  const answered = Object.keys(attempt.results)
  const allDone = topic.questions.every((q) => q.id in attempt.results)
  const heartsOut = attempt.hearts <= 0
  const activeId = topic.questions.find((q) => !(q.id in attempt.results))?.id

  const tryFinish = () => {
    const res = finishQuizIfReady(topic.id)
    if (res.cleared) {
      fireConfetti(prefs.reducedMotion)
      playCelebrationSound(prefs.soundEnabled, prefs.hasGestureForSound)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex justify-between items-start gap-4 border-b border-[var(--color-rail)] pb-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: accent }}>Quiz · topic {topic.id}</p>
          <h1 className="font-display text-3xl font-extrabold text-chalk mt-1 leading-tight">{topic.title}</h1>
          <p className="text-sm text-dim mt-1">
            {answered.length} of {topic.questions.length} answered · clear 70% with at least one heart left
          </p>
        </div>
        <HeartsHud hearts={attempt.hearts} />
      </div>
      {heartsOut && (
        <div className="panel-slab p-4 border-l-2 border-rose-500">
          <p className="text-sm">Out of lives. Review the deck, then retry.</p>
          <div className="flex gap-2 mt-3">
            <Link to={`/topic/${topic.slug}`} className="btn-quiet">Review</Link>
            <button type="button" className="btn-cta" onClick={() => startQuizAttempt(topic.id)}>
              Retry
            </button>
          </div>
        </div>
      )}
      <div className="space-y-5">
        {topic.questions.map((q, i) => (
          <QuestionRenderer
            key={q.id}
            number={i + 1}
            total={topic.questions.length}
            question={q}
            locked={q.id in attempt.results}
            hotkeys={!heartsOut && q.id === activeId}
            initialAnswer={attempt.answers[q.id]}
            onSubmit={(answer) => recordQuizAnswer(topic.id, q, answer)}
          />
        ))}
      </div>
      {allDone && !heartsOut && (
        <button type="button" onClick={tryFinish} className="btn-cta">
          Claim progress
        </button>
      )}
      <p className="text-xs text-dim">
        Shortcuts: <kbd className="kbd">1</kbd>–<kbd className="kbd">4</kbd> pick an option, <kbd className="kbd">Enter</kbd> submits the current question.
      </p>
    </div>
  )
}
