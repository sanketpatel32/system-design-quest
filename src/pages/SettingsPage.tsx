import { useRef, useState } from 'react'
import { useGameStore } from '../stores/gameStore'

type Notice = { tone: 'ok' | 'error'; text: string } | null

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 py-3 border-b border-[var(--color-rail)] last:border-0 cursor-pointer">
      <input type="checkbox" role="switch" className="switch mt-0.5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
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
  const [notice, setNotice] = useState<Notice>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const restoreFile = async (file: File | undefined) => {
    if (!file) return
    try {
      await importProgress(await file.text())
      setNotice({ tone: 'ok', text: `Restored progress from ${file.name}.` })
    } catch {
      setNotice({ tone: 'error', text: 'That file is not a DesignQuest backup. Nothing was changed.' })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

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
        <p className="text-[15px] text-dim mt-2">
          Your XP, cleared stations, review schedule, quiz attempts, boss drafts and mock-interview notes live in this
          browser's local storage. Nothing is sent to a server, so clearing site data or switching browsers loses it unless
          you keep a backup.
        </p>
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
        <p className="text-sm text-dim">A backup is a small .json file. Restoring one replaces the progress in this browser.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-cta" onClick={download}>Download backup</button>
          <button type="button" className="btn-quiet" onClick={() => fileRef.current?.click()}>Restore from file</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Backup file to restore"
            onChange={(e) => restoreFile(e.target.files?.[0])}
          />
        </div>
        <details className="pt-1">
          <summary className="cursor-pointer text-sm text-dim">Move between devices by copy and paste instead</summary>
          <div className="mt-3 space-y-2">
            <button type="button" className="btn-quiet" onClick={copy}>Copy backup text</button>
            <label htmlFor="import-json" className="block text-sm text-dim">Paste backup text to restore it</label>
            <textarea
              id="import-json"
              className="field w-full h-24 font-mono text-xs"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <button type="button" className="btn-quiet" disabled={!importText.trim()} onClick={doImport}>
              Restore pasted backup
            </button>
          </div>
        </details>
      </section>

      <section className="panel p-5 space-y-2 border-[rgba(255,90,78,0.35)]" aria-labelledby="danger">
        <h2 id="danger" className="font-display text-lg font-bold text-[var(--color-fault)]">Danger zone</h2>
        <p className="text-sm text-dim">Clears XP, badges, unlocks, review history and drafts. This cannot be undone.</p>
        <button type="button" className="btn-quiet !border-[var(--color-fault)] !text-[var(--color-fault)]" onClick={() => dialogRef.current?.showModal()}>
          Reset all progress
        </button>
        <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby="reset-title">
          <h3 id="reset-title" className="font-display text-xl font-bold text-chalk">Reset all progress?</h3>
          <p className="text-sm text-dim mt-2">XP, badges, cleared stations, review history and drafts will be deleted. Download a backup first if you might want them back.</p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" className="btn-quiet" autoFocus onClick={() => dialogRef.current?.close()}>Keep my progress</button>
            <button
              type="button"
              className="btn-quiet !bg-[var(--color-fault)] !text-[var(--color-ink)] !border-[var(--color-fault)] font-semibold"
              onClick={async () => {
                await resetProgress()
                dialogRef.current?.close()
                setNotice({ tone: 'ok', text: 'Progress reset. Launchpad is open again.' })
              }}
            >
              Yes, reset everything
            </button>
          </div>
        </dialog>
      </section>
    </div>
  )
}
