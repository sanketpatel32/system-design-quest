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
import { byteReaction } from '../lib/fun/fun'
import { ComboChip } from '../components/ui/ComboChip'
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
  const [heartsNudgeHidden, setHeartsNudgeHidden] = useState(false)
  /** Correct answers in a row this session, and the best run so far */
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [reaction, setReaction] = useState('')

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
  /** Hearts only count misses: running out shows a friendly nudge and play carries on */
  const heartsOut = attempt.hearts <= 0
  const allDone = answeredCount === total
  const firstOpen = topic.questions.findIndex((q) => !(q.id in results))
  // index === total means "show the result"; never use it to look up a question
  const current = Math.min(index ?? (firstOpen === -1 ? total - 1 : firstOpen), total - 1)
  const q = topic.questions[current]!
  const answered = q.id in results
  const finished = allDone
  const showResult = finished && (index === null || index >= total)
  const passed = allDone && correctCount >= need

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
    setCombo(0)
    setBestCombo(0)
  }

  readyToClaim.current = showResult && passed && !alreadyCleared && !claim
  autoClaim.current = claimProgress

  const missed = topic.questions.filter((x) => x.id in results && !results[x.id])
  /** Next unanswered question after this one (wrapping round), or the result once every question is answered */
  const nextOpen = (() => {
    for (let k = 1; k <= total; k++) {
      const i = (current + k) % total
      if (!(topic.questions[i]!.id in results)) return i
    }
    return total
  })()
  const goNext = () => {
    setPractice(0)
    setIndex(answered ? nextOpen : current < total - 1 ? current + 1 : nextOpen)
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <header className="mb-3 flex items-center gap-3 sm:mb-6 sm:gap-4 short:mb-1">
        <Link to={`/topic/${topic.slug}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-dim hover:bg-paper-3" aria-label="Leave quiz, back to the lesson">
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
          <div className="progress-fill" style={{ ['--fill' as string]: `${Math.max(answeredCount ? 6 : 0, (answeredCount / total) * 100)}%` }} />
        </div>
        <ComboChip combo={combo} />
        <HeartsHud hearts={attempt.hearts} />
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-5 short:mb-1">
        <p className="text-sm font-extrabold" style={{ color: p.deep }}>{topic.title}</p>
        <nav aria-label="Questions" className="-my-3 flex items-center gap-1">
          {topic.questions.map((x, i) => {
            const state = !(x.id in results) ? 'open' : results[x.id] ? 'right' : 'wrong'
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => { setIndex(i); setPractice(0) }}
                aria-label={`Question ${i + 1}: ${state === 'open' ? 'not answered' : state === 'right' ? 'correct' : 'wrong'}`}
                aria-current={!showResult && i === current ? 'step' : undefined}
                className={`quiz-dot-hit ${!showResult && i === current ? 'quiz-dot-current' : ''}`}
              >
                <span className={`quiz-dot quiz-dot-${state}`} />
              </button>
            )
          })}
          {finished && (
            <button type="button" className="ml-2 text-sm font-extrabold text-teal" onClick={() => setIndex(total)}>
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
            <p className="mt-1 text-lg font-bold text-dim">
              {correctCount}/{total} correct{bestCombo >= 2 ? ` · best run ${bestCombo} in a row` : ''}
            </p>
            <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
              <StatTile label="Total XP" color="var(--color-gold)" deep="var(--color-gold-deep)" value={claim ? `+${claim.xpGained}` : 'Saved'} icon={<IconGem size={28} />} />
              <StatTile label="Accuracy" color="var(--color-hero)" deep="var(--color-hero-deep)" value={`${Math.round((correctCount / total) * 100)}%`} icon={<Target />} />
              <StatTile label="Streak" color="var(--color-flame)" deep="var(--color-flame-deep)" value={`${streak}`} icon={<IconFlame size={28} />} />
            </div>
            {claim ? (
              <div className="mt-6 space-y-3">
                <p className="text-[1.0625rem] font-bold text-chalk">
                  {claim.xpGained > 0 ? `+${claim.xpGained} xp earned. ` : 'Already cleared before, so no new xp. '}
                  {next ? `Up next: ${next.title}.` : 'Unit complete!'}
                </p>
                {claim.newBadges.length > 0 && (
                  <p className="inline-flex items-center gap-2 rounded-2xl bg-gold-wash px-4 py-2 font-extrabold text-gold-deep">
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
              <h1 id="quiz-result" className="font-display text-3xl text-chalk">
                {correctCount}/{total} correct, you need {need}
              </h1>
              <p className="mt-2 text-sm font-extrabold text-[var(--color-fault)]">Not cleared yet</p>
              <p className="font-bold text-dim mt-1">Every miss is a clue. Have a look, then try again, or move on and come back later.</p>
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
              {next && <Link to={`/topic/${next.slug}`} className="btn-quiet min-w-[220px]">Move on: {next.title}</Link>}
            </div>
          </section>
        )
      ) : (
        <>
          {answeredCount === 0 && !alreadyCleared && !lessonViewed && !skipLessonHint && (
            <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-dim short:mb-2" data-testid="lesson-first">
              <span className="min-w-0">Quiz first? Go for it. The lesson is one tap away if you get stuck.</span>
              <Link to={`/topic/${topic.slug}`} className="inline-flex min-h-[44px] items-center font-extrabold text-teal hover:underline">Read the lesson</Link>
              <button type="button" className="min-h-[44px] px-1 font-extrabold text-dim hover:text-chalk" onClick={() => setSkipLessonHint(true)}>Hide</button>
            </p>
          )}
          {heartsOut && !heartsNudgeHidden && (
            <div className="panel mb-4 flex flex-wrap items-center gap-3 p-3" role="status" data-testid="hearts-nudge">
              <Mascot mood="idle" size={52} className="shrink-0" />
              <div className="min-w-0 flex-[1_1_14rem]">
                <p className="font-extrabold text-chalk">Out of hearts, and that’s fine.</p>
                <p className="text-sm font-bold text-dim">Keep practising: finish the quiz and 70% still clears it.</p>
              </div>
              <button type="button" className="btn-quiet !min-h-[44px]" onClick={() => setHeartsNudgeHidden(true)}>Keep going</button>
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
            hotkeys={practice > 0 || !answered}
            onSubmit={(answer, r) => {
              // Stay on this question to read the feedback; the learner moves on with Continue
              setIndex(current)
              const run = r.correct ? combo + 1 : 0
              setReaction(byteReaction(r.correct, run, `${q.id}-${attemptSeed}-${practice}`))
              if (practice === 0) {
                recordQuizAnswer(topic.id, q, answer)
                setCombo(run)
                setBestCombo((b) => Math.max(b, run))
              }
            }}
            sheet={{
              onContinue: goNext,
              continueLabel: nextOpen === total ? 'See result' : 'Continue',
              reaction,
              extra:
                answered && !results[q.id] && practice === 0 ? (
                  <button type="button" className="text-sm font-extrabold underline-offset-2 hover:underline" onClick={() => setPractice((x) => x + 1)}>
                    Try again for practice
                  </button>
                ) : practice > 0 ? (
                  <span className="text-sm font-bold">Practice only: score and hearts don’t change.</span>
                ) : undefined,
            }}
          />
          {q.type === 'multiple_choice' && !answered && (
          <p className="mt-8 hidden text-sm text-dim sm:block" data-testid="shortcut-hint">
            Shortcuts: <kbd className="kbd">1</kbd> to <kbd className="kbd">4</kbd> pick an option, <kbd className="kbd">Enter</kbd> submits.
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
      <p className="py-1 text-xs font-extrabold text-chalk">{label}</p>
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
      <circle cx="12" cy="12" r="10" fill="var(--color-hero)" />
      <circle cx="12" cy="12" r="6.5" fill="var(--color-card)" />
      <circle cx="12" cy="12" r="3.2" fill="var(--color-hero)" />
    </svg>
  )
}
