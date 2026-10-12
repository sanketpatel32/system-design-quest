import { regionPalette } from '../../lib/design/transitTheme'

/**
 * One cheerful illustration per region (original SVG, 160×110). Drawn to sit on the region's deep banner colour:
 * white and pastel shapes, the region's bright colour for accents, a little gold for sparkle. See DESIGN.md.
 */
export function RegionArt({ regionId, width = 160, className = '' }: { regionId: string; width?: number; className?: string }) {
  const p = regionPalette(regionId)
  const B = p.bright
  const S = p.soft
  const W = '#FFFFFF'
  const G = '#FFC800'
  const D = '#29303D'
  const scenes: Record<string, React.ReactNode> = {
    'r1-foundations': (
      <>
        <ellipse cx="45" cy="92" rx="26" ry="10" fill={S} opacity="0.5" />
        <ellipse cx="118" cy="95" rx="30" ry="9" fill={S} opacity="0.5" />
        <path d="M80 8c14 10 18 32 12 56H68c-6-24-2-46 12-56z" fill={W} />
        <circle cx="80" cy="34" r="8" fill={B} stroke={S} strokeWidth="3" />
        <path d="M68 52 56 68h13zM92 52l12 16H91z" fill={B} />
        <path d="M70 64h20l-3 6H73z" fill={S} />
        <path d="M74 72q6 22 6 22t6-22z" fill={G} />
        <path d="M77 72q3 12 3 12t3-12z" fill={W} />
        <rect x="40" y="96" width="80" height="6" rx="3" fill={S} />
        <circle cx="28" cy="20" r="3" fill={G} />
        <circle cx="134" cy="30" r="2.5" fill={W} />
        <circle cx="122" cy="14" r="2" fill={G} />
      </>
    ),
    'r2-networking': (
      <>
        <rect x="18" y="50" width="28" height="52" rx="6" fill={S} />
        <rect x="50" y="28" width="32" height="74" rx="6" fill={W} />
        <rect x="86" y="44" width="26" height="58" rx="6" fill={S} />
        <rect x="116" y="60" width="28" height="42" rx="6" fill={W} />
        <path d="M66 28V12" stroke={W} strokeWidth="4" strokeLinecap="round" />
        <circle cx="66" cy="10" r="4" fill={G} />
        <path d="M54 8q12-10 24 0M48 2q18-14 36 0" stroke={G} strokeWidth="3" fill="none" strokeLinecap="round" />
        {[40, 54, 68, 82].map((y) => (
          <g key={y}>
            <rect x="57" y={y} width="7" height="7" rx="2" fill={B} />
            <rect x="68" y={y} width="7" height="7" rx="2" fill={y === 54 ? G : B} />
          </g>
        ))}
        <rect x="25" y="60" width="6" height="6" rx="2" fill={B} />
        <rect x="34" y="72" width="6" height="6" rx="2" fill={G} />
        <rect x="93" y="54" width="6" height="6" rx="2" fill={B} />
        <rect x="123" y="70" width="6" height="6" rx="2" fill={B} />
        <rect x="10" y="100" width="140" height="5" rx="2.5" fill={W} opacity="0.6" />
      </>
    ),
    'r3-load-balancing': (
      <>
        <path d="M10 104 60 64h40l50 40z" fill={S} opacity="0.55" />
        <path d="M80 70v34" stroke={W} strokeWidth="4" strokeDasharray="7 6" />
        <rect x="64" y="8" width="32" height="70" rx="12" fill={D} />
        <circle cx="80" cy="25" r="9" fill={B} />
        <circle cx="80" cy="44" r="9" fill={G} />
        <circle cx="80" cy="63" r="9" fill="#58CC02" />
        <circle cx="77" cy="22" r="2.5" fill={W} opacity="0.7" />
        <path d="M30 40h18M30 52h12M112 40h18M118 52h12" stroke={W} strokeWidth="4" strokeLinecap="round" />
        <path d="M44 34l8 6-8 6M116 34l-8 6 8 6" stroke={W} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    'r4-caching': (
      <>
        <path d="M6 104c8-40 30-70 74-70s66 30 74 70z" fill={S} opacity="0.5" />
        <path d="M30 104c6-28 24-48 50-48s44 20 50 48z" fill={W} opacity="0.9" />
        <path d="M60 56l4 14 4-14M86 56l3 10 3-10M100 62l2 8 2-8" fill={S} />
        <g transform="translate(80 30)">
          <path d="M0-22V22M-19-11l38 22M19-11l-38 22" stroke={W} strokeWidth="5" strokeLinecap="round" />
          <circle r="6" fill={B} stroke={W} strokeWidth="3" />
        </g>
        <path d="M40 88l6-12 6 12zM104 90l5-10 5 10z" fill={B} />
        <circle cx="26" cy="22" r="3" fill={W} />
        <circle cx="134" cy="16" r="3" fill={W} />
        <circle cx="140" cy="40" r="2" fill={G} />
      </>
    ),
    'r5-databases': (
      <>
        <rect x="16" y="102" width="128" height="5" rx="2.5" fill={W} opacity="0.6" />
        <path d="M42 102V40h76v62z" fill={W} />
        <path d="M42 40V30h10v6h10v-6h10v6h16v-6h10v6h10v-6h10v10z" fill={W} />
        <path d="M70 102V80a10 10 0 0 1 20 0v22z" fill={B} />
        <g>
          <ellipse cx="28" cy="58" rx="14" ry="5" fill={S} />
          <path d="M14 58v34c0 3 6 5 14 5s14-2 14-5V58" fill={S} />
          <ellipse cx="28" cy="58" rx="14" ry="5" fill={W} />
          <path d="M14 70c0 3 6 5 14 5s14-2 14-5M14 82c0 3 6 5 14 5s14-2 14-5" stroke={B} strokeWidth="2.5" fill="none" />
        </g>
        <g>
          <ellipse cx="132" cy="58" rx="14" ry="5" fill={S} />
          <path d="M118 58v34c0 3 6 5 14 5s14-2 14-5V58" fill={S} />
          <ellipse cx="132" cy="58" rx="14" ry="5" fill={W} />
          <path d="M118 70c0 3 6 5 14 5s14-2 14-5M118 82c0 3 6 5 14 5s14-2 14-5" stroke={B} strokeWidth="2.5" fill="none" />
        </g>
        <path d="M80 30V8l14 5-14 5" fill={G} stroke={G} strokeWidth="2" strokeLinejoin="round" />
        <rect x="54" y="50" width="10" height="12" rx="5" fill={B} />
        <rect x="96" y="50" width="10" height="12" rx="5" fill={B} />
      </>
    ),
    'r6-messaging': (
      <>
        <path d="M6 98h148" stroke={W} strokeWidth="4" strokeLinecap="round" />
        <path d="M12 104h4M32 104h4M52 104h4M72 104h4M92 104h4M112 104h4M132 104h4" stroke={W} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        <rect x="16" y="56" width="42" height="34" rx="9" fill={W} />
        <rect x="24" y="64" width="11" height="11" rx="3" fill={B} />
        <rect x="39" y="64" width="11" height="11" rx="3" fill={B} />
        <rect x="62" y="56" width="38" height="34" rx="9" fill={S} />
        <rect x="70" y="64" width="22" height="11" rx="3" fill={B} />
        <rect x="104" y="40" width="46" height="50" rx="12" fill={W} />
        <rect x="112" y="48" width="18" height="16" rx="4" fill={S} />
        <rect x="136" y="28" width="9" height="14" rx="3" fill={D} />
        <circle cx="140" cy="20" r="6" fill={W} opacity="0.8" />
        <circle cx="128" cy="10" r="4" fill={W} opacity="0.6" />
        {[30, 46, 74, 90, 116, 138].map((x) => (
          <circle key={x} cx={x} cy="92" r="6" fill={D} stroke={W} strokeWidth="2.5" />
        ))}
        <circle cx="146" cy="80" r="4" fill={G} />
      </>
    ),
    'r7-coordination': (
      <>
        <path d="M0 104 40 44l30 40 18-22 42 42z" fill={W} />
        <path d="M40 44l-12 18 8-2 4 6 5-8 7 4z" fill={S} />
        <path d="M88 62l-8 10 6-1 3 4 3-4 5 2z" fill={S} />
        <path d="M100 104l30-58 30 58z" fill={S} />
        <path d="M130 46l-8 15 6-2 3 4 4-4 4 2z" fill={W} />
        <path d="M40 44V14" stroke={D} strokeWidth="3" />
        <path d="M40 14l18 6-18 7z" fill={G} />
        <circle cx="122" cy="20" r="10" fill={G} />
        <circle cx="16" cy="28" r="3" fill={W} />
      </>
    ),
    'r8-microservices': (
      <>
        <circle cx="122" cy="34" r="22" fill={S} />
        <path d="M98 40c14-6 34-8 48-6" stroke={W} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="114" cy="26" r="4" fill={B} opacity="0.6" />
        <path d="M24 104l16-34h16l16 34z" fill={W} />
        <path d="M18 64c20 12 50 10 64-14" fill={W} />
        <path d="M18 64c20 12 50 10 64-14z" fill={S} transform="translate(2 3)" opacity="0.6" />
        <path d="M50 58l18-22" stroke={D} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="68" cy="36" r="5" fill={G} />
        <path d="M76 26q8 2 10 10M80 18q14 4 16 18" stroke={G} strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="16" cy="20" r="2.5" fill={W} />
        <circle cx="66" cy="10" r="2" fill={W} />
        <circle cx="150" cy="80" r="2.5" fill={W} />
      </>
    ),
    'r9-security-storage': (
      <>
        <rect x="30" y="14" width="100" height="86" rx="16" fill={W} />
        <rect x="40" y="24" width="80" height="66" rx="10" fill={S} />
        <circle cx="80" cy="57" r="22" fill={W} stroke={B} strokeWidth="5" />
        <path d="M80 41v32M64 57h32M69 46l22 22M91 46 69 68" stroke={B} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="80" cy="57" r="6" fill={D} />
        <rect x="40" y="100" width="12" height="6" rx="3" fill={W} />
        <rect x="108" y="100" width="12" height="6" rx="3" fill={W} />
        <ellipse cx="146" cy="96" rx="9" ry="4" fill={G} />
        <ellipse cx="146" cy="90" rx="9" ry="4" fill={G} stroke="#E0A800" strokeWidth="1.5" />
        <ellipse cx="18" cy="94" rx="8" ry="3.5" fill={G} stroke="#E0A800" strokeWidth="1.5" />
      </>
    ),
    'r10-strategy': (
      <>
        <path d="M0 106 52 40l24 30 18-20 66 56z" fill={W} />
        <path d="M52 40 40 56l8-2 4 5 6-7 7 3z" fill={S} />
        <rect x="64" y="64" width="34" height="14" rx="4" fill={G} />
        <path d="M70 64c0-14 6-22 11-22s11 8 11 22z" fill={G} />
        <path d="M70 48h-6c0 8 4 10 8 10M92 48h6c0 8-4 10-8 10" stroke={G} strokeWidth="3" fill="none" />
        <path d="M76 50l5-4v12" stroke="#8A5A00" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="30" cy="22" r="3" fill={G} />
        <circle cx="120" cy="18" r="4" fill={W} />
        <circle cx="136" cy="36" r="2.5" fill={G} />
        <path d="M118 30l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z" fill={W} />
      </>
    ),
    'boss-arena': (
      <>
        <path d="M14 104V44c20-14 112-14 132 0v60z" fill={W} />
        <path d="M14 66h132M14 44h132" stroke={S} strokeWidth="5" />
        {[24, 48, 72, 96, 120].map((x) => (
          <path key={x} d={`M${x} 104v-20a8 8 0 0 1 16 0v20z`} fill={B} />
        ))}
        {[28, 50, 72, 94, 116].map((x) => (
          <path key={x} d={`M${x} 64v-8a6 6 0 0 1 12 0v8z`} fill={S} />
        ))}
        <path d="M80 30V6l16 6-16 6" fill="#FF4B4B" />
        <path d="M80 6v26" stroke={D} strokeWidth="3" />
      </>
    ),
  }
  return (
    <svg width={width} height={(width * 110) / 160} viewBox="0 0 160 110" aria-hidden className={className} data-art={regionId}>
      {scenes[regionId] ?? scenes['r1-foundations']}
    </svg>
  )
}
