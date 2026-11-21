import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/react'
import { useGameStore } from '../stores/gameStore'
import { saveState } from '../lib/storage/persistence'
import { defaultPersistedState, type PersistedState } from '../lib/storage/schema'
import { fromCloud, isCloudProgress, mergeProgress, pruneForUpload, toCloud, type CloudProgress } from '../lib/sync/merge'
import { fromCloudPractice, mergePractice, toCloudPractice } from '../lib/sync/practiceSync'
import { getPractice, replacePractice, subscribePractice } from '../lib/fun/practice'
import { useSyncStatus, type SyncStatus } from '../lib/sync/syncStatus'

const DEBOUNCE_MS = 2000
const KEYS = Object.keys(defaultPersistedState()) as (keyof PersistedState)[]
const pick = (s: PersistedState): PersistedState => Object.fromEntries(KEYS.map((k) => [k, s[k]])) as unknown as PersistedState

/** Signed-in users: merge local + cloud progress once, then debounce-save changes. Guests: does nothing. */
export function CloudSync() {
  const { isSignedIn, getToken, userId } = useAuth()
  const hydrated = useGameStore((s) => s.hydrated)
  const setStatus = useSyncStatus((s) => s.set)
  const ready = useRef<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)

  useEffect(() => {
    if (!isSignedIn || !hydrated || !userId) { ready.current = null; setStatus('idle'); return }
    let cancelled = false

    const put = async () => {
      if (!navigator.onLine) { dirty.current = true; setStatus('offline'); return }
      setStatus('saving')
      try {
        const token = await getToken()
        const progress = { ...toCloud(pick(useGameStore.getState())), pr: toCloudPractice(getPractice()) }
        const send = (body: CloudProgress) => fetch('/api/progress', { method: 'PUT', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ progress: body }) })
        let res = await send(progress)
        // Too big for the server's metadata cap: retry once with the oldest review entries dropped
        // and the missed queue trimmed (only the uploaded copy is pruned, not the local store)
        if (res.status === 413) res = await send(pruneForUpload(progress))
        if (res.ok) {
          dirty.current = false
          if (!cancelled) setStatus('saved')
        } else if (res.status === 413 || res.status === 503) {
          dirty.current = true
          if (!cancelled) setStatus(res.status === 413 ? 'full' : 'unconfigured')
        } else {
          throw new Error(String(res.status))
        }
      } catch {
        dirty.current = true
        if (!cancelled) setStatus(navigator.onLine ? 'error' : 'offline')
      }
    }
    const schedule = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(put, DEBOUNCE_MS) }

    ;(async () => {
      setStatus('loading')
      try {
        const token = await getToken()
        const res = await fetch('/api/progress', { headers: { authorization: `Bearer ${token}` } })
        if (res.status === 503) {
          ready.current = userId // keep playing locally; saves keep reporting the same state
          dirty.current = true
          if (!cancelled) setStatus('unconfigured')
          return
        }
        if (!res.ok) throw new Error(String(res.status))
        const { progress } = (await res.json()) as { progress: unknown }
        if (cancelled) return
        if (isCloudProgress(progress)) {
          const merged = mergeProgress(pick(useGameStore.getState()), fromCloud(progress))
          useGameStore.setState(merged)
          await saveState(merged)
          if (progress.pr) replacePractice(mergePractice(getPractice(), fromCloudPractice(progress.pr)))
        }
        ready.current = userId
        await put()
      } catch {
        ready.current = userId // keep playing locally; later changes still try to save
        dirty.current = true
        if (!cancelled) setStatus(navigator.onLine ? 'error' : 'offline')
      }
    })()

    const unsub = useGameStore.subscribe((s, prev) => {
      if (ready.current !== userId) return
      if (KEYS.some((k) => s[k] !== prev[k])) schedule()
    })
    const unsubPractice = subscribePractice(() => { if (ready.current === userId) schedule() })
    const online = () => { if (dirty.current) schedule() }
    window.addEventListener('online', online)
    return () => { cancelled = true; unsub(); unsubPractice(); window.removeEventListener('online', online); if (timer.current) clearTimeout(timer.current) }
  }, [isSignedIn, hydrated, userId, getToken, setStatus])

  return null
}

const LABEL: Record<SyncStatus, string> = {
  idle: '',
  loading: 'Syncing…',
  saving: 'Saving…',
  saved: 'Saved',
  offline: 'Offline: saved on this device',
  error: 'Not saved to cloud; will retry',
  full: 'Cloud save full',
  unconfigured: 'Cloud save unavailable',
}
const TITLE: Partial<Record<SyncStatus, string>> = {
  error: 'Progress is only saved on this device until the connection recovers',
  full: 'Too much progress for the cloud save — the newest entries were kept; the rest stays on this device',
  unconfigured: 'Cloud save is not configured on the server — progress stays on this device',
}

/** Small header indicator for cloud save state (signed-in users only). */
export function SyncIndicator() {
  const { isSignedIn } = useAuth()
  const status = useSyncStatus((s) => s.status)
  if (!isSignedIn || status === 'idle') return null
  const bad = status === 'offline' || status === 'error' || status === 'unconfigured'
  return (
    <span data-testid="sync-status" role="status" aria-live="polite" title={TITLE[status]} className={`hidden sm:inline text-xs font-bold ${status === 'full' ? 'text-flame-ink' : bad ? 'text-amber-600' : 'text-dim'}`}>
      {LABEL[status]}
    </span>
  )
}
