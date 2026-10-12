import { create } from 'zustand'
import { topicsById } from '../content/catalog'
import { badgeAfterStreak, badgesAfterTopicClear } from '../lib/progression/badges'
import { awardBossClearXp, awardTopicClearXp } from '../lib/progression/xp'
import { computeUnlocksAfterClear, levelFromXp } from '../lib/progression/unlocks'
import { INITIAL_HEARTS, computeQuizSummary } from '../lib/scoring/quiz'
import { recordStreakActivity, currentStreakCount } from '../lib/streak/kolkata'
import { defaultPersistedState, type PersistedState } from '../lib/storage/schema'
import { loadState, saveState, resetState, exportStateJson, importStateJson } from '../lib/storage/persistence'
import type { Question } from '../content/types'
import { gradeQuestion, incompleteReason } from '../lib/scoring/questions'

interface GameStore extends PersistedState {
  hydrated: boolean
  hydrate: () => Promise<void>
  recordQuizAnswer: (topicId: number, question: Question, answer: unknown) => void
  finishQuizIfReady: (topicId: number) => { cleared: boolean; xpGained: number; newBadges: string[] }
  startQuizAttempt: (topicId: number) => void
  /** Start the quiz over with full hearts (Retry after a failed attempt) */
  resetQuizAttempt: (topicId: number) => void
  getQuizAttempt: (topicId: number) => { hearts: number; answers: Record<string, unknown>; results: Record<string, boolean> }
  markBossSubmission: (bossId: number, score: number, breakdown: Record<string, number>) => void
  saveBossDraft: (bossId: number, draft: PersistedState['bossProgress']['drafts'][number]) => void
  recordActivity: () => void
  /** Remember the card the learner is on; reaching the last card marks the lesson as read */
  recordLessonCard: (topicId: number, card: number, total: number) => void
  setPreferences: (p: Partial<PersistedState['preferences']>) => void
  exportProgress: () => string
  importProgress: (json: string) => Promise<void>
  resetProgress: () => Promise<void>
  upsertInterview: (session: PersistedState['interviews'][number]) => void
  rateFlashcard: (topicId: number, flashcardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void // triggers activity
}

function attemptKey(topicId: number) {
  return `topic-${topicId}`
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...defaultPersistedState(),
  hydrated: false,

  async hydrate() {
    const state = await loadState()
    set({ ...state, hydrated: true })
  },

  startQuizAttempt(topicId) {
    const key = attemptKey(topicId)
    if (get().quizAttempts[key]) return
    set((s) => ({
      quizAttempts: {
        ...s.quizAttempts,
        [key]: { hearts: INITIAL_HEARTS, answers: {}, results: {}, completed: false },
      },
    }))
    void saveState(get())
  },

  resetQuizAttempt(topicId) {
    const key = attemptKey(topicId)
    set((s) => ({
      quizAttempts: {
        ...s.quizAttempts,
        [key]: { hearts: INITIAL_HEARTS, answers: {}, results: {}, completed: false },
      },
    }))
    void saveState(get())
  },

  getQuizAttempt(topicId) {
    const key = attemptKey(topicId)
    const a = get().quizAttempts[key] ?? {
      hearts: INITIAL_HEARTS,
      answers: {},
      completed: false,
      results: {},
    }
    return {
      hearts: a.hearts,
      answers: a.answers,
      results: (a as { results?: Record<string, boolean> }).results ?? {},
    }
  },

  recordQuizAnswer(topicId, question, answer) {
    const key = attemptKey(topicId)
    const state = get()
    const attempt = state.quizAttempts[key] ?? {
      hearts: INITIAL_HEARTS,
      answers: {},
      completed: false,
      results: {},
    }
    if (attempt.completed || attempt.hearts <= 0) return
    // Blank or partial answers are not attempts: never grade them, never take a heart
    if (incompleteReason(question, answer)) return
    const grade = gradeQuestion(question, answer)
    const hearts = grade.correct ? attempt.hearts : Math.max(0, attempt.hearts - 1)
    const results = { ...(attempt as { results?: Record<string, boolean> }).results, [question.id]: grade.correct }
    set({
      quizAttempts: {
        ...state.quizAttempts,
        [key]: { ...attempt, hearts, answers: { ...attempt.answers, [question.id]: answer }, results, completed: hearts === 0 },
      },
    })
    get().recordActivity()
    void saveState(get())
  },

  finishQuizIfReady(topicId) {
    const topic = topicsById.get(topicId)
    if (!topic) return { cleared: false, xpGained: 0, newBadges: [] }
    const key = attemptKey(topicId)
    const attempt = get().quizAttempts[key]
    if (!attempt) return { cleared: false, xpGained: 0, newBadges: [] }
    const results = (attempt as { results?: Record<string, boolean> }).results ?? {}
    const summary = computeQuizSummary(topic.questions, results, attempt.hearts)
    if (!summary.passed) return { cleared: false, xpGained: 0, newBadges: [] }

    const prev = get().topicProgress[topicId]
    const xpAward = awardTopicClearXp(prev?.firstClearXpAwarded ?? false)
    const completed = new Set(
      Object.entries(get().topicProgress)
        .filter(([, v]) => v.completed)
        .map(([id]) => Number(id)),
    )
    completed.add(topicId)

    const newBadges = badgesAfterTopicClear(
      topicId,
      completed,
      get().badges,
    ).filter((b) => !get().badges.includes(b))

    const unlocked = computeUnlocksAfterClear(
      topicId,
      get().unlockedTopicIds,
      completed,
    )

    set((s) => ({
      xp: s.xp + xpAward.xp,
      badges: [...new Set([...s.badges, ...newBadges])],
      unlockedTopicIds: [...new Set([...s.unlockedTopicIds, ...unlocked])],
      topicProgress: {
        ...s.topicProgress,
        [topicId]: {
          completed: true,
          bestScorePercent: Math.max(prev?.bestScorePercent ?? 0, summary.percent),
          attempts: (prev?.attempts ?? 0) + 1,
          firstClearXpAwarded: prev?.firstClearXpAwarded || xpAward.awarded,
          lastAttemptAt: new Date().toISOString(),
        },
      },
      quizAttempts: {
        ...s.quizAttempts,
        [key]: { ...attempt, completed: true },
      },
    }))
    get().recordActivity()
    void saveState(get())
    return { cleared: true, xpGained: xpAward.xp, newBadges }
  },

  markBossSubmission(bossId, score, breakdown) {
    const prevBoss = get().bossProgress
    const xpAward = awardBossClearXp(
      prevBoss.submissions[bossId] ? get().topicProgress[bossId]?.firstClearXpAwarded ?? false : false,
    )
    const cleared = score >= 70
    const completed = new Set(
      Object.entries(get().topicProgress)
        .filter(([, v]) => v.completed)
        .map(([id]) => Number(id)),
    )
    if (cleared) completed.add(bossId)
    const newBadges = badgesAfterTopicClear(bossId, completed, get().badges).filter(
      (b) => !get().badges.includes(b),
    )
    const unlocked = cleared
      ? computeUnlocksAfterClear(bossId, get().unlockedTopicIds, completed)
      : get().unlockedTopicIds

    set((s) => ({
      xp: s.xp + (cleared ? xpAward.xp : 0),
      badges: [...new Set([...s.badges, ...newBadges])],
      unlockedTopicIds: [...new Set(unlocked)],
      bossProgress: {
        ...s.bossProgress,
        bestScore: Math.max(s.bossProgress.bestScore, score),
        completed: s.bossProgress.completed || cleared,
        submissions: {
          ...s.bossProgress.submissions,
          [bossId]: { score, breakdown, at: new Date().toISOString() },
        },
      },
      topicProgress: {
        ...s.topicProgress,
        [bossId]: {
          completed: cleared,
          bestScorePercent: Math.max(s.topicProgress[bossId]?.bestScorePercent ?? 0, score),
          attempts: (s.topicProgress[bossId]?.attempts ?? 0) + 1,
          firstClearXpAwarded:
            s.topicProgress[bossId]?.firstClearXpAwarded || (cleared && xpAward.awarded),
          lastAttemptAt: new Date().toISOString(),
        },
      },
    }))
    get().recordActivity()
    void saveState(get())
  },

  saveBossDraft(bossId, draft) {
    set((s) => ({
      bossProgress: {
        ...s.bossProgress,
        drafts: { ...s.bossProgress.drafts, [bossId]: draft },
      },
    }))
    void saveState(get())
  },

  recordLessonCard(topicId, card, total) {
    const prev = get().lessonProgress[topicId]
    const viewed = Boolean(prev?.viewed) || card >= total - 1
    if (prev && prev.card === card && prev.viewed === viewed) return
    set((s) => ({
      lessonProgress: { ...s.lessonProgress, [topicId]: { card, viewed, updatedAt: new Date().toISOString() } },
    }))
    void saveState(get())
  },

  recordActivity() {
    const streak = recordStreakActivity(get().streak.history, get().streak.lastActiveDay)
    const streakBadges = badgeAfterStreak(streak.history).filter((b) => !get().badges.includes(b))
    set((s) => ({
      streak,
      badges: [...new Set([...s.badges, ...streakBadges])],
    }))
  },

  setPreferences(p) {
    set((s) => ({ preferences: { ...s.preferences, ...p } }))
    void saveState(get())
  },

  exportProgress() {
    return exportStateJson(get())
  },

  async importProgress(json) {
    const next = await importStateJson(json)
    set({ ...next, hydrated: true })
  },

  async resetProgress() {
    const fresh = await resetState()
    set({ ...fresh, hydrated: true })
  },

  upsertInterview(session) {
    set((s) => {
      const others = s.interviews.filter((i) => i.id !== session.id)
      return { interviews: [...others, session] }
    })
    void saveState(get())
  },

  rateFlashcard(_topicId, _flashcardId, _rating) {
    get().recordActivity()
    void saveState(get())
  },
}))

export function useLevel() {
  return levelFromXp(useGameStore((s) => s.xp))
}

export function useStreak() {
  const history = useGameStore((s) => s.streak.history)
  return currentStreakCount(history)
}

export function completedTopicIds(state: PersistedState): Set<number> {
  return new Set(
    Object.entries(state.topicProgress)
      .filter(([, v]) => v.completed)
      .map(([id]) => Number(id)),
  )
}
