import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'

type Notice = { tone: 'ok' | 'error'; text: string } | null

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 py-3 border-b border-[var(--color-rail)] last:border-0 cursor-pointer">
      <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-chalk">{label}</span>
        <span className="block text-sm text-dim">{hint}</span>
      </span>
    </label>
  )
}

export function SettingsPage() {
  const prefs = useGameStore((s) => s.preferences)
  const setPreferences = useGameStore((s) => s.setPreferences)
  const exportProgress = useGameStore((s) => s.exportProgress)
  const importProgress = useGameStore((s) => s.importProgress)
  const resetProgress = useGameStore((s) => s.resetProgress)
  const [importText, setImportText] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportProgress())
      setNotice({ tone: 'ok', text: 'Progress copied to the clipboard.' })
    } catch {
      setNotice({ tone: 'error', text: 'The browser blocked clipboard access. Use Download instead.' })
    }
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportProgress()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `system-design-quest-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setNotice({ tone: 'ok', text: 'Progress file downloaded.' })
  }

  const doImport = async () => {
    try {
      await importProgress(importText)
      setImportText('')
      setNotice({ tone: 'ok', text: 'Progress imported.' })
    } catch {
      setNotice({ tone: 'error', text: 'That does not look like a System Design Quest export. Nothing was changed.' })
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <header className="border-b border-[var(--color-rail)] pb-4">
        <p className="text-sm font-semibold text-[var(--color-amber)]">Stored only in this browser</p>
        <h1 className="font-display text-4xl font-extrabold text-chalk mt-1">Settings</h1>
      </header>

      {notice && (
        <p className={`feedback ${notice.tone === 'ok' ? 'feedback-ok' : 'feedback-miss'} text-sm`} role={notice.tone === 'ok' ? 'status' : 'alert'}>
          {notice.text}
        </p>
      )}

      <section className="panel px-5 py-2" aria-labelledby="prefs">
        <h2 id="prefs" className="sr-only">Preferences</h2>
        <Toggle
          label="Reduce motion"
          hint="Turns off confetti, pulsing stations and card slides."
          checked={prefs.reducedMotion}
          onChange={(v) => setPreferences({ reducedMotion: v })}
        />
        <Toggle
          label="Celebration sound"
          hint="A short chime when you clear a topic. Plays only after you have interacted with the page."
          checked={prefs.soundEnabled}
          onChange={(v) => setPreferences({ soundEnabled: v, hasGestureForSound: true })}
        />
      </section>

      <section className="panel p-5 space-y-3" aria-labelledby="backup">
        <h2 id="backup" className="font-display text-lg font-bold text-chalk">Back up or move your progress</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-quiet" onClick={download}>Download .json</button>
          <button type="button" className="btn-quiet" onClick={copy}>Copy export JSON</button>
        </div>
        <label htmlFor="import-json" className="block text-sm text-dim pt-2">Paste an export to restore it</label>
        <textarea
          id="import-json"
          className="field w-full h-28 font-mono text-xs"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder='{"version": 3, ...}'
        />
        <button type="button" className="btn-cta" disabled={!importText.trim()} onClick={doImport}>
          Import
        </button>
      </section>

      <section className="panel p-5 space-y-2 border-[rgba(255,90,78,0.35)]" aria-labelledby="danger">
        <h2 id="danger" className="font-display text-lg font-bold text-chalk">Start over</h2>
        <p className="text-sm text-dim">Clears XP, badges, unlocks, review history and drafts. This cannot be undone.</p>
        {!confirmReset ? (
          <button type="button" className="btn-quiet !border-[var(--color-fault)] !text-[var(--color-fault)]" onClick={() => setConfirmReset(true)}>
            Reset all progress
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-quiet !bg-[var(--color-fault)] !text-[var(--color-ink)] !border-[var(--color-fault)] font-semibold"
              onClick={async () => {
                await resetProgress()
                setConfirmReset(false)
                setNotice({ tone: 'ok', text: 'Progress reset. Launchpad is open again.' })
              }}
            >
              Confirm reset
            </button>
            <button type="button" className="btn-quiet" onClick={() => setConfirmReset(false)}>Keep my progress</button>
          </div>
        )}
      </section>
    </div>
  )
}
