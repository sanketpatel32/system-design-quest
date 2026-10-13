import type { Page } from '@playwright/test'

type Q = { id: string; type: string; correctChoiceIds?: string[]; correctNodeIds?: string[]; correctOrder?: string[]; target?: number; correctApproachId?: string; correctRationaleIds?: string[] }

export function correctAnswer(q: Q): unknown {
  if (q.type === 'multiple_choice') return q.correctChoiceIds
  if (q.type === 'spot_bottleneck') return q.correctNodeIds
  if (q.type === 'drag_order') return q.correctOrder
  if (q.type === 'estimation') return String(q.target)
  return { approachId: q.correctApproachId, rationaleIds: q.correctRationaleIds }
}

/** Seed local progress. `answeredTopic1` pre-answers every topic-1 question correctly. */
export async function seed(page: Page, opts: { answeredTopic1?: boolean; extra?: Record<string, unknown> } = {}) {
  await page.goto('/s/system-design')
  await page.evaluate(
    async ({ answeredTopic1, extra, correctSrc }) => {
      const correct = new Function(`return (${correctSrc})`)() as (q: unknown) => unknown
      const topics = (await (await fetch('/src/content/generated/topics.json')).json()) as { id: number; questions: { id: string }[] }[]
      const quizAttempts: Record<string, unknown> = {}
      if (answeredTopic1) {
        const t = topics.find((x) => x.id === 1)!
        const answers: Record<string, unknown> = {}
        const results: Record<string, boolean> = {}
        for (const q of t.questions) {
          answers[q.id] = correct(q)
          results[q.id] = true
        }
        quizAttempts['topic-1'] = { hearts: 3, answers, results, completed: false }
      }
      localStorage.setItem(
        'sdq-progress-v3',
        JSON.stringify({
          version: 3, xp: 0, badges: [], unlockedTopicIds: [1], topicProgress: {},
          bossProgress: { completed: false, bestScore: 0, firstClearXpAwarded: false, drafts: {}, submissions: {} },
          streak: { lastActiveDay: null, history: [] }, srs: [], interviews: [],
          preferences: { soundEnabled: false, reducedMotion: true, hasGestureForSound: false },
          quizAttempts, ...extra,
        }),
      )
    },
    { answeredTopic1: Boolean(opts.answeredTopic1), extra: opts.extra ?? {}, correctSrc: correctAnswer.toString() },
  )
  await page.reload()
}
