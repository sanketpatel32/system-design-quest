import { useSyncExternalStore } from 'react'
import { kolkataDayKey } from '../streak/kolkata'

/**
 * The learner's daily rhythm, kept in this browser: the daily goal (questions answered per day), how many
 * they answered on each day, the questions they missed (they come back on later days until answered right
 * a few times), and the topic they touched last (so Continue opens what they were actually doing).
 */
export type Mistake = { topicId: number; questionId: string; dueAt: string; step: number; misses: number }
export type LastTopic = { id: number; where: 'lesson' | 'quiz'; at: string }
export type Practice = {
  goal: number
  /** When the learner picked the goal (null = still the default); the newer pick wins across devices */
  goalAt: string | null
  days: Record<string, number>
  mistakes: Mistake[]
  last: LastTopic | null
  welcomeDone: boolean
  goalCelebrated: string | null
}

export const KEY = 'sdq-practice-v1'
export const GOALS = [
  { n: 5, label: 'Casual', hint: '5 questions a day' },
  { n: 10, label: 'Regular', hint: '10 questions a day' },
  { n: 20, label: 'Serious', hint: '20 questions a day' },
] as const
/** Days until a missed question comes back, by how many times it has been answered right since */
export const MISTAKE_STEPS = [1, 3, 7] as const
export const MAX_MISTAKES = 300

const fresh = (): Practice => ({ goal: 10, goalAt: null, days: {}, mistakes: [], last: null, welcomeDone: false, goalCelebrated: null })

function load(): Practice {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh()
    const v = JSON.parse(raw) as Partial<Practice>
    return {
      goal: typeof v.goal === 'number' && v.goal >= 0 && v.goal <= 100 ? v.goal : 10,
      goalAt: typeof v.goalAt === 'string' ? v.goalAt : null,
      days: v.days && typeof v.days === 'object' ? v.days : {},
      mistakes: Array.isArray(v.mistakes) ? v.mistakes.filter((m) => m && typeof m.questionId === 'string' && typeof m.topicId === 'number') : [],
      last: v.last && typeof v.last.id === 'number' ? v.last : null,
      welcomeDone: Boolean(v.welcomeDone),
      goalCelebrated: typeof v.goalCelebrated === 'string' ? v.goalCelebrated : null,
    }
  } catch {
    return fresh()
  }
}

let state: Practice | null = null
const listeners = new Set<() => void>()
const get = () => (state ??= load())

function update(fn: (p: Practice) => Practice) {
  state = fn(get())
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode: keep it in memory */ }
  for (const l of listeners) l()
}

/** Tests and "Reset progress" start from a clean slate */
export function resetPractice() {
  state = fresh()
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  for (const l of listeners) l()
}

export function subscribePractice(l: () => void) {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

export const getPractice = () => get()

/** Cloud sync: replace the whole log with a merged one */
export function replacePractice(next: Practice) {
  update(() => next)
}

export function usePractice(): Practice {
  return useSyncExternalStore(subscribePractice, get, get)
}

const addDays = (now: Date, days: number) => new Date(now.getTime() + days * 86_400_000).toISOString()

/**
 * Count an answered question toward today's goal. A miss joins the "missed questions" queue for tomorrow;
 * answering a due missed question right pushes it further out, and after the last step it is retired.
 * Returns true when this answer completes today's goal (once per day).
 */
export function recordAnswer(topicId: number, questionId: string, correct: boolean, now = new Date()): boolean {
  const day = kolkataDayKey(now)
  let reached = false
  update((p) => {
    const count = (p.days[day] ?? 0) + 1
    // Keep two months of day counts
    const entries: [string, number][] = [...Object.entries(p.days).filter(([k]) => k !== day), [day, count]]
    const days = Object.fromEntries(entries.sort((a, b) => a[0].localeCompare(b[0])).slice(-60))
    const i = p.mistakes.findIndex((m) => m.topicId === topicId && m.questionId === questionId)
    let mistakes = p.mistakes
    if (!correct) {
      const prev = i >= 0 ? p.mistakes[i]! : null
      const m: Mistake = { topicId, questionId, dueAt: addDays(now, MISTAKE_STEPS[0]), step: 0, misses: (prev?.misses ?? 0) + 1 }
      mistakes = [...p.mistakes.filter((_, k) => k !== i), m].slice(-MAX_MISTAKES)
    } else if (i >= 0 && new Date(p.mistakes[i]!.dueAt) <= now) {
      const m = p.mistakes[i]!
      const step = m.step + 1
      mistakes = step >= MISTAKE_STEPS.length
        ? p.mistakes.filter((_, k) => k !== i)
        : p.mistakes.map((x, k) => (k === i ? { ...x, step, dueAt: addDays(now, MISTAKE_STEPS[step]!) } : x))
    }
    reached = p.goal > 0 && count >= p.goal && p.goalCelebrated !== day
    return { ...p, days, mistakes, goalCelebrated: reached ? day : p.goalCelebrated }
  })
  if (reached) celebrate()
  return reached
}

/** Tell the app shell to show the "daily goal reached" toast */
function celebrate() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(GOAL_EVENT))
}
export const GOAL_EVENT = 'sdq-goal-reached'

/** A flashcard rated in Review counts toward the daily goal too */
export function recordReview(now = new Date()) {
  const day = kolkataDayKey(now)
  let reached = false
  update((p) => {
    const count = (p.days[day] ?? 0) + 1
    reached = p.goal > 0 && count >= p.goal && p.goalCelebrated !== day
    return { ...p, days: { ...p.days, [day]: count }, goalCelebrated: reached ? day : p.goalCelebrated }
  })
  if (reached) celebrate()
}

export function setGoal(goal: number) {
  update((p) => ({ ...p, goal, goalAt: new Date().toISOString() }))
}

export function dismissWelcome() {
  update((p) => ({ ...p, welcomeDone: true }))
}

export function touchTopic(id: number, where: 'lesson' | 'quiz', now = new Date()) {
  const cur = get().last
  if (cur && cur.id === id && cur.where === where) return
  update((p) => ({ ...p, last: { id, where, at: now.toISOString() } }))
}

export const todayCount = (p: Practice, now = new Date()) => p.days[kolkataDayKey(now)] ?? 0
export const dueMistakes = (p: Practice, now = new Date()) => p.mistakes.filter((m) => new Date(m.dueAt) <= now)
