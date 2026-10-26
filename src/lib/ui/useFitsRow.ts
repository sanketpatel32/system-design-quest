import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'

/**
 * Phone header: true while an optional chip (the streak) fits next to the wordmark. When the right-hand
 * group would overflow (long section word, big numbers, the Sign in button), the chip is dropped; it
 * comes back once there is room for it again.
 */
export function useFitsRow(group: RefObject<HTMLElement | null>, optional: RefObject<HTMLElement | null>) {
  const [fits, setFits] = useState(true)
  useLayoutEffect(() => {
    const el = group.current
    if (!el || typeof ResizeObserver === 'undefined') return
    let chipWidth = 0
    let current = true
    const check = () => {
      const row = el.parentElement
      if (!row) return
      const chip = optional.current
      if (chip && current) chipWidth = chip.getBoundingClientRect().width || chipWidth
      const cs = getComputedStyle(row)
      const others = [...row.children].filter((c) => c !== el).reduce((sum, c) => sum + (c as HTMLElement).offsetWidth, 0)
      const free = row.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - (parseFloat(cs.columnGap) || 0) - others - el.scrollWidth
      const next = current ? free >= -0.5 : free >= chipWidth + 2
      if (next !== current) {
        current = next
        setFits(next)
      }
    }
    const ro = new ResizeObserver(check)
    const watch = () => {
      ro.disconnect()
      ro.observe(el)
      if (el.parentElement) ro.observe(el.parentElement)
      for (const c of el.children) {
        ro.observe(c)
        for (const g of c.children) ro.observe(g)
      }
      check()
    }
    const mo = new MutationObserver(watch)
    mo.observe(el, { childList: true, subtree: true, characterData: true })
    watch()
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [group, optional])
  return fits
}
