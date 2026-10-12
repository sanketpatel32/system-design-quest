// Compact authoring helpers. Ids are assigned by fix-content (t{topic}-a{n}).
// Every question names the `concept` it tests; a card in the same topic (or a prerequisite) must `teach` it.
// In mc() the first answer is the correct one; choices are shuffled later.
export const mc = (concept, prompt, correct, wrong, explanation) => ({
  concept, type: 'multiple_choice', prompt,
  choices: [correct, ...wrong].map((label, i) => ({ id: 'abcdef'[i], label })),
  correctChoiceIds: ['a'], explanation,
})
export const ord = (concept, prompt, steps, explanation) => ({
  concept, type: 'drag_order', prompt,
  items: steps.map((label, i) => ({ id: `s${i + 1}`, label })),
  correctOrder: steps.map((_, i) => `s${i + 1}`), explanation,
})
export const est = (concept, prompt, unit, target, workedAnswer, assumptions = []) => ({
  concept, type: 'estimation', prompt, unit, target, assumptions,
  formula: workedAnswer.split('=')[0].trim(), workedAnswer, explanation: workedAnswer,
})
/** labels: diagram boxes in request order; edges: [from, to] index pairs; hot: index (or indexes) of the bottleneck */
export const spot = (concept, prompt, labels, edges, hot, explanation) => ({
  concept, type: 'spot_bottleneck', prompt,
  diagramNodes: labels.map((label, i) => ({ id: `n${i + 1}`, label, x: 40 + i * 110, y: 40 })),
  diagramEdges: edges.map(([a, b]) => ({ from: `n${a + 1}`, to: `n${b + 1}` })),
  correctNodeIds: [hot].flat().map((i) => `n${i + 1}`), explanation,
})
/**
 * approaches: [[label, description], ...] with the right one first.
 * reasons: [[label, conflict]]: conflict null = valid reason, otherwise the text saying why it does not hold.
 */
export const tr = (concept, prompt, constraints, approaches, reasons, explanation) => {
  const ids = approaches.map((_, i) => `p${i + 1}`)
  const rIds = reasons.map((_, i) => `r${i + 1}`)
  return {
    concept, type: 'tradeoff', prompt, constraints,
    approaches: approaches.map(([label, description], i) => ({ id: ids[i], label, description })),
    correctApproachId: ids[0],
    rationaleOptions: reasons.map(([label], i) => ({ id: rIds[i], label })),
    correctRationaleIds: rIds.filter((_, i) => !reasons[i][1]),
    distractorRationaleIds: rIds.filter((_, i) => reasons[i][1]),
    rationaleConflicts: Object.fromEntries(reasons.flatMap(([, c], i) => (c ? [[rIds[i], c]] : []))),
    explanation,
  }
}
/** Card: [title, body, steps | null, teaches[]] */
export const card = (title, body, teaches, steps = null) => [title, body, steps, teaches]
export const flow = (title, steps, teaches) => [title, null, steps, teaches]
