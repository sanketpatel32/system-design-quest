import type { RegionMeta } from '../../content/types'

/**
 * Region palette — see DESIGN.md "Colour".
 * bright: fills, path nodes, illustrations (never body text)
 * deep:   text, banners with white text (≥4.5:1 on white)
 * soft:   pastel tint for backgrounds
 */
export const REGION_PALETTE: Record<string, { bright: string; deep: string; soft: string; shadow: string }> = {
  'r1-foundations': { bright: '#FF9600', deep: '#C2410C', soft: '#FFF1DB', shadow: '#9A3412' },
  'r2-networking': { bright: '#1CB0F6', deep: '#12749F', soft: '#DDF4FE', shadow: '#1590C9' },
  'r3-load-balancing': { bright: '#FF4B4B', deep: '#C73636', soft: '#FFE3E3', shadow: '#D63C3C' },
  'r4-caching': { bright: '#2EC4C4', deep: '#1B7A7A', soft: '#DDF6F6', shadow: '#22A0A0' },
  'r5-databases': { bright: '#5B7CFA', deep: '#4A67D6', soft: '#E6ECFF', shadow: '#4560D0' },
  'r6-messaging': { bright: '#E040A0', deep: '#C2378A', soft: '#FCE2F1', shadow: '#B83385' },
  'r7-coordination': { bright: '#9B5DE5', deep: '#8350C7', soft: '#F0E6FC', shadow: '#7D49BD' },
  'r8-microservices': { bright: '#3CB043', deep: '#2A7F30', soft: '#E1F5E2', shadow: '#2E8E34' },
  'r9-security-storage': { bright: '#E0A21B', deep: '#946A12', soft: '#FDF1D4', shadow: '#B5830F' },
  'r10-strategy': { bright: '#FF6FAE', deep: '#B04A78', soft: '#FFE6F1', shadow: '#D9558F' },
  'f1-frontend': { bright: '#1CB0F6', deep: '#0F6D99', soft: '#DDF4FE', shadow: '#1590C9' },
  'f2-backend': { bright: '#58CC02', deep: '#3A7D0A', soft: '#E5F8D4', shadow: '#46A302' },
  'f3-networking': { bright: '#9B5DE5', deep: '#7A45BF', soft: '#F0E6FC', shadow: '#7D49BD' },
  'f4-databases': { bright: '#5B7CFA', deep: '#4560D0', soft: '#E6ECFF', shadow: '#4560D0' },
  'boss-arena': { bright: '#FFC800', deep: '#8A5A00', soft: '#FFF6CC', shadow: '#E0A800' },
}

const FALLBACK = REGION_PALETTE['r1-foundations']!

export function regionPalette(regionId: string) {
  return REGION_PALETTE[regionId] ?? FALLBACK
}

/** Accessible accent for text and borders in a region (kept name for existing callers). */
export function transitLineColor(regionId: RegionMeta['id']): string {
  return regionPalette(regionId).deep
}
