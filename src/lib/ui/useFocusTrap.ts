import { useEffect } from 'react'
import type { RefObject } from 'react'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])'

/**
 * Modal focus handling in one place: focus moves into the dialog when it opens, Tab and Shift+Tab
 * cycle inside it, Escape calls onClose, and focus goes back to whatever opened it.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onClose?: () => void) {
  useEffect(() => {
    if (!active) return
    const opener = document.activeElement as HTMLElement | null
    const root = ref.current
    const items = () => [...(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter((el) => el.offsetParent !== null || el === document.activeElement)
    if (root && !root.contains(document.activeElement)) (items()[0] ?? root).focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !root) return
      const list = items()
      if (!list.length) return
      const first = list[0]!
      const last = list[list.length - 1]!
      if (e.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (opener && document.contains(opener)) opener.focus()
    }
  }, [ref, active, onClose])
}
