import {
  defaultPersistedState,
  STORAGE_VERSION,
  type PersistedState,
} from './schema'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function migrateState(raw: unknown): PersistedState {
  if (!isRecord(raw)) {
    return defaultPersistedState()
  }

  let state: PersistedState = {
    ...defaultPersistedState(),
    ...raw,
    version: typeof raw.version === 'number' ? raw.version : 0,
  } as PersistedState

  if (state.version < 2) {
    if (!Array.isArray(state.unlockedTopicIds) || state.unlockedTopicIds.length === 0) {
      state.unlockedTopicIds = [1]
    }
    state.version = 2
  }

  if (state.version < STORAGE_VERSION) {
    if (!state.preferences) {
      state.preferences = defaultPersistedState().preferences
    }
    if (!state.quizAttempts) {
      state.quizAttempts = {}
    }
    state.version = STORAGE_VERSION
  }

  if (!Array.isArray(state.unlockedTopicIds)) {
    state.unlockedTopicIds = [1]
  }
  // Unit 10 used to open only after the last boss; it follows Unit 9 (bosses are a parallel track)
  if (isRecord(state.topicProgress) && (state.topicProgress as Record<string, { completed?: boolean }>)[73]?.completed && !state.unlockedTopicIds.includes(115)) {
    state.unlockedTopicIds = [...state.unlockedTopicIds, 115]
  }
  if (!isRecord(state.lessonProgress)) {
    state.lessonProgress = {}
  }
  if (typeof state.xp !== 'number' || Number.isNaN(state.xp)) {
    state.xp = 0
  }

  return state
}

export function parseImportedJson(text: string): PersistedState {
  try {
    const parsed = JSON.parse(text) as unknown
    return migrateState(parsed)
  } catch {
    return defaultPersistedState()
  }
}
