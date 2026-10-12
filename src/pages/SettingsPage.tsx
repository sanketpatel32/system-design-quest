import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'

export function SettingsPage() {
  const prefs = useGameStore((s) => s.preferences)
  const setPreferences = useGameStore((s) => s.setPreferences)
  const exportProgress = useGameStore((s) => s.exportProgress)
  const importProgress = useGameStore((s) => s.importProgress)
  const resetProgress = useGameStore((s) => s.resetProgress)
  const [importText, setImportText] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={prefs.reducedMotion}
          onChange={(e) => setPreferences({ reducedMotion: e.target.checked })}
        />
        Reduce motion
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={prefs.soundEnabled}
          onChange={(e) => setPreferences({ soundEnabled: e.target.checked, hasGestureForSound: true })}
        />
        Celebration sound (after gesture)
      </label>
      <div>
        <button type="button" className="px-3 py-2 rounded border border-slate-600" onClick={() => navigator.clipboard.writeText(exportProgress())}>
          Copy export JSON
        </button>
      </div>
      <div>
        <textarea className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-2 text-xs" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste progress JSON" />
        <button type="button" className="mt-2 px-3 py-2 rounded bg-cyan-500/20 border border-cyan-400/40" onClick={() => importProgress(importText)}>
          Import
        </button>
      </div>
      <div>
        {!confirmReset ? (
          <button type="button" className="text-rose-300 underline" onClick={() => setConfirmReset(true)}>Reset all progress</button>
        ) : (
          <button type="button" className="px-3 py-2 rounded bg-rose-500/30 border border-rose-400/50" onClick={() => resetProgress()}>
            Confirm reset
          </button>
        )}
      </div>
    </div>
  )
}
