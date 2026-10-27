import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/react'
import { useGameStore } from '../stores/gameStore'
import { saveState } from '../lib/storage/persistence'
import { defaultPersistedState, type PersistedState } from '../lib/storage/schema'
import { fromCloud, isCloudProgress, mergeProgress, toCloud } from '../lib/sync/merge'
import { fromCloudPractice, mergePractice, toCloudPractice } from '../lib/sync/practiceSync'
import { getPractice, replacePractice, subscribePractice } from '../lib/fun/practice'
import { useSyncStatus } from '../lib/sync/syncStatus'

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
        const send = (body: typeof progress) => fetch('/api/progress', { method: 'PUT', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ progress: body }) })
        let res = await send(progress)
        // Too big for the 8 KB metadata limit: drop the review-card schedule, then most of the missed queue
        if (res.status === 413) res = await send({ ...progress, r: [] })
        if (res.status === 413) res = await send({ ...progress, r: [], pr: { ...progress.pr, m: progress.pr.m.slice(0, 20) } })
        if (!res.ok) throw new Error(String(res.status))
        dirty.current = false
        if (!cancelled) setStatus('saved')
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

const LABEL: Record<string, string> = { loading: 'Syncing…', saving: 'Saving…', saved: 'Saved', offline: 'Offline: saved on this device', error: 'Not saved to cloud; will retry' }

/** Small header indicator for cloud save state (signed-in users only). */
export function SyncIndicator() {
  const { isSignedIn } = useAuth()
  const status = useSyncStatus((s) => s.status)
  if (!isSignedIn || status === 'idle') return null
  const bad = status === 'offline' || status === 'error'
  return (
    <span data-testid="sync-status" role="status" aria-live="polite" className={`hidden sm:inline text-xs font-bold ${bad ? 'text-amber-600' : 'text-dim'}`}>
      {LABEL[status]}
    </span>
  )
}
