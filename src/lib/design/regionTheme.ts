import type { RegionMeta } from '../../content/types'

export type RegionGlyphId =
  | 'launch'
  | 'network'
  | 'traffic'
  | 'frost'
  | 'citadel'
  | 'rail'
  | 'peak'
  | 'port'
  | 'vault'
  | 'colosseum'
  | 'summit'

export interface RegionTheme {
  id: RegionMeta['id']
  label: string
  /** Single accent — no purple/indigo */
  accent: string
  accentMuted: string
  mapX: number
  mapY: number
  glyph: RegionGlyphId
}

export const regionThemes: RegionTheme[] = [
  { id: 'r1-foundations', label: 'Launchpad', accent: '#2dd4bf', accentMuted: '#115e59', mapX: 108, mapY: 498, glyph: 'launch' },
  { id: 'r2-networking', label: 'Neon Network City', accent: '#38bdf8', accentMuted: '#0c4a6e', mapX: 248, mapY: 418, glyph: 'network' },
  { id: 'r3-load-balancing', label: 'Traffic District', accent: '#fbbf24', accentMuted: '#78350f', mapX: 388, mapY: 478, glyph: 'traffic' },
  { id: 'r4-caching', label: 'Frost Caverns', accent: '#7dd3fc', accentMuted: '#164e63', mapX: 328, mapY: 298, glyph: 'frost' },
  { id: 'r5-databases', label: 'Data Citadel', accent: '#34d399', accentMuted: '#064e3b', mapX: 488, mapY: 278, glyph: 'citadel' },
  { id: 'r6-messaging', label: 'Queue Railways', accent: '#fb923c', accentMuted: '#7c2d12', mapX: 628, mapY: 338, glyph: 'rail' },
  { id: 'r7-coordination', label: 'Consensus Peaks', accent: '#f472b6', accentMuted: '#831843', mapX: 748, mapY: 408, glyph: 'peak' },
  { id: 'r8-microservices', label: 'Operations Spaceport', accent: '#94a3b8', accentMuted: '#334155', mapX: 848, mapY: 278, glyph: 'port' },
  { id: 'r9-security-storage', label: 'Vault & Archive', accent: '#eab308', accentMuted: '#713f12', mapX: 708, mapY: 148, glyph: 'vault' },
  { id: 'boss-arena', label: 'Architecture Colosseum', accent: '#ef4444', accentMuted: '#7f1d1d', mapX: 488, mapY: 72, glyph: 'colosseum' },
  { id: 'r10-strategy', label: 'Interview Summit', accent: '#a3e635', accentMuted: '#365314', mapX: 888, mapY: 508, glyph: 'summit' },
]

export const regionPathOrder = regionThemes.map((r) => r.id)

export function themeForRegion(id: RegionMeta['id']): RegionTheme {
  const found = regionThemes.find((r) => r.id === id)
  if (found) return found
  return regionThemes[0]!
}
