export function normalizeEstimationInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  if (n < 0) return null
  return n
}

export function gradeEstimation(answer: number, target: number): boolean {
  if (target <= 0) return false
  if (!Number.isFinite(answer) || answer < 0) return false
  const ratio = Math.abs(answer - target) / target
  return ratio <= 0.5
}
