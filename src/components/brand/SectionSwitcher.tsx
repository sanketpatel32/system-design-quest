import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SECTIONS, SECTION_BRAND, questName, sectionOfTopic, sectionPalette, sectionPath, sectionTopics, isSectionId, pageSection, type SectionId } from '../../content/sections'
import { allTopics } from '../../content/catalog'
import { useGameStore } from '../../stores/gameStore'
import { RegionMotif } from '../map/RegionMotif'
import { LogoMark } from './Logo'

const LANDMARK: Partial<Record<SectionId, string>> = { 'system-design': 'r1-foundations' }

/** Which section the current page belongs to, if any */
export function useCurrentSection(): SectionId | null {
  const { pathname, search } = useLocation()
  if (pathname === '/cheat-sheet') return pageSection(search)
  if (pathname === '/revision') return new URLSearchParams(search).get('s') === 'all' ? null : pageSection(search)
  const m = /^\/(s|topic|quiz|boss)\/([^/]+)/.exec(pathname)
  if (!m) return null
  if (m[1] === 's') return isSectionId(m[2]) ? m[2] : null
  const slug = decodeURIComponent(m[2]!)
  const t = allTopics.find((x) => x.slug === slug)
  return t ? sectionOfTopic(t.id) : null
}

/** Two-tone wordmark that follows the section: "frontend" + green "quest". Swaps with a short pop (off under reduced motion). */
function Wordmark({ word, sidebar }: { word: string; sidebar: boolean }) {
  return (
    <span
      key={word}
      data-testid="wordmark"
      className={`wordmark-swap font-display leading-none tracking-[-0.01em] whitespace-nowrap ${sidebar ? 'text-[1.6rem]' : 'text-[1.2rem] max-[399px]:text-[0.95rem] sm:text-2xl'}`}
    >
      <span className="text-chalk">{word}</span><span className="text-[#58cc02]">quest</span>
    </span>
  )
}

type Pos = { left: number; top: number; width: number; sheet: boolean }

/**
 * The logo is also the section switcher: click (or Enter/Space) opens a menu of every section with its
 * landmark and progress. Rendered in a portal so no map layer can paint over it; a full-width sheet on phones.
 */
