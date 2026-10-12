export function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className={filled ? 'text-[var(--color-fault)]' : 'text-[#3A5470]'}>
      <path
        d="M12 21s-7-4.5-9-8.5C1.5 9.5 3.5 6 7 6c2 0 3.2 1.2 5 3.2C13.8 7.2 15 6 17 6c3.5 0 5.5 3.5 4 6.5-2 4-9 8.5-9 8.5z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function IconFlame() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="text-amber-400" aria-hidden>
      <path
        d="M12 22c4-2.5 6-6 6-10a6 6 0 0 0-10-4c-1 2-3 3-3 6 0 4 2.5 7 7 8z"
        fill="currentColor"
        opacity="0.85"
      />
      <path d="M12 22c-2-1.5-3-3.5-3-6 0-2 1-3.5 2-5 1 1.5 2 2.5 1 4-.5 1.5-1 2.5-0 3z" fill="#fde68a" />
    </svg>
  )
}

export function IconBadge() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="text-amber-200" aria-hidden>
      <circle cx="12" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 14 L6 22 L12 19 L18 22 L16 14" fill="currentColor" opacity="0.35" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}
