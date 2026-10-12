import { Link, NavLink } from 'react-router-dom'
import { useGameStore, useLevel, useStreak } from '../stores/gameStore'
import { BADGE_LABELS } from '../lib/progression/badges'
import { IconBadge, IconFlame } from './icons/HudIcons'

const nav = [
  { to: '/', label: 'Map' },
  { to: '/revision', label: 'Revision' },
  { to: '/cheat-sheet', label: 'Cheat' },
  { to: '/interview', label: 'Mock' },
  { to: '/settings', label: 'Data' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const xp = useGameStore((s) => s.xp)
  const level = useLevel()
  const streak = useStreak()
  const badges = useGameStore((s) => s.badges)
  const pct = ((xp % 500) / 500) * 100

  return (
    <div className="min-h-full flex flex-col">
      <div className="app-bg" aria-hidden />
      <header className="shell-header sticky top-0 z-50">
        <div className="max-w-[1180px] mx-auto px-4 py-2.5 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
            <Link to="/" className="font-display text-base font-extrabold tracking-tight text-[#f8fafc]">
              SD<span className="text-[var(--color-teal)]">Q</span>
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
            <div className="hud-block min-w-[130px]">
              <div className="flex justify-between text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
                <span>Lv</span>
                <span className="text-[var(--color-ink)] font-bold tabular-nums">{level}</span>
              </div>
              <div className="xp-track mt-1">
                <div className="xp-fill" style={{ width: `${pct}%` }} role="progressbar" aria-valuenow={xp % 500} aria-valuemin={0} aria-valuemax={500} />
              </div>
              <div className="mt-0.5 tabular-nums text-[10px] text-[var(--color-muted)]">{xp} xp</div>
            </div>
            <div className="hud-block flex items-center gap-1.5">
              <IconFlame />
              <span className="font-bold tabular-nums">{streak}</span>
            </div>
            {badges.length > 0 && (
              <div className="hud-block flex items-center gap-1.5" title={badges.map((b) => BADGE_LABELS[b as keyof typeof BADGE_LABELS] ?? b).join(', ')}>
                <IconBadge />
                <span className="font-bold tabular-nums">{badges.length}</span>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[1180px] mx-auto px-4 py-5">{children}</main>
    </div>
  )
}
