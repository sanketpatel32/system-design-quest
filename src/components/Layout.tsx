import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useGameStore, useLevel, useStreak } from '../stores/gameStore'
import { BADGE_LABELS } from '../lib/progression/badges'
import { IconBadge, IconFlame, IconGem, NavIcon } from './icons/HudIcons'
import { Mascot } from './art/Mascot'
import { HelpShortcuts } from './HelpShortcuts'

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

  // The in-app setting applies the same rules as the OS-level prefers-reduced-motion
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
  }, [reducedMotion])

  return (
    <div className="min-h-full flex flex-col">
      <header className="shell-header sticky top-0 z-50">
        <div className="max-w-[1180px] mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="System Design Quest, back to map">
              <Mascot size={40} />
              <span className="font-display text-2xl text-[var(--color-hero-deep)] hidden sm:inline">designquest</span>
            </Link>
            <nav className="hidden md:flex gap-1" aria-label="Main">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                >
                  <NavIcon name={item.icon} size={22} /><span className="sr-only xl:hidden">{item.label}</span>
                  <span className="hidden xl:inline">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="relative flex items-center gap-1">
            <button
              type="button"
              className="flex items-center gap-1"
              aria-expanded={hudOpen}
              aria-controls="hud-explainer"
              aria-label={`Level ${level}, ${xp} xp, ${streak}-day streak${badges.length ? `, ${badges.length} badges` : ''}. Show details`}
              onClick={() => setHudOpen((v) => !v)}
            >
              <span className="hud-chip text-[#C25E00]">
                <IconFlame lit={streak > 0} />
                <span className="tabular-nums">{streak}</span>
              </span>
              <span className="hud-chip text-[#12749f]">
                <IconGem />
                <span className="tabular-nums">{xp} xp</span>
              </span>
              {badges.length > 0 && (
                <span className="hud-chip text-[#8A5A00] hidden sm:inline-flex">
                  <IconBadge />
                  <span className="tabular-nums">{badges.length}</span>
                </span>
              )}
            </button>
            {hudOpen && (
              <div id="hud-explainer" className="panel anim-pop absolute right-0 top-full mt-2 w-80 p-4 text-[15px] z-50 space-y-3">
                <div>
                  <div className="flex justify-between font-extrabold"><span>Level {level}</span><span className="text-dim tabular-nums">{xp % 500}/500</span></div>
                  <div className="xp-track mt-1.5">
                    <div className="xp-fill" style={{ width: `${((xp % 500) / 500) * 100}%` }} role="progressbar" aria-label="XP to next level" aria-valuenow={xp % 500} aria-valuemin={0} aria-valuemax={500} />
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
              className="hud-chip text-dim px-3"
              data-testid="help-shortcuts-trigger"
              aria-label="Keyboard shortcuts"
              onClick={() => document.dispatchEvent(new CustomEvent('sdq-toggle-help'))}
            >
              ?
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[1180px] mx-auto px-4 py-6 pb-28 md:pb-10">{children}</main>
      <nav className="tabbar md:hidden" aria-label="Main">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
            <span className="tab-icon"><NavIcon name={item.icon} size={24} /></span>
            {item.label === 'Cheat sheet' ? 'Sheet' : item.label}
          </NavLink>
        ))}
      </nav>
      <HelpShortcuts />
    </div>
  )
}
