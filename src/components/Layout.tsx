import { Link, NavLink } from 'react-router-dom'
import { useGameStore, useLevel, useStreak } from '../stores/gameStore'
import { BADGE_LABELS } from '../lib/progression/badges'
import { IconBadge, IconFlame } from './icons/HudIcons'
import { HelpShortcuts } from './HelpShortcuts'

const nav = [
  { to: '/', label: 'Map' },
  { to: '/revision', label: 'Review' },
  { to: '/cheat-sheet', label: 'Cheat sheet' },
  { to: '/interview', label: 'Interview' },
  { to: '/settings', label: 'Settings' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const xp = useGameStore((s) => s.xp)
  const level = useLevel()
  const streak = useStreak()
  const badges = useGameStore((s) => s.badges)
  const pct = ((xp % 500) / 500) * 100

  return (
    <div className="min-h-full flex flex-col">
      <header className="shell-header sticky top-0 z-50">
        <div className="max-w-[1180px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
            <Link to="/" className="font-display text-lg font-extrabold tracking-tight text-chalk flex items-center gap-2" aria-label="System Design Quest, back to map">
              <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
                <path d="M2 15h7l4-8h7" fill="none" stroke="var(--color-amber)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="11" cy="11" r="3.5" fill="var(--color-ink)" stroke="var(--color-chalk)" strokeWidth="2" />
              </svg>
              <span>
                Design<span className="text-[var(--color-amber)]">Quest</span>
              </span>
            </Link>
            <nav className="flex flex-wrap gap-4 sm:gap-5" aria-label="Main">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-stretch gap-2 text-xs">
            <div className="hud-block min-w-[150px]">
              <div className="flex justify-between items-baseline gap-3">
                <span className="font-display font-semibold text-chalk">Level {level}</span>
                <span className="tabular-nums text-dim">{xp} xp</span>
              </div>
              <div className="xp-track mt-1.5">
                <div
                  className="xp-fill"
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-label="XP to next level"
                  aria-valuenow={xp % 500}
                  aria-valuemin={0}
                  aria-valuemax={500}
                />
              </div>
            </div>
            <div className="hud-block flex items-center gap-1.5" title={`${streak}-day streak`} aria-label={`${streak}-day streak`}>
              <IconFlame />
              <span className="font-bold tabular-nums">{streak}</span>
            </div>
            {badges.length > 0 && (
              <div className="hud-block flex items-center gap-1.5" title={badges.map((b) => BADGE_LABELS[b as keyof typeof BADGE_LABELS] ?? b).join(', ')}>
                <IconBadge />
                <span className="font-bold tabular-nums">{badges.length}</span>
              </div>
            )}
            <button
              type="button"
              className="hud-block px-3 font-display font-bold text-chalk hover:border-[var(--color-dim)]"
              data-testid="help-shortcuts-trigger"
              aria-label="Keyboard shortcuts"
              onClick={() => document.dispatchEvent(new CustomEvent('sdq-toggle-help'))}
            >
              ?
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[1180px] mx-auto px-4 py-5">{children}</main>
      <HelpShortcuts />
    </div>
  )
}
