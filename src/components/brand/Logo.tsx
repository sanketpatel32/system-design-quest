/**
 * designquest mark: Byte's head as a chunky green tile. The antenna is a tiny system diagram
 * (one node fanning out to two), and the face screen is the "server" the whole course is about.
 */
export function LogoMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className={className}>
      {/* antenna diagram */}
      <path d="M24 13V7M24 7 15 3.5M24 7l9-3.5" stroke="#2f7d00" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <circle cx="15" cy="3.5" r="2.6" fill="#1cb0f6" />
      <circle cx="33" cy="3.5" r="2.6" fill="#ffc800" />
      <circle cx="24" cy="7.5" r="3.2" fill="#ff9600" />
      {/* head tile with chunky bottom edge */}
      <rect x="5" y="15" width="38" height="31" rx="11" fill="#46a302" />
      <rect x="5" y="12" width="38" height="31" rx="11" fill="#58cc02" />
      {/* face screen */}
      <rect x="11" y="18" width="26" height="17" rx="6" fill="#fff" />
      <rect x="16.5" y="22" width="4.5" height="7" rx="2.25" fill="#29303d" />
      <rect x="27" y="22" width="4.5" height="7" rx="2.25" fill="#29303d" />
      <path d="M21.5 31.2q2.5 1.8 5 0" stroke="#29303d" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* status LEDs */}
      <circle cx="16" cy="39" r="1.6" fill="#d7ffb8" />
      <circle cx="21" cy="39" r="1.6" fill="#d7ffb8" opacity="0.6" />
    </svg>
  )
}

export function Logo({ size = 40, wordmark = true, className = '' }: { size?: number; wordmark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {wordmark && (
        <span className="font-display leading-none tracking-[-0.01em]" style={{ fontSize: size * 0.62 }}>
          <span className="text-chalk">design</span>
          <span className="text-[#58cc02]">quest</span>
        </span>
      )}
    </span>
  )
}
