/* Chunky filled icons (custom SVG, no emoji). Colours follow DESIGN.md. */
export function IconHeart({ filled, size = 26 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 21.2s-7.6-4.6-9.6-9.1C.9 8.6 3.1 4.6 6.9 4.6c2.2 0 3.6 1.2 5.1 3.1 1.5-1.9 2.9-3.1 5.1-3.1 3.8 0 6 4 4.5 7.5-2 4.5-9.6 9.1-9.6 9.1z"
        fill={filled ? '#FF4B4B' : '#E5E0D8'}
      />
      {filled && <path d="M6.5 8.2c.6-1.2 1.8-1.7 2.8-1.4" stroke="#FFB3B3" strokeWidth="2.2" strokeLinecap="round" fill="none" />}
    </svg>
  )
}

export function IconFlame({ size = 26, lit = true }: { size?: number; lit?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 22.5c-4.6 0-7.8-3-7.8-7.3 0-3.6 2.3-5.8 4-8 .9 1.6 1.9 2.5 2.9 2.7C11 7 12.2 4 14.6 1.6c.6 3.6 5.2 6.4 5.2 12.8 0 4.7-3.2 8.1-7.8 8.1z" fill={lit ? '#FF9600' : '#E5E0D8'} />
      <path d="M12 22.5c-2.4 0-4-1.6-4-3.9 0-2.4 2.1-3.8 3.4-6 1 2 4.6 3.1 4.6 6.1 0 2.3-1.6 3.8-4 3.8z" fill={lit ? '#FFC800' : '#F1EDE6'} />
    </svg>
  )
}

export function IconGem({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M6 3h12l4.5 6L12 22 1.5 9z" fill="#1CB0F6" />
      <path d="M6 3h12l4.5 6h-21z" fill="#84D8FF" />
      <path d="M8.5 9 12 22l3.5-13z" fill="#49C0F8" />
      <path d="M8 5.5h3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IconBadge({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M7 13 4.5 22l4-1.8L11 23l1-8zM17 13l2.5 9-4-1.8L13 23l-1-8z" fill="#FF4B4B" />
      <circle cx="12" cy="9" r="7.5" fill="#FFC800" />
      <circle cx="12" cy="9" r="4.8" fill="#FFE066" />
      <path d="M12 6.2l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z" fill="#E0A800" />
    </svg>
  )
}

export function IconLock({ size = 30, color = '#AFA79A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <rect x="4.5" y="10" width="15" height="11" rx="3.5" fill={color} />
      <circle cx="12" cy="15.5" r="1.8" fill="#fff" />
    </svg>
  )
}

export function IconStar({ size = 30, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export function IconCheck({ size = 30, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M4.5 12.5l5 5 10-11" fill="none" stroke={color} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconBook({ size = 30, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M3 5.5C5.8 4.3 9 4.5 12 6.5v13c-3-2-6.2-2.2-9-1z" fill={color} />
      <path d="M21 5.5c-2.8-1.2-6-1-9 1v13c3-2 6.2-2.2 9-1z" fill={color} opacity="0.75" />
    </svg>
  )
}

export function IconChest({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <path d="M5 17c0-7 6.5-11 15-11s15 4 15 11z" fill="#C97A2B" />
      <path d="M5 17h30v15a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill="#E08E3A" />
      <path d="M5 17h30v4H5z" fill="#FFC800" />
      <path d="M12 7.5V35M28 7.5V35" stroke="#FFC800" strokeWidth="3" />
      <rect x="16.5" y="16" width="7" height="9" rx="2" fill="#FFE066" stroke="#8A5A00" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="1.3" fill="#8A5A00" />
    </svg>
  )
}

export function IconCastle({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <path d="M6 14h6v-4h4v4h8v-4h4v4h6v22H6z" fill="#fff" />
      <path d="M6 14h28v4H6z" fill="#FFE9A6" />
      <path d="M16 36v-8a4 4 0 0 1 8 0v8z" fill="#8A5A00" />
      <path d="M20 10V2l7 3-7 3" fill="#FF4B4B" />
      <path d="M20 2v8" stroke="#8A5A00" strokeWidth="1.8" />
    </svg>
  )
}

/* Navigation icons */
export function NavIcon({ name, size = 24 }: { name: 'map' | 'review' | 'cheat' | 'interview' | 'settings'; size?: number }) {
  const p: Record<string, React.ReactNode> = {
    map: (
      <>
        <path d="M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20z" fill="#58CC02" />
        <path d="M8.5 4v13.5M15.5 6.5V20" stroke="#3C8A02" strokeWidth="1.8" />
        <circle cx="12" cy="10.5" r="2.4" fill="#FFC800" stroke="#fff" strokeWidth="1.4" />
      </>
    ),
    review: (
      <>
        <rect x="6.5" y="3" width="14" height="16" rx="3" fill="#84D8FF" />
        <rect x="3.5" y="6" width="14" height="15.5" rx="3" fill="#1CB0F6" />
        <path d="M7.5 12.5l2.3 2.3 4.2-4.6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    cheat: (
      <>
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" fill="#CE82FF" />
        <path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5A2.5 2.5 0 0 1 4 21.5z" fill="#A560E0" />
        <path d="M9 7h7M9 10.5h5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    interview: (
      <>
        <path d="M3 5.5A3.5 3.5 0 0 1 6.5 2h11A3.5 3.5 0 0 1 21 5.5v7a3.5 3.5 0 0 1-3.5 3.5H11l-5 4.5V16h0A3.5 3.5 0 0 1 3 12.5z" fill="#FF9600" />
        <circle cx="8.5" cy="9" r="1.4" fill="#fff" />
        <circle cx="12" cy="9" r="1.4" fill="#fff" />
        <circle cx="15.5" cy="9" r="1.4" fill="#fff" />
      </>
    ),
    settings: (
      <>
        <path d="M12 1.8l2.2 2.4 3.2-.4.6 3.2 2.8 1.6-1.3 3 1.3 3-2.8 1.6-.6 3.2-3.2-.4L12 22.2l-2.2-2.4-3.2.4-.6-3.2-2.8-1.6 1.3-3-1.3-3L6 7l.6-3.2 3.2.4z" fill="#AFA79A" />
        <circle cx="12" cy="12" r="3.6" fill="#fff" />
      </>
    ),
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {p[name]}
    </svg>
  )
}
