import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const styles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-cyan-400/90 to-cyan-600/90 text-slate-950 border-cyan-300/50 shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:shadow-[0_0_32px_rgba(34,211,238,0.5)]',
  secondary:
    'bg-slate-900/70 text-slate-100 border-slate-600/80 hover:border-violet-400/50 hover:bg-slate-800/80',
  ghost: 'bg-transparent text-slate-300 border-transparent hover:bg-white/5 hover:text-white',
  danger:
    'bg-gradient-to-b from-rose-500/90 to-red-700/90 text-white border-rose-300/40 shadow-[0_0_20px_rgba(244,63,94,0.35)]',
}

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${styles[variant]} ${className}`}
      {...props}
    />
  )
}
