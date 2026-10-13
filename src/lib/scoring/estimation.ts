export function normalizeEstimationInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  if (n < 0) return null
  return n
}

export const DEFAULT_ESTIMATION_TOLERANCE = 0.5

export function gradeEstimation(answer: number, target: number, tolerance = DEFAULT_ESTIMATION_TOLERANCE): boolean {
  if (target <= 0) return false
  if (!Number.isFinite(answer) || answer < 0) return false
  const ratio = Math.abs(answer - target) / target
  // small epsilon so an exact answer is never rejected by floating-point noise
  return ratio <= tolerance + 1e-9
}

export function describeTolerance(tolerance = DEFAULT_ESTIMATION_TOLERANCE): string {
  if (tolerance === 0) return 'Exactly right'
  return `Within ${Math.round(tolerance * 100)}%`
}
