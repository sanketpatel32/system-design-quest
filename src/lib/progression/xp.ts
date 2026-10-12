export const XP_TOPIC_FIRST_CLEAR = 100
export const XP_BOSS_FIRST_CLEAR = 300

export function awardTopicClearXp(alreadyAwarded: boolean): { xp: number; awarded: boolean } {
  if (alreadyAwarded) return { xp: 0, awarded: false }
  return { xp: XP_TOPIC_FIRST_CLEAR, awarded: true }
}

export function awardBossClearXp(alreadyAwarded: boolean): { xp: number; awarded: boolean } {
  if (alreadyAwarded) return { xp: 0, awarded: false }
  return { xp: XP_BOSS_FIRST_CLEAR, awarded: true }
}
