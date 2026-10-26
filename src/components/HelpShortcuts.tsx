import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusTrap } from '../lib/ui/useFocusTrap'

export function HelpShortcuts() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useFocusTrap(panelRef, open, close)

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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-chalk/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      onClick={() => setOpen(false)}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="panel anim-pop max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-3">
          <h2 id="help-title" className="font-display text-2xl text-chalk">Keyboard shortcuts</h2>
          <button type="button" className="btn-quiet btn-sm" onClick={() => setOpen(false)} aria-label="Close help">
            Esc
          </button>
        </div>
        <ul className="font-bold text-chalk space-y-3">
          <li><kbd className="kbd">?</kbd> Toggle this help</li>
          <li><kbd className="kbd">1</kbd> to <kbd className="kbd">4</kbd> Select an MCQ option (quiz)</li>
          <li><kbd className="kbd">Enter</kbd> Submit the current question</li>
          <li><kbd className="kbd">←</kbd> and <kbd className="kbd">→</kbd> Previous or next lesson card</li>
        </ul>
        <p className="text-sm text-dim">Shortcuts pause while focus is in a text field.</p>
      </div>
    </div>
  )
}
