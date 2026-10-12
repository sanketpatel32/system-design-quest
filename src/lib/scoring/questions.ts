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

type TradeoffLegacy = TradeoffQuestion & {
  rationaleKeywords?: string[]
}

export function gradeTradeoff(
  q: TradeoffQuestion,
  approachId: string,
  selectedRationaleIds: string[],
  legacyRationaleText?: string,
): GradeResult {
  const approachOk = approachId === q.correctApproachId
  const legacy = q as TradeoffLegacy
  let rationaleOk = false
  let hasDistractor = false
  if (q.rationaleOptions?.length && q.correctRationaleIds?.length) {
    const selected = new Set(selectedRationaleIds)
    const required = new Set(q.correctRationaleIds)
    const distractors = new Set(q.distractorRationaleIds ?? [])
    hasDistractor = [...selected].some((id) => distractors.has(id))
    rationaleOk =
      !hasDistractor &&
      [...required].every((id) => selected.has(id)) &&
      selected.size === required.size
  } else if (legacy.rationaleKeywords?.length) {
    const lower = (legacyRationaleText ?? '').toLowerCase()
    const hits = legacy.rationaleKeywords.filter((k) => lower.includes(k.toLowerCase()))
    rationaleOk = hits.length >= Math.min(2, legacy.rationaleKeywords.length)
  }
  const correct = approachOk && rationaleOk
  return {
    correct,
    feedback: correct
      ? 'Approach and structured rationale match the constraints.'
      : hasDistractor
        ? 'One selected reason conflicts with the constraints — review the explanation.'
        : approachOk
          ? 'Pick the rationale options that directly support this approach under the constraints.'
          : 'Choose the approach that best fits the non-functional requirements.',
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
      const a = answer as { approachId?: string; rationaleIds?: string[]; rationale?: string }
      return gradeTradeoff(
        q,
        a.approachId ?? '',
        Array.isArray(a.rationaleIds) ? a.rationaleIds : [],
        typeof a.rationale === 'string' ? a.rationale : undefined,
      )
    }
    default:
      return { correct: false, feedback: 'Unknown question type.' }
  }
}
