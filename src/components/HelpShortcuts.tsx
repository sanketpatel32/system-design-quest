import { useEffect, useState } from 'react'

export function HelpShortcuts() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onToggle = () => setOpen((v) => !v)
    document.addEventListener('sdq-toggle-help', onToggle)
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
      if (e.key === '?' || (e.code === 'Slash' && e.shiftKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('sdq-toggle-help', onToggle)
    }
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      onClick={() => setOpen(false)}
    >
      <div
        className="panel-slab max-w-md w-full p-5 space-y-4 shadow-2xl border border-[var(--color-line)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-3">
          <h2 id="help-title" className="font-display text-lg font-bold text-chalk">Keyboard shortcuts</h2>
          <button type="button" className="btn-quiet text-xs" onClick={() => setOpen(false)} aria-label="Close help">
            Esc
          </button>
        </div>
        <ul className="text-sm text-chalk space-y-2">
          <li><kbd className="font-mono text-[var(--color-teal)]">?</kbd> — toggle this help</li>
          <li><kbd className="font-mono text-[var(--color-teal)]">1</kbd>–<kbd className="font-mono text-[var(--color-teal)]">4</kbd> — select MCQ option (quiz)</li>
          <li><kbd className="font-mono text-[var(--color-teal)]">Enter</kbd> — submit current question</li>
          <li><kbd className="font-mono text-[var(--color-teal)]">←</kbd> / <kbd className="font-mono text-[var(--color-teal)]">→</kbd> — previous / next lesson card</li>
        </ul>
        <p className="text-xs text-[var(--color-muted)]">Shortcuts pause while focus is in a text field.</p>
      </div>
    </div>
  )
}
