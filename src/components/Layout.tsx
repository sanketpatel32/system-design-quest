import { Link, NavLink } from 'react-router-dom'
import { useGameStore, useLevel, useStreak } from '../stores/gameStore'
import { BADGE_LABELS } from '../lib/progression/badges'

const nav = [
  { to: '/', label: 'World Map' },
  { to: '/revision', label: 'Revision' },
  { to: '/cheat-sheet', label: 'Cheat Sheet' },
  { to: '/interview', label: 'Interview Mode' },
  { to: '/settings', label: 'Settings' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const xp = useGameStore((s) => s.xp)
  const level = useLevel()
  const streak = useStreak()
  const badges = useGameStore((s) => s.badges)

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-cyan-500/20 bg-[#0d1428]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
          <Link to="/" className="text-lg font-semibold tracking-tight text-cyan-300">
            System Design Quest
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm" aria-label="Main">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1 rounded-full border ${isActive ? 'border-cyan-400 text-cyan-200 bg-cyan-500/10' : 'border-slate-700 text-slate-300 hover:border-cyan-500/40'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <div className="min-w-[120px]">
              <div className="text-slate-400">Level {level}</div>
              <div className="h-2 rounded bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-violet-400"
                  style={{ width: `${((xp % 500) / 500) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={xp % 500}
                  aria-valuemin={0}
                  aria-valuemax={500}
                />
              </div>
              <div className="text-slate-500">{xp} XP</div>
            </div>
            <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-400/30 text-amber-200">
              🔥 {streak}d
            </span>
            {badges.length > 0 && (
              <span className="text-slate-400" title={badges.map((b) => BADGE_LABELS[b as keyof typeof BADGE_LABELS] ?? b).join(', ')}>
                🏅 {badges.length}
              </span>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
