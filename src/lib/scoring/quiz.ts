import type { Question } from '../../content/types'
import { gradeQuestion } from './questions'

export const INITIAL_HEARTS = 3
export const PASS_PERCENT = 70

export interface QuizSummary {
  total: number
  correct: number
  percent: number
  passed: boolean
  heartsRemaining: number
}

export function computeQuizSummary(
  questions: Question[],
  results: Record<string, boolean>,
  hearts: number,
): QuizSummary {
  const total = questions.length
  const correct = questions.filter((q) => results[q.id]).length
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)
  const allAnswered = questions.every((q) => q.id in results)
  // Hearts count mistakes; they never block a pass. Running out is a nudge, not a game over.
  const passedFinal = allAnswered && percent >= PASS_PERCENT
  return {
    total,
    correct,
    percent,
    passed: passedFinal,
    heartsRemaining: hearts,
  }
}

export function applyAnswer(
  q: Question,
  answer: unknown,
  hearts: number,
): { result: ReturnType<typeof gradeQuestion>; hearts: number } {
  const result = gradeQuestion(q, answer)
  const nextHearts = result.correct ? hearts : Math.max(0, hearts - 1)
  return { result, hearts: nextHearts }
}
