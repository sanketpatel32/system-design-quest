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
      ? 'Correct.'
      : `Not quite. The answer is “${q.choices.filter((c) => q.correctChoiceIds.includes(c.id)).map((c) => c.label).join('” and “')}”.`,
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
      : `That one scales more easily. The first to saturate is “${q.diagramNodes.filter((n) => q.correctNodeIds.includes(n.id)).map((n) => n.label).join(', ')}”.`,
  }
}

export function gradeDragOrder(q: DragOrderQuestion, order: string[]): GradeResult {
  const correct =
    order.length === q.correctOrder.length &&
    order.every((id, i) => id === q.correctOrder[i])
  return {
    correct,
    feedback: correct
      ? 'Right order.'
      : `${order.filter((id, i) => id !== q.correctOrder[i]).length} of ${q.correctOrder.length} steps are out of place. The correct sequence is shown below.`,
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
  const label = (id: string) => q.rationaleOptions?.find((o) => o.id === id)?.label ?? id
  const conflicts = selectedRationaleIds.filter((id) => (q.distractorRationaleIds ?? []).includes(id))
  const missing = (q.correctRationaleIds ?? []).filter((id) => !selectedRationaleIds.includes(id))
  const approachName = q.approaches.find((a) => a.id === q.correctApproachId)?.label ?? ''
  const parts: string[] = []
  if (!approachOk) parts.push(`The approach that fits these constraints is “${approachName}”.`)
  for (const id of conflicts) {
    parts.push(`“${label(id)}” does not hold: ${q.rationaleConflicts?.[id] ?? 'it contradicts the stated constraints.'}`)
  }
  if (missing.length && q.rationaleOptions?.length) parts.push(`Also true: ${missing.map((id) => `“${label(id)}”`).join(', ')}.`)
  return {
    correct,
    feedback: correct
      ? 'Approach and reasons both fit the constraints.'
      : parts.join(' ') || 'Choose the approach that best fits the non-functional requirements.',
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

/**
 * Whether an answer is complete enough to grade. Incomplete answers are never graded,
 * so they can never cost a heart; the UI asks the learner to finish instead.
 */
export function incompleteReason(q: Question, answer: unknown): string | null {
  switch (q.type) {
    case 'multiple_choice':
      return Array.isArray(answer) && answer.length > 0 ? null : 'Pick an option first.'
    case 'spot_bottleneck':
      return Array.isArray(answer) && answer.length > 0 ? null : 'Select a component in the diagram first.'
    case 'drag_order': {
      const arr = Array.isArray(answer) ? (answer as string[]) : []
      const complete = arr.length === q.items.length && new Set(arr).size === q.items.length && arr.every(Boolean)
      return complete ? null : 'Complete all positions first.'
    }
    case 'estimation':
      return normalizeEstimationInput(typeof answer === 'string' ? answer : '') === null ? 'Enter a positive number first.' : null
    case 'tradeoff': {
      const a = (answer ?? {}) as { approachId?: string; rationaleIds?: string[] }
      if (!a.approachId) return 'Choose an approach first.'
      if (q.rationaleOptions?.length && !(a.rationaleIds?.length)) return 'Pick at least one reason first.'
      return null
    }
    default:
      return null
  }
}
