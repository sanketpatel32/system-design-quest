import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { allTopics, orderedTopicsInRegion } from '../content/catalog'
import { QuestionRenderer } from '../components/QuestionRenderer'
import { HeartsHud } from '../components/ui/Hud'
import { transitLineColor } from '../lib/design/transitTheme'
import { fireConfetti, playCelebrationSound } from '../lib/celebrate'
import { BADGE_LABELS } from '../lib/progression/badges'
import { INITIAL_HEARTS, PASS_PERCENT } from '../lib/scoring/quiz'
import { useGameStore } from '../stores/gameStore'

type Claim = { xpGained: number; newBadges: string[] } | null

export function QuizPage() {
  const { slug } = useParams()
  const topic = allTopics.find((t) => t.slug === slug)
  const topicId = topic?.id
  const attemptKey = topicId ? `topic-${topicId}` : ''
  const startQuizAttempt = useGameStore((s) => s.startQuizAttempt)
  const resetQuizAttempt = useGameStore((s) => s.resetQuizAttempt)
  const recordQuizAnswer = useGameStore((s) => s.recordQuizAnswer)
  const finishQuizIfReady = useGameStore((s) => s.finishQuizIfReady)
  const alreadyCleared = useGameStore((s) => (topicId ? Boolean(s.topicProgress[topicId]?.completed) : false))
  const attempt = useGameStore((s) =>
    attemptKey ? s.quizAttempts[attemptKey] : undefined,
  ) ?? { hearts: INITIAL_HEARTS, answers: {}, results: {} as Record<string, boolean>, completed: false }
  const prefs = useGameStore((s) => s.preferences)
  const accent = topic ? transitLineColor(topic.region) : 'var(--color-amber)'

  const [index, setIndex] = useState<number | null>(null)
  const [practice, setPractice] = useState(0)
  const [claim, setClaim] = useState<Claim>(null)

  useEffect(() => {
    if (topicId) startQuizAttempt(topicId)
  }, [topicId, startQuizAttempt])

  if (!topic)
    return (
      <div className="py-6">
        <h1 className="font-display text-3xl font-extrabold text-chalk">Quiz not found</h1>
        <Link to="/" className="btn-cta mt-4">Back to the map</Link>
      </div>
    )

  const results = (attempt as { results?: Record<string, boolean> }).results ?? {}
  const total = topic.questions.length
  const answeredCount = topic.questions.filter((q) => q.id in results).length
  const correctCount = topic.questions.filter((q) => results[q.id]).length
  const need = Math.ceil((PASS_PERCENT / 100) * total)
  const heartsOut = attempt.hearts <= 0
  const allDone = answeredCount === total
  const firstOpen = topic.questions.findIndex((q) => !(q.id in results))
  const current = index ?? (firstOpen === -1 ? total - 1 : firstOpen)
  const q = topic.questions[current]!
  const answered = q.id in results
  const finished = allDone || heartsOut
  const showResult = finished && (index === null || index >= total)
  const passed = allDone && !heartsOut && correctCount >= need

  const line = orderedTopicsInRegion(topic.region)
  const next = line[line.findIndex((t) => t.id === topic.id) + 1]

  const claimProgress = () => {
    const res = finishQuizIfReady(topic.id)
    if (res.cleared) {
      setClaim({ xpGained: res.xpGained, newBadges: res.newBadges })
      fireConfetti(prefs.reducedMotion)
      playCelebrationSound(prefs.soundEnabled, prefs.hasGestureForSound)
    }
  }

  const retry = () => {
    resetQuizAttempt(topic.id)
    setIndex(0)
    setClaim(null)
  }

  const missed = topic.questions.filter((x) => x.id in results && !results[x.id])

  return (
    <div className="max-w-3xl space-y-5">
      <header className="flex justify-between items-start gap-4 border-b border-[var(--color-rail)] pb-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: accent }}>Quiz · {topic.title}</p>
          <p className="text-[15px] text-dim mt-1">
            {correctCount} correct of {answeredCount} answered · {need} of {total} needed to clear
          </p>
        </div>
        <HeartsHud hearts={attempt.hearts} />
      </header>

      <nav aria-label="Questions" className="flex gap-1.5">
        {topic.questions.map((x, i) => {
          const state = !(x.id in results) ? 'open' : results[x.id] ? 'right' : 'wrong'
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => { setIndex(i); setPractice(0) }}
              aria-label={`Question ${i + 1}: ${state === 'open' ? 'not answered' : state === 'right' ? 'correct' : 'wrong'}`}
              aria-current={!showResult && i === current ? 'step' : undefined}
              className={`quiz-dot quiz-dot-${state} ${!showResult && i === current ? 'quiz-dot-current' : ''}`}
            />
          )
        })}
        {finished && (
          <button type="button" className="ml-2 text-sm text-[var(--color-amber)] underline underline-offset-2" onClick={() => setIndex(total)}>
            Result
          </button>
        )}
      </nav>

      {showResult ? (
        <section className="panel p-6 space-y-4" aria-labelledby="quiz-result" role="status">
          {passed ? (
            <>
              <p className="text-sm font-semibold text-[var(--color-clear)]">Passed</p>
              <h1 id="quiz-result" className="font-display text-3xl font-extrabold text-chalk">
                {correctCount}/{total} correct
              </h1>
              {claim ? (
                <div className="space-y-3">
                  <p className="text-[17px] text-chalk">
                    {claim.xpGained > 0 ? `+${claim.xpGained} xp. ` : 'Already cleared before, so no new xp. '}
                    Station cleared{next ? `; ${next.title} is now open.` : '.'}
                  </p>
                  {claim.newBadges.length > 0 && (
                    <p className="text-sm text-chalk">
                      New badge: {claim.newBadges.map((b) => BADGE_LABELS[b as keyof typeof BADGE_LABELS] ?? b).join(', ')}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {next && <Link to={`/topic/${next.slug}`} className="btn-cta">Next: {next.title}</Link>}
                    <Link to="/" className="btn-quiet">Back to map</Link>
                  </div>
                </div>
              ) : alreadyCleared ? (
                <div className="flex flex-wrap gap-2">
                  {next && <Link to={`/topic/${next.slug}`} className="btn-cta">Next: {next.title}</Link>}
                  <Link to="/" className="btn-quiet">Back to map</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[15px] text-dim">Claim it to save the clear, earn xp and open the next station.</p>
                  <button type="button" onClick={claimProgress} className="btn-cta">Claim progress</button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-[var(--color-fault)]">{heartsOut ? 'Out of hearts' : 'Not cleared yet'}</p>
              <h1 id="quiz-result" className="font-display text-3xl font-extrabold text-chalk">
                {correctCount}/{total}, need {need}/{total}
              </h1>
              {missed.length > 0 && (
                <div>
                  <h2 className="font-display font-semibold text-chalk mb-2">Review these ideas</h2>
                  <ul className="space-y-2 text-sm">
                    {missed.map((x) => (
                      <li key={x.id} className="rounded-md border border-[var(--color-rail)] bg-[var(--color-ink)] p-3">
                        <p className="text-chalk">{x.prompt}</p>
                        <p className="text-dim mt-1">{x.explanation}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-cta" onClick={retry}>Retry quiz</button>
                <Link to={`/topic/${topic.slug}`} className="btn-quiet">Review the lesson</Link>
              </div>
            </>
          )}
        </section>
      ) : (
        <>
          <QuestionRenderer
            key={`${q.id}-${practice}`}
            question={q}
            number={current + 1}
            total={total}
            locked={practice === 0 && answered}
            reveal={practice === 0 && answered ? { correct: Boolean(results[q.id]) } : undefined}
            initialAnswer={practice === 0 ? attempt.answers[q.id] : undefined}
            hotkeys={!heartsOut && (practice > 0 || !answered)}
            onSubmit={(answer) => {
              // Stay on this question to read the feedback; the learner moves on with Next
              setIndex(current)
              if (practice === 0) recordQuizAnswer(topic.id, q, answer)
            }}
          />
          {(answered || practice > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {current < total - 1 && !heartsOut ? (
                <button type="button" className="btn-cta" onClick={() => { setIndex(current + 1); setPractice(0) }}>
                  Next question
                </button>
              ) : (
                <button type="button" className="btn-cta" onClick={() => { setIndex(total); setPractice(0) }}>
                  See result
                </button>
              )}
              {answered && !results[q.id] && (
                <button type="button" className="btn-quiet" onClick={() => setPractice((p) => p + 1)}>
                  Try it again for practice
                </button>
              )}
              {practice > 0 && <span className="text-sm text-dim">Practice only: your score and hearts don’t change.</span>}
            </div>
          )}
        </>
      )}

      <p className="text-sm text-dim">
        Shortcuts: <kbd className="kbd">1</kbd>–<kbd className="kbd">4</kbd> pick an option, <kbd className="kbd">Enter</kbd> submits.
      </p>
    </div>
  )
}
