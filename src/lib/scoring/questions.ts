import type {
  DragOrderQuestion,
  EstimationQuestion,
  MultipleChoiceQuestion,
  Question,
  SpotBottleneckQuestion,
  TradeoffQuestion,
} from '../../content/types'
import { gradeEstimation, normalizeEstimationInput } from './estimation'

export interface GradeResult {
  correct: boolean
  feedback: string
}

export function gradeMultipleChoice(
  q: MultipleChoiceQuestion,
  selected: string[],
): GradeResult {
  const set = new Set(selected)
  const required = new Set(q.correctChoiceIds)
  const alt = new Set(q.alternativeChoiceIds ?? [])
  let correct =
    set.size === required.size && [...required].every((id) => set.has(id))
  if (!correct && alt.size > 0) {
    correct = [...alt].every((id) => set.has(id)) && set.size === alt.size
  }
  return {
    correct,
    feedback: correct
      ? 'Correct — that matches how senior engineers frame this in interviews.'
      : 'Not quite — revisit the trade-off in the explanation, then try the review deck.',
  }
}

export function gradeSpotBottleneck(
  q: SpotBottleneckQuestion,
  selectedNodeIds: string[],
): GradeResult {
  const correct =
    selectedNodeIds.length === q.correctNodeIds.length &&
    q.correctNodeIds.every((id) => selectedNodeIds.includes(id))
  return {
    correct,
    feedback: correct
      ? 'Right node — that is where latency or saturation shows up first.'
      : 'That component is not the primary bottleneck for this flow.',
  }
}

export function gradeDragOrder(q: DragOrderQuestion, order: string[]): GradeResult {
  const correct =
    order.length === q.correctOrder.length &&
    order.every((id, i) => id === q.correctOrder[i])
  return {
    correct,
    feedback: correct
      ? 'Order matches the real request path.'
      : 'One or more steps are out of order for this scenario.',
  }
}

export function gradeEstimationQuestion(
  q: EstimationQuestion,
  raw: string,
): GradeResult {
  const n = normalizeEstimationInput(raw)
  if (n === null) {
    return {
      correct: false,
      feedback: 'Enter a positive number with appropriate units in mind.',
    }
  }
  const correct = gradeEstimation(n, q.target)
  return {
    correct,
    feedback: correct
      ? `Within 50% of the target (${q.target} ${q.unit}) — solid back-of-envelope.`
      : `Off target. Assumptions: ${q.assumptions.join('; ')}`,
  }
}

export function gradeTradeoff(
  q: TradeoffQuestion,
  approachId: string,
  rationale: string,
): GradeResult {
  const approachOk = approachId === q.correctApproachId
  const lower = rationale.toLowerCase()
  const keywordHits = q.rationaleKeywords.filter((k) => lower.includes(k.toLowerCase()))
  const rationaleOk = keywordHits.length >= Math.min(2, q.rationaleKeywords.length)
  const correct = approachOk && rationaleOk
  return {
    correct,
    feedback: correct
      ? 'Strong trade-off call with constraints addressed.'
      : approachOk
        ? 'Approach fits, but tie your rationale to latency, consistency, or cost constraints.'
        : 'Pick the approach that best matches the stated constraints.',
  }
}

export function gradeQuestion(
  q: Question,
  answer: unknown,
): GradeResult {
  switch (q.type) {
    case 'multiple_choice':
      return gradeMultipleChoice(q, Array.isArray(answer) ? (answer as string[]) : [])
    case 'spot_bottleneck':
      return gradeSpotBottleneck(q, Array.isArray(answer) ? (answer as string[]) : [])
    case 'drag_order':
      return gradeDragOrder(q, Array.isArray(answer) ? (answer as string[]) : [])
    case 'estimation':
      return gradeEstimationQuestion(q, typeof answer === 'string' ? answer : '')
    case 'tradeoff': {
      const a = answer as { approachId?: string; rationale?: string }
      return gradeTradeoff(q, a.approachId ?? '', a.rationale ?? '')
    }
    default:
      return { correct: false, feedback: 'Unknown question type.' }
  }
}
