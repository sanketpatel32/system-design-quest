import type { ReactNode } from 'react'
import { NavIcon } from '../icons/HudIcons'

/** Friendly page header: a coloured banner with the page's icon. Colours pass AA with white text. */
const TONES = {
  sky: { bg: 'var(--color-teal)', sh: 'var(--color-teal-shadow)' },
  purple: { bg: 'var(--color-lilac-ink)', sh: 'var(--color-lilac-shadow)' },
  orange: { bg: 'var(--color-banner-orange)', sh: 'var(--color-banner-orange-shadow)' },
  slate: { bg: 'var(--color-banner-slate)', sh: 'var(--color-banner-slate-shadow)' },
} as const

export function PageHero({
  meta,
  title,
  icon,
  tone,
  children,
  aside,
}: {
  meta: string
  title: string
  icon: 'map' | 'review' | 'cheat' | 'interview' | 'settings'
  tone: keyof typeof TONES
  children?: ReactNode
  aside?: ReactNode
}) {
  const t = TONES[tone]
  return (
    <header className="unit-banner flex flex-wrap items-center gap-3 p-4 sm:gap-4 sm:p-6" style={{ background: t.bg, ['--banner-shadow' as string]: t.sh }}>
      <div className="hidden sm:grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-card shadow-[0_4px_0_var(--color-shade-tile)]">
        <NavIcon name={icon} size={44} />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-[1.75rem] sm:text-4xl leading-tight text-white">{title}</h1>
        <p className="mt-1 text-sm font-extrabold text-white">{meta}</p>
        {children && <div className="mt-1 hidden font-bold text-white sm:block">{children}</div>}
      </div>
      {aside}
    </header>
  )
}
