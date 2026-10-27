import { Link } from 'react-router-dom'
import { lastSection, sectionOfTopic, sectionPalette } from '../../content/sections'
import { useGameStore, useStreak } from '../../stores/gameStore'
import { GOALS, dismissWelcome, dueMistakes, setGoal, todayCount, usePractice } from '../../lib/fun/practice'
import { continueTarget, dueCardCount, suggestedOrder } from '../../lib/fun/today'
import { Mascot } from '../art/Mascot'
import { IconFlame } from '../icons/HudIcons'

export function GoalRing({ count, goal, size = 64 }: { count: number; goal: number; size?: number }) {
  const r = 30, c = 2 * Math.PI * r, f = goal ? Math.min(1, count / goal) : 0
  const met = goal > 0 && count >= goal
  return (
    <svg width={size} height={size} viewBox="0 0 76 76" className="shrink-0" aria-hidden>
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--color-paper-3)" strokeWidth="9" />
      <circle cx="38" cy="38" r={r} fill="none" stroke={met ? 'var(--color-hero)' : 'var(--color-flame)'} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${c * f} ${c}`} transform="rotate(-90 38 38)" className="goal-arc" />
      {met
        ? <path d="M26 39l8 8 16-17" fill="none" stroke="var(--color-hero-deep)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        : <text x="38" y="44" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--color-chalk)">{count}</text>}
    </svg>
  )
}

export function GoalPicker({ goal, onPick, compact = false }: { goal: number; onPick: (n: number) => void; compact?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Daily goal">
      {GOALS.map((g) => (
        <button key={g.n} type="button" className={`play-pill ${goal === g.n ? 'play-pill-on' : ''}`} aria-pressed={goal === g.n} onClick={() => onPick(g.n)} data-testid={`goal-${g.n}`}>
          {g.label}{compact ? '' : <span className="font-bold"> · {g.n}/day</span>}
        </button>
      ))}
    </div>
  )
}

/** First visit: a friendly way in that isn't a wall of sections. Everything stays optional. */
function Welcome() {
  const p = usePractice()
  const first = suggestedOrder('system-design')[0]
  return (
    <section className="panel welcome-card relative p-5 sm:p-6" aria-labelledby="welcome-title" data-testid="welcome">
      <button type="button" className="btn-text absolute right-2 top-2 min-h-[44px] px-3 text-sm font-extrabold text-dim" onClick={dismissWelcome} data-testid="welcome-dismiss">Not now</button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Mascot mood="happy" size={96} className="shrink-0 max-sm:hidden" />
        <div className="min-w-0 flex-1">
          <h1 id="welcome-title" className="font-display text-3xl text-chalk sm:text-4xl pr-20">Learn by answering, not by reading</h1>
          <p className="mt-1 font-bold text-dim">Try three quick questions first. Wrong answers are fine; each one explains itself and comes back later so it sticks.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link to="/play?warmup=1" className="btn-cta sm:min-w-[220px]" data-testid="welcome-try">Try 3 questions</Link>
            {first && <Link to={`/topic/${first.slug}`} className="btn-quiet sm:min-w-[200px]">Start lesson 1</Link>}
          </div>
          <div className="mt-5">
            <p className="mb-2 text-sm font-extrabold text-dim">How much a day? You can change this any time.</p>
            <GoalPicker goal={p.goal} onPick={setGoal} />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Returning learner: pick up where you left off, and see today's goal, streak and what's due */
function TodayPanel() {
  const state = useGameStore()
  const p = usePractice()
  const streak = useStreak()
  const target = continueTarget(state, p.last, lastSection())
  const count = todayCount(p)
  const missed = dueMistakes(p).length
  const cards = dueCardCount(state)
  const due = missed + cards
  const pal = target ? sectionPalette(sectionOfTopic(target.topic.id)) : sectionPalette('system-design')
  const left = Math.max(0, p.goal - count)
  const nudge = p.goal === 0
    ? 'No daily goal set. Learn at your own pace.'
    : left === 0
      ? 'Goal met for today. Anything more is a bonus.'
      : count === 0 && streak > 0
        ? `One question keeps your ${streak}-day streak going.`
        : `${left} more question${left === 1 ? '' : 's'} to hit today's goal.`
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]" data-testid="today">
      {target && (
        <section className="panel flex flex-wrap items-center gap-4 p-4 sm:p-5" aria-labelledby="continue-title" style={{ borderColor: pal.bright, boxShadow: `0 4px 0 ${pal.bright}` }} data-testid="home-continue">
          <Mascot mood="idle" size={64} className="shrink-0 max-sm:hidden" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold" style={{ color: pal.deep }}>{target.resumed ? 'Pick up where you left off' : 'Up next'}</p>
            <h1 id="continue-title" className="font-display text-2xl text-chalk line-clamp-2">{target.topic.title}</h1>
            <p className="text-sm font-bold text-dim" data-testid="home-continue-detail">{target.detail}</p>
          </div>
          <Link to={target.to} className="btn-cta w-full sm:w-auto" data-testid="home-continue-link">{target.cta}</Link>
        </section>
      )}
      <section className="panel p-4 sm:p-5" aria-labelledby="today-title" data-testid="today-goal">
        {target ? <h2 id="today-title" className="sr-only">Today</h2> : <h1 id="today-title" className="sr-only">Today</h1>}
        <div className="flex items-center gap-4">
          <GoalRing count={count} goal={p.goal} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl text-chalk tabular-nums" data-testid="today-count">{p.goal ? `${Math.min(count, p.goal)} of ${p.goal} today` : `${count} answered today`}</p>
            <p className="text-sm font-bold text-dim">{nudge}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 font-display text-xl text-flame-ink tabular-nums" title={`${streak}-day streak`}>
            <IconFlame lit={streak > 0} size={24} /><span className="sr-only">Streak: </span>{streak}
          </span>
        </div>
        <Link to={missed && !cards ? '/revision?mode=missed' : '/revision'} className="today-review mt-4" data-testid="today-review">
          <span className="font-extrabold text-chalk">{due ? `${due} to review` : 'Review is clear'}</span>
          <span className="text-sm font-bold text-dim">{due ? [cards && `${cards} card${cards === 1 ? '' : 's'}`, missed && `${missed} missed question${missed === 1 ? '' : 's'}`].filter(Boolean).join(' · ') : 'Missed questions come back here'}</span>
        </Link>
      </section>
    </div>
  )
}

export function HomeToday() {
  const p = usePractice()
  const xp = useGameStore((s) => s.xp)
  const lessons = useGameStore((s) => s.lessonProgress)
  const fresh = xp === 0 && Object.keys(lessons).length === 0 && Object.keys(p.days).length === 0
  return !p.welcomeDone && fresh ? <Welcome /> : <TodayPanel />
}
