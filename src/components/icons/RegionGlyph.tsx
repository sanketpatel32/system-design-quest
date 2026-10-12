import type { RegionGlyphId } from '../../lib/design/regionTheme'

export function RegionGlyph({ id, color, size = 28 }: { id: RegionGlyphId; color: string; size?: number }) {
  const s = size
  switch (id) {
    case 'launch':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden>
          <path d="M6 22 L16 6 L20 14 L26 12 L16 26 Z" fill={color} opacity="0.9" />
          <path d="M10 20 L14 14" stroke="#07090c" strokeWidth="1.2" />
        </svg>
      )
    case 'network':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="16" r="4" fill={color} />
          <circle cx="6" cy="10" r="2.5" fill={color} opacity="0.7" />
          <circle cx="26" cy="10" r="2.5" fill={color} opacity="0.7" />
          <circle cx="8" cy="24" r="2.5" fill={color} opacity="0.7" />
          <path d="M8 11 L14 15 M24 11 L18 15 M9 23 L14 18" stroke={color} strokeWidth="1.2" />
        </svg>
      )
    case 'traffic':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden>
          <rect x="13" y="4" width="6" height="24" rx="2" fill={color} />
          <circle cx="16" cy="10" r="2" fill="#07090c" />
          <circle cx="16" cy="16" r="2" fill="#07090c" />
          <circle cx="16" cy="22" r="2" fill="#07090c" />
        </svg>
      )
    case 'frost':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden>
          <path d="M16 4 L18 14 L28 16 L18 18 L16 28 L14 18 L4 16 L14 14 Z" fill="none" stroke={color} strokeWidth="2" />
        </svg>
      )
    case 'citadel':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden>
          <path d="M6 26 V14 L10 10 V14 L16 6 L22 14 V10 L26 14 V26 Z" fill={color} opacity="0.85" />
          <rect x="13" y="18" width="6" height="8" fill="#07090c" />
        </svg>
      )
    case 'rail':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden>
          <path d="M4 20 H28" stroke={color} strokeWidth="3" />
          <path d="M8 20 V12 H12 V20 M20 20 V12 H24 V20" stroke={color} strokeWidth="2" fill="none" />
        </svg>
      )
    case 'peak':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden>
          <path d="M4 26 L12 10 L16 18 L20 8 L28 26 Z" fill={color} opacity="0.8" />
        </svg>
      )
    case 'port':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden>
          <ellipse cx="16" cy="20" rx="10" ry="4" fill={color} opacity="0.5" />
          <path d="M10 20 Q16 6 22 20" fill={color} />
          <circle cx="16" cy="12" r="2" fill="#07090c" />
        </svg>
      )
    case 'vault':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden>
          <rect x="8" y="14" width="16" height="14" rx="2" fill={color} />
          <circle cx="16" cy="21" r="3" fill="#07090c" />
          <path d="M16 8 V14" stroke={color} strokeWidth="2" />
        </svg>
      )
    case 'colosseum':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden>
          <ellipse cx="16" cy="20" rx="12" ry="6" fill="none" stroke={color} strokeWidth="2" />
          <path d="M6 20 V12 Q16 4 26 12 V20" fill="none" stroke={color} strokeWidth="2" />
        </svg>
      )
    case 'summit':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden>
          <path d="M16 4 L20 14 H28 L22 20 L24 28 L16 24 L8 28 L10 20 L4 14 H12 Z" fill={color} opacity="0.75" />
        </svg>
      )
    default:
      return null
  }
}
