import type { ReactNode } from 'react'
import { NavIcon } from '../icons/HudIcons'

/** Friendly page header: a coloured banner with the page's icon. Colours pass AA with white text. */
const TONES = {
  sky: { bg: '#12749F', sh: '#0B4F6D' },
  purple: { bg: '#8350C7', sh: '#5E3594' },
  orange: { bg: '#C2410C', sh: '#9A3412' },
  slate: { bg: '#4B5563', sh: '#30363F' },
} as const

export function PageHero({
  eyebrow,
  title,
  icon,
  tone,
  children,
  aside,
}: {
  eyebrow: string
  title: string
  icon: 'map' | 'review' | 'cheat' | 'interview' | 'settings'
  tone: keyof typeof TONES
  children?: ReactNode
  aside?: ReactNode
}) {
  const t = TONES[tone]
  return (
    <header className="unit-banner flex flex-wrap items-center gap-4 p-5 sm:p-6" style={{ background: t.bg, ['--banner-shadow' as string]: t.sh }}>
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white shadow-[0_4px_0_rgba(0,0,0,0.2)] sm:h-20 sm:w-20">
        <NavIcon name={icon} size={44} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold uppercase tracking-wider text-white">{eyebrow}</p>
        <h1 className="font-display text-3xl sm:text-4xl leading-tight text-white">{title}</h1>
        {children && <div className="mt-1 font-bold text-white">{children}</div>}
      </div>
      {aside}
    </header>
  )
}
