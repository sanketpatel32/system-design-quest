import type { BossContent, Question } from '../../content/types'
import type { UserGraph } from './graph'
import { gradeArchitecture } from './graph'
import { gradeQuestion } from './questions'

export interface BossBreakdown {
  requirements: number
  estimation: number
  api: number
  architecture: number
  deepDive: number
  tradeoffs: number
}

export interface BossGradeResult {
  total: number
  breakdown: BossBreakdown
  feedback: string[]
  passed: boolean
}

export function gradeBossSubmission(
  boss: BossContent,
  stageResults: Record<string, boolean>,
  stageQuestions: Question[],
  graph: UserGraph,
): BossGradeResult {
  const feedback: string[] = []
  const reqQs = stageQuestions.filter((q) => q.tags?.includes('requirements'))
  const estQs = stageQuestions.filter((q) => q.tags?.includes('estimation'))
  const apiQs = stageQuestions.filter((q) => q.tags?.includes('api'))
  const ddQs = stageQuestions.filter((q) => q.tags?.includes('deep_dive'))
  const toQs = stageQuestions.filter((q) => q.tags?.includes('tradeoffs'))

  const ratio = (qs: Question[]) => {
    if (qs.length === 0) return 1
    const ok = qs.filter((q) => stageResults[q.id]).length
    return ok / qs.length
  }

  const requirements = Math.round(ratio(reqQs) * 15)
  const estimation = Math.round(ratio(estQs) * 15)
  const api = Math.round(ratio(apiQs) * 10)
  const arch = gradeArchitecture(graph, boss.rubric, 30)
  const deepDive = Math.round(ratio(ddQs) * 20)
  const tradeoffs = Math.round(ratio(toQs) * 10)

  feedback.push(...arch.feedback)

  const breakdown: BossBreakdown = {
    requirements,
    estimation,
    api,
    architecture: arch.score,
    deepDive,
    tradeoffs,
  }

  const total =
    breakdown.requirements +
    breakdown.estimation +
    breakdown.api +
    breakdown.architecture +
    breakdown.deepDive +
    breakdown.tradeoffs

  return {
    total,
    breakdown,
    feedback,
    passed: total >= 70,
  }
}

export function gradeStageAnswer(q: Question, answer: unknown): boolean {
  return gradeQuestion(q, answer).correct
}
