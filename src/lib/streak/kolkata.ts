const TZ = 'Asia/Kolkata'

export function kolkataDayKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970'
  const m = parts.find((p) => p.type === 'month')?.value ?? '01'
  const d = parts.find((p) => p.type === 'day')?.value ?? '01'
  return `${y}-${m}-${d}`
}

export function recordStreakActivity(
  history: string[],
  _lastActiveDay: string | null,
  now = new Date(),
): { history: string[]; lastActiveDay: string } {
  const day = kolkataDayKey(now)
  const set = new Set(history)
  set.add(day)
  const sorted = [...set].sort()
  return { history: sorted, lastActiveDay: day }
}

export function currentStreakCount(history: string[], now = new Date()): number {
  if (history.length === 0) return 0
  const days = new Set(history)
  let count = 0
  let cursor = kolkataDayKey(now)
  while (days.has(cursor)) {
    count += 1
    cursor = shiftDay(cursor, -1)
  }
  return count
}

function shiftDay(dayKey: string, delta: number): string {
  const parts = dayKey.split('-').map(Number)
  const y = parts[0] ?? 1970
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + delta)
  return dt.toISOString().slice(0, 10)
}
