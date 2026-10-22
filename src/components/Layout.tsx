import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useGameStore, useLevel, useStreak } from '../stores/gameStore'
import { BADGE_LABELS } from '../lib/progression/badges'
import { IconBadge, IconFlame, IconGem, NavIcon } from './icons/HudIcons'
import { HelpShortcuts } from './HelpShortcuts'
import { SectionSwitcher, useCurrentSection } from './brand/SectionSwitcher'
import { questName } from '../content/sections'
import { AccountButton } from './AccountButton'

const nav = [
  { to: '/', label: 'Learn', icon: 'map' },
  { to: '/revision', label: 'Review', icon: 'review' },
  { to: '/cheat-sheet', label: 'Cheat sheet', icon: 'cheat' },
  { to: '/interview', label: 'Interview', icon: 'interview' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
] as const

export function Layout({ children }: { children: React.ReactNode }) {
  const xp = useGameStore((s) => s.xp)
  const level = useLevel()
  const streak = useStreak()
  const badges = useGameStore((s) => s.badges)
  const reducedMotion = useGameStore((s) => s.preferences.reducedMotion)
  const [hudOpen, setHudOpen] = useState(false)
  // Sparkle on the xp chip whenever xp goes up
  const prevXp = useRef(xp)
  const [sparkle, setSparkle] = useState(0)
  useEffect(() => {
    if (xp > prevXp.current) setSparkle((k) => k + 1)
    prevXp.current = xp
  }, [xp])
  const { pathname } = useLocation()
  const inQuiz = pathname.startsWith('/quiz/')
  const currentSection = useCurrentSection()
  // Tab title follows the section: "Frontend Quest", "Review · Backend Quest"; home is System Design Quest
  useEffect(() => {
    const quest = questName(currentSection ?? 'system-design')
    const page = pathname === '/revision' ? 'Review' : pathname === '/cheat-sheet' ? 'Cheat sheet' : null
    document.title = page ? `${page} · ${quest}` : quest
  }, [currentSection, pathname])

  // The in-app setting applies the same rules as the OS-level prefers-reduced-motion
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
  }, [reducedMotion])

  return (
    <div className="min-h-full flex flex-col lg:pl-[15.5rem]">
      <aside className="sidebar hidden lg:flex">
        <div className="flex"><SectionSwitcher variant="sidebar" /></div>
        <nav className="mt-4 flex flex-col gap-1.5" aria-label="Main">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <NavIcon name={item.icon} size={30} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <header className={`shell-header sticky top-0 z-50 short:static ${inQuiz ? 'max-lg:hidden' : ''}`} data-testid="app-header">
        <div className="max-w-[73.75rem] 2xl:max-w-[80rem] mx-auto px-3 max-[399px]:px-2 sm:px-4 py-2 flex items-center justify-between gap-3 max-[399px]:gap-1.5">
          <div className="flex shrink-0 lg:invisible"><SectionSwitcher variant="header" /></div>
          <div className="relative flex min-w-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              className="flex min-h-[44px] items-center gap-1"
              aria-expanded={hudOpen}
              aria-controls="hud-explainer"
              aria-label={`Level ${level}, ${xp} xp, ${streak}-day streak${badges.length ? `, ${badges.length} badges` : ''}. Show details`}
              onClick={() => setHudOpen((v) => !v)}
            >
              <span className="hud-chip text-flame-ink max-[479px]:hidden" title={`${streak}-day streak`}>
                <IconFlame lit={streak > 0} />
                <span className="tabular-nums">{streak}</span>
              </span>
              <span className="hud-chip text-teal" title={`Level ${level} · ${xp % 500} of 500 xp to the next level`}>
                <span className="relative inline-flex">
                  <IconGem />
                  {sparkle > 0 && (
                    <span key={sparkle} className="xp-sparkle" aria-hidden>
                      <i /><i /><i />
                    </span>
                  )}
                </span>
                <span className="tabular-nums">{xp}<span className="hidden sm:inline"> xp</span></span>
              </span>
              {badges.length > 0 && (
                <span className="hud-chip text-gold-deep inline-flex" title={`${badges.length} badge${badges.length === 1 ? "" : "s"} earned`}>
                  <IconBadge />
                  <span className="tabular-nums">{badges.length}</span>
                </span>
              )}
            </button>
            {hudOpen && (
              <div id="hud-explainer" className="panel anim-pop absolute right-0 top-full mt-2 w-80 p-4 text-[0.9375rem] z-50 space-y-3">
                <div>
                  <div className="flex justify-between font-extrabold"><span>Level {level}</span><span className="text-dim tabular-nums">{xp % 500}/500</span></div>
                  <div className="xp-track mt-1.5">
                    <div className="xp-fill" style={{ ['--fill' as string]: `${((xp % 500) / 500) * 100}%` }} role="progressbar" aria-label="XP to next level" aria-valuenow={xp % 500} aria-valuemin={0} aria-valuemax={500} />
                  </div>
                </div>
                <p className="text-dim">XP comes from clearing quizzes and boss fights. Every 500 XP is a level.</p>
                <p><span className="font-extrabold">{streak}-day streak.</span> <span className="text-dim">Days in a row you studied; any quiz or review counts.</span></p>
                {badges.length > 0 && (
                  <p><span className="font-extrabold">Badges:</span> <span className="text-dim">{badges.map((b) => BADGE_LABELS[b as keyof typeof BADGE_LABELS] ?? b).join(', ')}</span></p>
                )}
              </div>
            )}
            <button
              type="button"
              className="hud-chip text-dim px-3 hidden sm:inline-flex"
              data-testid="help-shortcuts-trigger"
              aria-label="Keyboard shortcuts"
              onClick={() => document.dispatchEvent(new CustomEvent('sdq-toggle-help'))}
            >
              ?
            </button>
            <AccountButton />
          </div>
        </div>
      </header>
      <main className={`flex-1 w-full max-w-[73.75rem] 2xl:max-w-[80rem] mx-auto pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] ${inQuiz ? 'pt-3 sm:pt-6 short:pt-1 lg:pt-6' : 'pt-6'} pb-[calc(7rem+env(safe-area-inset-bottom))] short:pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-10`}>{children}</main>
      <nav className={`tabbar lg:hidden ${inQuiz ? 'hidden' : ''}`} aria-label="Main">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
            <span className="tab-icon"><NavIcon name={item.icon} size={24} /></span>
            <span className="short:sr-only">{item.label === 'Cheat sheet' ? 'Sheet' : item.label}</span>
          </NavLink>
        ))}
      </nav>
      <HelpShortcuts />
    </div>
  )
}