export function SectionSwitcher({ variant }: { variant: 'sidebar' | 'header' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<Pos | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const current = useCurrentSection()
  const topicProgress = useGameStore((s) => s.topicProgress)
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  // On Review and the Cheat Sheet, switching keeps you on that page for the new section
  const pageMode = pathname === '/revision' || pathname === '/cheat-sheet' ? pathname : null
  const hrefFor = (id: SectionId) => (pageMode ? `${pageMode}?s=${id}` : sectionPath(id))
  const allHref = pageMode === '/revision' ? '/revision?s=all' : '/'
  const allCurrent = pageMode === '/revision' ? new URLSearchParams(search).get('s') === 'all' : pathname === '/'

  const close = useCallback((refocus: boolean) => {
    setOpen(false)
    if (refocus) btnRef.current?.focus()
  }, [])

  // Close when the route changes (a section was picked)
  useEffect(() => { setOpen(false) }, [pathname, search])

  const place = useCallback(() => {
    const b = btnRef.current
    if (!b) return
    const r = b.getBoundingClientRect()
    const vw = document.documentElement.clientWidth
    if (vw < 640) {
      const header = document.querySelector('.shell-header')
      const top = header ? header.getBoundingClientRect().bottom : r.bottom + 6
      setPos({ left: 0, top, width: vw, sheet: true })
    } else {
      const width = Math.min(360, vw - 16)
      setPos({ left: Math.max(8, Math.min(r.left, vw - width - 8)), top: r.bottom + 8, width, sheet: false })
    }
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, place])

  // Focus the current section (or the first item) when the menu opens
  useEffect(() => {
    if (!open || !pos) return
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')
    if (!items?.length) return
    const cur = menuRef.current?.querySelector<HTMLElement>('[aria-current="page"]')
    ;(cur ?? items[0]!).focus()
  }, [open, pos])

  // Click or tap outside closes
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return
      close(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open, close])

  const onMenuKey = (e: React.KeyboardEvent) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const i = items.indexOf(document.activeElement as HTMLElement)
    const go = (n: number) => { e.preventDefault(); items[(n + items.length) % items.length]?.focus() }
    if (e.key === 'ArrowDown') go(i + 1)
    else if (e.key === 'ArrowUp') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(items.length - 1)
    else if (e.key === 'Escape') { e.preventDefault(); close(true) }
    else if (e.key === 'Tab') close(false)
    else if (e.key === ' ' && i >= 0) { e.preventDefault(); items[i]!.click() }
  }

  const onBtnKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true) }
  }

  const sidebar = variant === 'sidebar'
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`switcher-btn ${sidebar ? 'px-3 py-2' : 'px-1.5 py-1 max-[399px]:px-1 max-[399px]:gap-1'}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`${SECTION_BRAND[current ?? 'system-design'].word}quest: switch section`}
        data-testid={`section-switcher-${variant}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onBtnKey}
      >
        <span className="inline-flex items-center gap-2 max-[399px]:gap-1.5">
          <LogoMark size={sidebar ? 44 : 34} className={sidebar ? '' : 'max-[399px]:h-[30px] max-[399px]:w-[30px]'} />
          <Wordmark word={SECTION_BRAND[current ?? 'system-design'].word} sidebar={sidebar} />
        </span>
        <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" className={`switcher-chevron ${open ? 'switcher-chevron-open' : ''}`}>
          <path d="M3 5.2 7 9.2l4-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Sections"
          data-testid="section-switcher-menu"
          data-sheet={pos.sheet ? 'true' : undefined}
          className={`switcher-menu ${pos.sheet ? 'switcher-sheet' : ''}`}
          style={{ left: pos.left, top: pos.top, width: pos.width }}
          onKeyDown={onMenuKey}
        >
          <p className="px-3 pb-1 pt-1 text-xs font-extrabold uppercase tracking-wide text-dim" aria-hidden>{pageMode === '/revision' ? 'Review a section' : pageMode === '/cheat-sheet' ? 'Cheat sheet for' : 'Switch section'}</p>
          <ul className="flex flex-col gap-1" role="none">
            {SECTIONS.map((s) => {
              const topics = sectionTopics(s.id)
              const done = topics.filter((t) => topicProgress[t.id]?.completed).length
              const pct = topics.length ? Math.round((done / topics.length) * 100) : 0
              const p = sectionPalette(s.id)
              const on = s.id === current
              return (
                <li key={s.id} role="none">
                  <Link
                    to={hrefFor(s.id)}
                    role="menuitem"
                    tabIndex={-1}
                    aria-current={on ? 'page' : undefined}
                    data-testid={`switcher-item-${s.id}`}
                    className="switcher-item"
                    style={on ? { background: p.soft, borderColor: p.bright, color: p.deep } : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: on ? '#fff' : p.soft }} aria-hidden>
                      <RegionMotif regionId={LANDMARK[s.id] ?? s.regionIds[0]!} color={p.deep} size={22} />
                    </span>
                    <span className="min-w-0 flex-1 leading-tight" data-testid={`switcher-name-${s.id}`}>{questName(s.id)}</span>
                    <span className="switcher-pct tabular-nums" style={{ color: p.deep, background: on ? '#fff' : p.soft }} aria-label={`${pct}% cleared`}>{pct}%</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="mt-1 border-t-2 border-[var(--color-rail)] pt-1" role="none">
            <Link
              to={allHref}
              role="menuitem"
              tabIndex={-1}
              aria-current={allCurrent ? 'page' : undefined}
              data-testid="switcher-item-all"
              className="switcher-item justify-center text-[#1899d6]"
              onClick={(e) => { e.preventDefault(); setOpen(false); navigate(allHref) }}
            >
              All sections
            </Link>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
