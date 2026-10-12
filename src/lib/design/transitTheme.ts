import type { RegionMeta } from '../../content/types'

/** Metro line colours — see DESIGN.md */
const LINE: Record<string, string> = {
  'r1-foundations': '#F2B33D',
  'r2-networking': '#38C6E8',
  'r3-load-balancing': '#F2643D',
  'r4-caching': '#9FE3F5',
  'r5-databases': '#5C8DF2',
  'r6-messaging': '#E85DA8',
  'r7-coordination': '#B9A6F7',
  'r8-microservices': '#6FD38B',
  'r9-security-storage': '#D9A55B',
  'r10-strategy': '#F27FA0',
  'boss-arena': '#FF5A4E',
}

export function transitLineColor(regionId: RegionMeta['id']): string {
  return LINE[regionId] ?? '#F2B33D'
}
