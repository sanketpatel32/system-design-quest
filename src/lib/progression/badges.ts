export const BADGE_IDS = {
  FIRST_STEPS: 'first_steps',
  CACHE_MASTER: 'cache_master',
  SHARD_LORD: 'shard_lord',
  BOSS_BREAKER: 'boss_breaker',
  CONSISTENCY_CHAMPION: 'consistency_champion',
  INTERVIEW_READY: 'interview_ready',
  SEVEN_DAY_STREAK: 'seven_day_streak',
} as const

export type BadgeId = (typeof BADGE_IDS)[keyof typeof BADGE_IDS]

const R4_TOPIC_IDS = [15, 16, 17, 18, 19, 20]
const CONSISTENCY_TOPIC_IDS = [27, 28, 29, 32, 33, 34]

export function badgesAfterTopicClear(
  topicId: number,
  completedIds: Set<number>,
  existing: string[],
): string[] {
  const earned = new Set(existing)
  if (!earned.has(BADGE_IDS.FIRST_STEPS)) {
    earned.add(BADGE_IDS.FIRST_STEPS)
  }
  if (R4_TOPIC_IDS.every((id) => completedIds.has(id))) {
    earned.add(BADGE_IDS.CACHE_MASTER)
  }
  if (completedIds.has(30) && completedIds.has(31)) {
    earned.add(BADGE_IDS.SHARD_LORD)
  }
  if (topicId >= 75 && topicId <= 114 && !earned.has(BADGE_IDS.BOSS_BREAKER)) {
    earned.add(BADGE_IDS.BOSS_BREAKER)
  }
  if (CONSISTENCY_TOPIC_IDS.every((id) => completedIds.has(id))) {
    earned.add(BADGE_IDS.CONSISTENCY_CHAMPION)
  }
  return [...earned]
}

export function badgeAfterMock(existing: string[]): string[] {
  const earned = new Set(existing)
  earned.add(BADGE_IDS.INTERVIEW_READY)
  return [...earned]
}

export function badgeAfterStreak(history: string[]): string[] {
  const earned: string[] = []
  if (history.length >= 7) {
    earned.push(BADGE_IDS.SEVEN_DAY_STREAK)
  }
  return earned
}

export const BADGE_LABELS: Record<BadgeId, string> = {
  first_steps: 'First Steps',
  cache_master: 'Cache Master',
  shard_lord: 'Shard Lord',
  boss_breaker: 'Boss Breaker',
  consistency_champion: 'Consistency Champion',
  interview_ready: 'Interview Ready',
  seven_day_streak: 'Seven-Day Streak',
}
