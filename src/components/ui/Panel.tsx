import type { ReactNode } from 'react'

export function Panel({
  children,
  className = '',
  glow = 'cyan',
}: {
  children: ReactNode
  className?: string
  glow?: 'cyan' | 'violet' | 'lime' | 'rose'
}) {
  const glowClass = {
    cyan: 'panel-glow-cyan',
    violet: 'panel-glow-violet',
    lime: 'panel-glow-lime',
    rose: 'panel-glow-rose',
  }[glow]
  return (
    <div className={`panel ${glowClass} rounded-2xl ${className}`}>
      <div className="panel-inner rounded-2xl p-5 sm:p-6">{children}</div>
    </div>
  )
}
