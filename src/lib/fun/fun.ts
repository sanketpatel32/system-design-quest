import type { Question, Topic } from '../../content/types'

/** Small seeded RNG so a round is stable across re-renders (and testable) */
export function rng(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const words = (s?: string) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0)

/** Reading time for the cards (about 200 words a minute), rounded up, at least 1 */
export function readingMinutes(topic: Pick<Topic, 'cards'>) {
  const w = topic.cards.reduce((n, c) => n + words(c.title) + words(c.body) + words(c.note) + (c.steps ?? []).reduce((a, s) => a + words(s), 0), 0)
  return Math.max(1, Math.ceil(w / 200))
}

/** Longest run of consecutive trues */
export function bestRun(results: boolean[]) {
  let best = 0
  let run = 0
  for (const r of results) {
    run = r ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

const RIGHT = ['Nice one.', 'Spot on.', 'Clean.', 'You’ve got it.', 'Exactly right.', 'Sharp.']
const WRONG = ['Close. Read the why, it sticks better next time.', 'Good miss: now you know the trap.', 'Not quite. This one fools a lot of people.', 'Shake it off, next one.']

/** Byte's one-line reaction after a submit; combo is the run length including this answer */
export function byteReaction(correct: boolean, combo: number, key: string) {
  if (correct && combo >= 5) return `${combo} in a row. You’re on fire.`
  if (correct && combo >= 3) return `${combo} in a row!`
  const pool = correct ? RIGHT : WRONG
  return pool[Math.floor(rng(key)() * pool.length)]!
}

/** Questions in a quick-play round */
export const ROUND_SIZE = 8

export type PlayItem = { topicId: number; topicSlug: string; topicTitle: string; question: Question }

/** A mixed quick-play round: one question per topic, topics spread across the pool, in random order */
export function pickRound(topics: Topic[], count: number, seed: string): PlayItem[] {
  const r = rng(seed)
  const pool = topics.filter((t) => t.kind !== 'boss' && t.questions.length > 0)
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return shuffled.slice(0, count).map((t) => ({
    topicId: t.id,
    topicSlug: t.slug,
    topicTitle: t.title,
    question: t.questions[Math.floor(r() * t.questions.length)]!,
  }))
}

/** Long cards read better as two short paragraphs; split at a sentence break near the middle (text unchanged) */
export function paragraphs(body: string): string[] {
  const words = body.trim().split(/\s+/).length
  if (words < 60) return [body]
  const parts = body.split(/(?<=[.!?])\s+(?=[A-Z])/)
  // Re-join pieces that were split after an abbreviation
  const sentences: string[] = []
  for (const part of parts) {
    const prev = sentences[sentences.length - 1]
    if (prev && /\b(e\.g|i\.e|vs|etc|approx|Dr|Mr|Ms|St|No)\.$/i.test(prev)) sentences[sentences.length - 1] = `${prev} ${part}`
    else sentences.push(part)
  }
  if (sentences.length < 3) return [body]
  let best = 1
  let bestGap = Infinity
  let count = 0
  for (let i = 0; i < sentences.length - 1; i++) {
    count += sentences[i]!.split(/\s+/).length
    const gap = Math.abs(count - words / 2)
    if (gap < bestGap) { bestGap = gap; best = i + 1 }
  }
  return [sentences.slice(0, best).join(' '), sentences.slice(best).join(' ')]
}

