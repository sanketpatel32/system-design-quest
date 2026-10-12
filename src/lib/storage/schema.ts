export const STORAGE_VERSION = 3

export interface TopicProgress {
  completed: boolean
  bestScorePercent: number
  attempts: number
  firstClearXpAwarded: boolean
  lastAttemptAt?: string
}

export interface BossDraft {
  nodes: {
    id: string
    type: string
    label: string
    position: { x: number; y: number }
  }[]
  edges: {
    id: string
    source: string
    target: string
    label?: string
  }[]
  stageAnswers: Record<string, unknown>
  updatedAt: string
}

export interface BossProgress {
  completed: boolean
  bestScore: number
  firstClearXpAwarded: boolean
  drafts: Record<number, BossDraft>
  submissions: Record<number, { score: number; breakdown: Record<string, number>; at: string }>
}

export interface SrsCardState {
  topicId: number
  flashcardId: string
  ease: number
  intervalDays: number
  dueAt: string
  history: { at: string; rating: 'again' | 'hard' | 'good' | 'easy' }[]
}

export interface InterviewSession {
  id: string
  bossId: number
  startedAt: number
  stageIndex: number
  stageStartedAt: number
  finished: boolean
  notes: string
  /** Notes per stage (Requirements, Estimation, …); `notes` mirrors them joined for older exports */
  stageNotes?: string[]
  draft?: BossDraft
  selfAssessment?: Record<string, number>
}

export interface AppPreferences {
  soundEnabled: boolean
  reducedMotion: boolean
  hasGestureForSound: boolean
}

/** How far the learner got through a lesson's cards */
export interface LessonProgress {
  /** Index of the last card shown */
  card: number
  /** True once the learner has reached the final card (the lesson counts as read) */
  viewed: boolean
  updatedAt: string
}

export interface PersistedState {
  version: number
  xp: number
  badges: string[]
  unlockedTopicIds: number[]
  topicProgress: Record<number, TopicProgress>
  bossProgress: BossProgress
  streak: {
    lastActiveDay: string | null
    history: string[]
  }
  srs: SrsCardState[]
  interviews: InterviewSession[]
  preferences: AppPreferences
  lessonProgress: Record<number, LessonProgress>
  quizAttempts: Record<
    string,
    {
      hearts: number
      answers: Record<string, unknown>
      results: Record<string, boolean>
      completed: boolean
    }
  >
}

export const defaultPersistedState = (): PersistedState => ({
  version: STORAGE_VERSION,
  xp: 0,
  badges: [],
  unlockedTopicIds: [1],
  topicProgress: {},
  bossProgress: {
    completed: false,
    bestScore: 0,
    firstClearXpAwarded: false,
    drafts: {},
    submissions: {},
  },
  streak: { lastActiveDay: null, history: [] },
  srs: [],
  interviews: [],
  preferences: {
    soundEnabled: false,
    reducedMotion: false,
    hasGestureForSound: false,
  },
  quizAttempts: {},
  lessonProgress: {},
})
