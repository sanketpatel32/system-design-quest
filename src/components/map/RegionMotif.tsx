/** Hand-drawn line glyph per region: one landmark each, stroked in the region's line colour (see DESIGN.md "Region motifs"). */
const PATHS: Record<string, string> = {
  // Launchpad: rocket on a gantry
  'r1-foundations': 'M12 3c3 3 3.5 7 2.5 11h-5C8.5 10 9 6 12 3zM9.5 14 7 17h3M14.5 14 17 17h-3M10 17v2h4v-2M4 21h16M5 21V9',
  // Neon Network City: skyline with an antenna
  'r2-networking': 'M3 21V12h4v9M7 21V7h5v14M12 21v-9h4v9M16 21V9h5v12M9.5 7V3M2 21h20',
  // Traffic Control District: signal head
  'r3-load-balancing': 'M9 3h6v14H9zM12 17v4M8 21h8M12 6.5v.01M12 10v.01M12 13.5v.01',
  // Frost Cache Caverns: ice crystal
  'r4-caching': 'M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5',
  // Data Citadel: keep with battlements
  'r5-databases': 'M4 21V9h3V6h2v3h2V6h2v3h2V6h2v3h3v12M10 21v-5a2 2 0 0 1 4 0v5M2 21h20',
  // Queue Railways: locomotive with carriages
  'r6-messaging': 'M2 17h20M4 17V9h7v8M11 12h4v5M16 12h5v5M6 9V6h3v3M6 20a1.5 1.5 0 1 0 0-.01M18 20a1.5 1.5 0 1 0 0-.01',
  // Consensus Peaks: three summits
  'r7-coordination': 'M2 20 8 9l4 6 3-4 7 9zM6.5 12 8 9l1.5 3',
  // Operations Spaceport: dish and mast
  'r8-microservices': 'M5 13a7 7 0 0 0 9.9-9.9zM10 8l4-4M9 15l-2 6h8l-2-6M17 3a4 4 0 0 1 4 4',
  // Vault & Archive: round vault door
  'r9-security-storage': 'M3 4h18v16H3zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 10v4M10 12h4M6 20v1M18 20v1',
  // Interview Summit: flag on a peak
  'r10-strategy': 'M3 21 11 8l8 13zM11 8V2l5 2-5 2',
  'f1-frontend': 'M3 5h18v14H3zM3 9h18M6 7h.01M9 7h.01M8 13l-2 2 2 2M16 13l2 2-2 2',
  'f2-backend': 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01M12 10v4',
  'f3-networking': 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4M5 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4M19 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4M12 7v5M12 12l-6 5M12 12l6 5',
  'f5-os': 'M4 5h16v11H4zM8 20h8M12 16v4M7 9h4M7 12h7',
  'f6-security': 'M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3zM9 12l2 2 4-4',
  'f7-cloud': 'M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z',
  'f4-databases': 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  // Architecture Colosseum: tiered arches
  'boss-arena': 'M2 21h20M3 21V9h18v12M3 13h18M6 21v-3a1.5 1.5 0 0 1 3 0v3M10.5 21v-3a1.5 1.5 0 0 1 3 0v3M15 21v-3a1.5 1.5 0 0 1 3 0v3M6 13v-2M10 13v-2M14 13v-2M18 13v-2',
}

export function RegionMotif({ regionId, color, size = 20, x, y }: { regionId: string; color: string; size?: number; x?: number; y?: number }) {
  const d = PATHS[regionId]
  if (!d) return null
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false" data-motif={regionId} className="shrink-0">
      <path d={d} />
    </svg>
  )
}
