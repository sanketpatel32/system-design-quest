/**
 * "Byte" — the DesignQuest mascot: a friendly little server-bot. Original SVG, see DESIGN.md "Mascot".
 * Moods: idle (default), happy (arms up, big smile), sad (droopy antenna, frown), think (eyes up, hand on chin).
 */
export type Mood = 'idle' | 'happy' | 'sad' | 'think'

export function Mascot({ mood = 'idle', size = 120, className = '', title }: { mood?: Mood; size?: number; className?: string; title?: string }) {
  const body = '#58CC02'
  const shade = '#3C8A02'
  const happy = mood === 'happy'
  const sad = mood === 'sad'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-mood={mood}
    >
      {/* shadow */}
      <ellipse cx="60" cy="113" rx="30" ry="5" fill="#000" opacity="0.08" />
      {/* antenna */}
      <path d={sad ? 'M60 24 Q 62 14 72 12' : 'M60 24 V 10'} stroke={shade} strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx={sad ? 73 : 60} cy={sad ? 12 : 9} r="6" fill={happy ? '#FFC800' : sad ? '#AFA79A' : '#FF4B4B'} />
      {/* arms */}
      {happy ? (
        <>
          <path d="M24 64 Q 12 50 14 36" stroke={shade} strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M96 64 Q 108 50 106 36" stroke={shade} strokeWidth="9" strokeLinecap="round" fill="none" />
        </>
      ) : mood === 'think' ? (
        <>
          <path d="M24 70 Q 14 80 20 92" stroke={shade} strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M96 72 Q 92 62 80 64" stroke={shade} strokeWidth="9" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <path d={sad ? 'M24 70 Q 16 84 20 96' : 'M24 68 Q 12 74 14 86'} stroke={shade} strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d={sad ? 'M96 70 Q 104 84 100 96' : 'M96 68 Q 108 74 106 86'} stroke={shade} strokeWidth="9" strokeLinecap="round" fill="none" />
        </>
      )}
      {/* feet */}
      <rect x="38" y="98" width="16" height="12" rx="6" fill={shade} />
      <rect x="66" y="98" width="16" height="12" rx="6" fill={shade} />
      {/* body */}
      <rect x="22" y="22" width="76" height="82" rx="26" fill={body} />
      <rect x="22" y="22" width="76" height="82" rx="26" fill="none" stroke={shade} strokeWidth="4" />
      <path d="M34 30 Q 44 26 54 28" stroke="#A5ED6E" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* face screen */}
      <rect x="32" y="36" width="56" height="36" rx="16" fill="#fff" />
      {/* eyes */}
      {happy ? (
        <>
          <path d="M42 54 Q 47 46 52 54" stroke="#29303D" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M68 54 Q 73 46 78 54" stroke="#29303D" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="47" cy={mood === 'think' ? 50 : 53} rx="5" ry="6.5" fill="#29303D" />
          <ellipse cx="73" cy={mood === 'think' ? 50 : 53} rx="5" ry="6.5" fill="#29303D" />
          <circle cx="49" cy={mood === 'think' ? 47 : 50} r="1.8" fill="#fff" />
          <circle cx="75" cy={mood === 'think' ? 47 : 50} r="1.8" fill="#fff" />
          {sad && (
            <>
              <path d="M40 44 L 52 47" stroke="#29303D" strokeWidth="3" strokeLinecap="round" />
              <path d="M80 44 L 68 47" stroke="#29303D" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
        </>
      )}
      {/* cheeks */}
      <ellipse cx="38" cy="63" rx="4.5" ry="2.8" fill="#FFB3B3" opacity={sad ? 0.4 : 0.9} />
      <ellipse cx="82" cy="63" rx="4.5" ry="2.8" fill="#FFB3B3" opacity={sad ? 0.4 : 0.9} />
      {/* mouth */}
      {happy ? (
        <path d="M52 60 Q 60 70 68 60 Z" fill="#FF4B4B" stroke="#29303D" strokeWidth="3" strokeLinejoin="round" />
      ) : sad ? (
        <path d="M53 66 Q 60 60 67 66" stroke="#29303D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M54 62 Q 60 67 66 62" stroke="#29303D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      )}
      {sad && <path d="M80 58 q -3 5 0 7 q 3 -2 0 -7z" fill="#84D8FF" />}
      {/* server slots on the belly */}
      <rect x="36" y="80" width="48" height="7" rx="3.5" fill={shade} />
      <rect x="36" y="91" width="48" height="7" rx="3.5" fill={shade} />
      <circle cx="78" cy="83.5" r="2" fill={happy ? '#FFC800' : '#A5ED6E'} />
      <circle cx="78" cy="94.5" r="2" fill="#A5ED6E" />
    </svg>
  )
}

/** Mascot with a speech bubble. */
export function MascotSays({ mood, children, size = 96 }: { mood?: Mood; children: React.ReactNode; size?: number }) {
  return (
    <div className="flex items-end gap-3">
      <Mascot mood={mood} size={size} className="shrink-0" />
      <div className="relative mb-4 rounded-2xl border-2 border-[var(--color-rail)] bg-white px-4 py-3 font-bold text-chalk shadow-[0_3px_0_var(--color-rail)]">
        <span aria-hidden className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-[var(--color-rail)] bg-white" />
        {children}
      </div>
    </div>
  )
}
