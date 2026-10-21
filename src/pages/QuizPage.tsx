import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { sectionOfTopic, sectionPath } from '../content/sections'
import { allTopics, orderedTopicsInRegion } from '../content/catalog'
import { QuestionRenderer } from '../components/QuestionRenderer'
import { HeartsHud } from '../components/ui/Hud'
import { Mascot } from '../components/art/Mascot'
import { IconBadge, IconFlame, IconGem } from '../components/icons/HudIcons'
import { regionPalette } from '../lib/design/transitTheme'
import { fireConfetti, playCelebrationSound } from '../lib/celebrate'
import { BADGE_LABELS } from '../lib/progression/badges'
import { INITIAL_HEARTS, PASS_PERCENT } from '../lib/scoring/quiz'
import { useGameStore, useStreak } from '../stores/gameStore'

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
  const lessonViewed = useGameStore((s) => (topicId ? Boolean(s.lessonProgress[topicId]?.viewed) : false))
  const streak = useStreak()

  const [index, setIndex] = useState<number | null>(null)
  const [practice, setPractice] = useState(0)
  const [claim, setClaim] = useState<Claim>(null)
  /** Order questions get a fresh scramble on every attempt (stable within the attempt) */
  const [attemptSeed, setAttemptSeed] = useState(() => Math.random().toString(36).slice(2))
  const claimedRef = useRef(false)
  const [skipLessonHint, setSkipLessonHint] = useState(false)

  useEffect(() => {
    if (topicId) startQuizAttempt(topicId)
  }, [topicId, startQuizAttempt])

  // Save a pass automatically as soon as the result is reached (also after a reload)
  const autoClaim = useRef<() => void>(() => {})
  const readyToClaim = useRef(false)
  useEffect(() => {
    if (readyToClaim.current) autoClaim.current()
  })

  if (!topic)
    return (
      <div className="py-10 text-center">
        <Mascot mood="sad" size={120} className="mx-auto" />
        <h1 className="font-display text-3xl text-chalk mt-3">Quiz not found</h1>
        <Link to="/" className="btn-cta mt-5">Back to the map</Link>
      </div>
    )

  const p = regionPalette(topic.region)
  const results = (attempt as { results?: Record<string, boolean> }).results ?? {}
  const total = topic.questions.length
  const answeredCount = topic.questions.filter((q) => q.id in results).length
  const correctCount = topic.questions.filter((q) => results[q.id]).length
  const need = Math.ceil((PASS_PERCENT / 100) * total)
  const heartsOut = attempt.hearts <= 0
  const allDone = answeredCount === total
  const firstOpen = topic.questions.findIndex((q) => !(q.id in results))
  // index === total means "show the result"; never use it to look up a question
  const current = Math.min(index ?? (firstOpen === -1 ? total - 1 : firstOpen), total - 1)
  const q = topic.questions[current]!
  const answered = q.id in results
  const finished = allDone || heartsOut
  const showResult = finished && (index === null || index >= total)
  const passed = allDone && !heartsOut && correctCount >= need

  const line = orderedTopicsInRegion(topic.region)
  const next = line[line.findIndex((t) => t.id === topic.id) + 1]

  const claimProgress = () => {
    if (claimedRef.current) return
    claimedRef.current = true
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
    setPractice(0)
    setClaim(null)
    setAttemptSeed(Math.random().toString(36).slice(2))
  }

  readyToClaim.current = showResult && passed && !alreadyCleared && !claim
  autoClaim.current = claimProgress

  const missed = topic.questions.filter((x) => x.id in results && !results[x.id])
  const goNext = () => {
    setPractice(0)
    setIndex(current < total - 1 && !heartsOut ? current + 1 : total)
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <header className="mb-3 flex items-center gap-3 sm:mb-6 sm:gap-4 short:mb-1">
        <Link to={`/topic/${topic.slug}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-dim hover:bg-[#f4f1ec]" aria-label="Leave quiz, back to the lesson">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" /></svg>
        </Link>
        <div
          className="progress-track flex-1"
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answeredCount}
        >
          <div className="progress-fill" style={{ width: `${Math.max(answeredCount ? 6 : 0, (answeredCount / total) * 100)}%` }} />
        </div>
        <HeartsHud hearts={attempt.hearts} />
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-5 short:mb-1">
        <p className="text-sm font-extrabold uppercase tracking-wide" style={{ color: p.deep }}>{topic.title}</p>
        <nav aria-label="Questions" className="flex items-center gap-1.5">
          {topic.questions.map((x, i) => {
            const state = !(x.id in results) ? 'open' : results[x.id] ? 'right' : 'wrong'
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => { setIndex(i); setPractice(0) }}
                aria-label={`Question ${i + 1}: ${state === 'open' ? 'not answered' : state === 'right' ? 'correct' : 'wrong'}`}
                aria-current={!showResult && i === current ? 'step' : undefined}
                className={`quiz-dot w-6 quiz-dot-${state} ${!showResult && i === current ? 'quiz-dot-current' : ''}`}
              />
            )
          })}
          {finished && (
            <button type="button" className="ml-2 text-sm font-extrabold uppercase text-[#12749f]" onClick={() => setIndex(total)}>
              Result
            </button>
          )}
        </nav>
      </div>

      {showResult ? (
        passed ? (
          <section className="py-4 text-center" aria-labelledby="quiz-result" role="status">
            <Mascot mood="happy" size={150} className={`mx-auto ${claim ? 'byte-cheer' : 'anim-pop'}`} />
            <h1 id="quiz-result" className="font-display mt-3 text-4xl text-[var(--color-hero-deep)]">
              {claim || alreadyCleared ? 'Lesson complete!' : 'You passed!'}
            </h1>
            <p className="mt-1 text-lg font-bold text-dim">{correctCount}/{total} correct</p>
            <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
              <StatTile label="Total XP" color="#FFC800" deep="#8A5A00" value={claim ? `+${claim.xpGained}` : 'Saved'} icon={<IconGem size={28} />} />
              <StatTile label="Accuracy" color="#58CC02" deep="#2F7D00" value={`${Math.round((correctCount / total) * 100)}%`} icon={<Target />} />
              <StatTile label="Streak" color="#FF9600" deep="#A35F00" value={`${streak}`} icon={<IconFlame size={28} />} />
            </div>
            {claim ? (
              <div className="mt-6 space-y-3">
                <p className="text-[1.0625rem] font-bold text-chalk">
                  {claim.xpGained > 0 ? `+${claim.xpGained} xp earned. ` : 'Already cleared before, so no new xp. '}
                  {next ? `${next.title} is now open.` : 'Unit complete!'}
                </p>
                {claim.newBadges.length > 0 && (
                  <p className="inline-flex items-center gap-2 rounded-2xl bg-[#FFF6CC] px-4 py-2 font-extrabold text-[#8A5A00]">
                    <IconBadge /> New badge: {claim.newBadges.map((b) => BADGE_LABELS[b as keyof typeof BADGE_LABELS] ?? b).join(', ')}
                  </p>
                )}
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  {next && <Link to={`/topic/${next.slug}`} className="btn-cta min-w-[220px]">Continue</Link>}
                  <button type="button" className="btn-quiet min-w-[220px]" onClick={retry} data-testid="practice-again">Practice again</button>
                  <Link to={topic ? sectionPath(sectionOfTopic(topic.id)) : '/'} className="btn-quiet min-w-[220px]">Back to map</Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <p className="font-bold text-dim">Progress saved. You can retake this quiz for practice at any time; it won’t change your xp.</p>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  {next && <Link to={`/topic/${next.slug}`} className="btn-cta min-w-[220px]">Next: {next.title}</Link>}
                  <button type="button" className="btn-quiet min-w-[220px]" onClick={retry} data-testid="practice-again">Practice again</button>
                  <Link to={topic ? sectionPath(sectionOfTopic(topic.id)) : '/'} className="btn-quiet min-w-[220px]">Back to map</Link>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-5" aria-labelledby="quiz-result" role="status">
            <div className="flex flex-col items-center text-center">
              <Mascot mood="sad" size={130} />
              <p className="mt-2 text-sm font-extrabold uppercase tracking-wide text-[var(--color-fault)]">{heartsOut ? 'Out of hearts' : 'Not cleared yet'}</p>
              <h1 id="quiz-result" className="font-display text-3xl text-chalk">
                {correctCount}/{total} correct, you need {need}
              </h1>
              <p className="font-bold text-dim mt-1">Every miss is a clue. Have a look, then try again.</p>
            </div>
            {missed.length > 0 && (
              <div>
                <h2 className="font-display text-xl text-chalk mb-3">Review these ideas</h2>
                <ul className="space-y-3">
                  {missed.map((x) => (
                    <li key={x.id} className="panel p-4">
                      <p className="font-extrabold text-chalk">{x.prompt}</p>
                      <p className="text-dim mt-1">{x.explanation}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" className="btn-cta min-w-[220px]" onClick={retry}>Retry quiz</button>
              <Link to={`/topic/${topic.slug}`} className="btn-quiet min-w-[220px]">Review the lesson</Link>
            </div>
          </section>
        )
      ) : (
        <>
          {answeredCount === 0 && !alreadyCleared && !lessonViewed && !skipLessonHint && (
            <div className="panel mb-5 flex flex-wrap items-center gap-3 p-3 text-sm short:mb-2 short:py-1.5" data-testid="lesson-first">
              <span className="flex-1 font-bold text-chalk">New to this topic? The short lesson comes first and makes this quiz much easier.</span>
              <Link to={`/topic/${topic.slug}`} className="btn-cta !min-h-[40px]">Read the lesson</Link>
              <button type="button" className="text-sm font-extrabold uppercase text-dim" onClick={() => setSkipLessonHint(true)}>Skip</button>
            </div>
          )}
          <QuestionRenderer
            key={`${q.id}-${practice}-${attemptSeed}`}
            scrambleSeed={attemptSeed}
            question={q}
            number={current + 1}
            total={total}
            locked={practice === 0 && answered}
            reveal={practice === 0 && answered ? { correct: Boolean(results[q.id]) } : undefined}
            initialAnswer={practice === 0 ? attempt.answers[q.id] : undefined}
            hotkeys={!heartsOut && (practice > 0 || !answered)}
            onSubmit={(answer) => {
              // Stay on this question to read the feedback; the learner moves on with Continue
              setIndex(current)
              if (practice === 0) recordQuizAnswer(topic.id, q, answer)
            }}
            sheet={{
              onContinue: goNext,
              continueLabel: current < total - 1 && !heartsOut ? 'Continue' : 'See result',
              extra:
                answered && !results[q.id] && practice === 0 ? (
                  <button type="button" className="text-sm font-extrabold uppercase tracking-wide underline-offset-2 hover:underline" onClick={() => setPractice((x) => x + 1)}>
                    Try again for practice
                  </button>
                ) : practice > 0 ? (
                  <span className="text-sm font-bold">Practice only: score and hearts don’t change.</span>
                ) : undefined,
            }}
          />
          {q.type === 'multiple_choice' && !answered && (
          <p className="mt-8 hidden text-sm text-dim sm:block" data-testid="shortcut-hint">
            Shortcuts: <kbd className="kbd">1</kbd>–<kbd className="kbd">4</kbd> pick an option, <kbd className="kbd">Enter</kbd> submits.
          </p>
          )}
        </>
      )}
    </div>
  )
}

function StatTile({ label, value, color, deep, icon }: { label: string; value: string; color: string; deep: string; icon: React.ReactNode }) {
  return (
    <div className="anim-pop overflow-hidden rounded-2xl border-2" style={{ borderColor: color, background: color }}>
      <p className="py-1 text-xs font-extrabold uppercase tracking-wider text-[#29303D]">{label}</p>
      <p className="flex items-center justify-center gap-1.5 rounded-t-xl bg-white py-3 font-display text-2xl" style={{ color: deep }}>
        {icon}
        {value}
      </p>
    </div>
  )
}

function Target() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#58CC02" />
      <circle cx="12" cy="12" r="6.5" fill="#fff" />
      <circle cx="12" cy="12" r="3.2" fill="#58CC02" />
    </svg>
  )
}
