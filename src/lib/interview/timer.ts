export const INTERVIEW_STAGE_MINUTES = [5, 5, 5, 10, 15, 5] as const
export const TOTAL_INTERVIEW_MINUTES = INTERVIEW_STAGE_MINUTES.reduce((a, b) => a + b, 0)

export function stageDeadlineMs(_startedAt: number, stageIndex: number, stageStartedAt: number): number {
  const minutes = INTERVIEW_STAGE_MINUTES[stageIndex] ?? INTERVIEW_STAGE_MINUTES[0]
  const stageMs = minutes * 60 * 1000
  return stageStartedAt + stageMs
}

export function overallDeadlineMs(startedAt: number): number {
  return startedAt + TOTAL_INTERVIEW_MINUTES * 60 * 1000
}

export function remainingMs(deadline: number, now = Date.now()): number {
  return Math.max(0, deadline - now)
}

export function shouldAdvanceStage(stageStartedAt: number, stageIndex: number, now = Date.now()): boolean {
  return now >= stageDeadlineMs(0, stageIndex, stageStartedAt)
}
