import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { defaultPersistedState, type PersistedState } from './schema'
import { migrateState as runMigrate } from './migrate'

const LOCAL_KEY = 'sdq-progress-v3'

interface SdqDB extends DBSchema {
  kv: {
    key: string
    value: PersistedState
  }
}

let dbPromise: Promise<IDBPDatabase<SdqDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<SdqDB>('system-design-quest', 1, {
      upgrade(db) {
        db.createObjectStore('kv')
      },
    })
  }
  return dbPromise
}

export async function loadState(): Promise<PersistedState> {
  try {
    const db = await getDb()
    const fromIdb = await db.get('kv', LOCAL_KEY)
    if (fromIdb) {
      return runMigrate(fromIdb)
    }
  } catch {
    /* fall through */
  }

  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      return runMigrate(parsed)
    }
  } catch {
    return defaultPersistedState()
  }

  return defaultPersistedState()
}

export async function saveState(state: PersistedState): Promise<void> {
  const migrated = runMigrate(state)
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(migrated))
  } catch {
    /* quota */
  }
  try {
    const db = await getDb()
    await db.put('kv', migrated, LOCAL_KEY)
  } catch {
    /* idb unavailable */
  }
}

export function exportStateJson(state: PersistedState): string {
  return JSON.stringify(runMigrate(state), null, 2)
}

export async function importStateJson(text: string): Promise<PersistedState> {
  const { parseImportedJson } = await import('./migrate')
  const next = parseImportedJson(text)
  await saveState(next)
  return next
}

export async function resetState(): Promise<PersistedState> {
  const fresh = defaultPersistedState()
  await saveState(fresh)
  return fresh
}
