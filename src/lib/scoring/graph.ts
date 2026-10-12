import type { ArchitectureRubric, CanvasComponentType } from '../../content/types'

export interface UserGraph {
  nodes: { id: string; type: CanvasComponentType; label: string }[]
  edges: { source: string; target: string; label?: string }[]
}

function nodeTypes(graph: UserGraph): CanvasComponentType[] {
  return graph.nodes.map((n) => n.type)
}

function hasPath(
  graph: UserGraph,
  fromType: CanvasComponentType,
  toType: CanvasComponentType,
): boolean {
  const fromNodes = graph.nodes.filter((n) => n.type === fromType).map((n) => n.id)
  const toNodes = graph.nodes.filter((n) => n.type === toType).map((n) => n.id)
  if (fromNodes.length === 0 || toNodes.length === 0) return false

  const adj = new Map<string, string[]>()
  for (const e of graph.edges) {
    const list = adj.get(e.source) ?? []
    list.push(e.target)
    adj.set(e.source, list)
  }

  const visit = (start: string, targetSet: Set<string>): boolean => {
    const seen = new Set<string>()
    const stack = [start]
    while (stack.length > 0) {
      const cur = stack.pop()
      if (!cur || seen.has(cur)) continue
      seen.add(cur)
      if (targetSet.has(cur)) return true
      for (const n of adj.get(cur) ?? []) stack.push(n)
    }
    return false
  }

  const targets = new Set(toNodes)
  return fromNodes.some((f) => visit(f, targets))
}

function hasUnsafeFlow(graph: UserGraph, rubric: ArchitectureRubric): boolean {
  for (const flow of rubric.unsafeFlows) {
    if (hasPath(graph, flow.from, flow.to)) return true
  }
  return false
}

function capabilitySatisfied(
  graph: UserGraph,
  type: CanvasComponentType,
  rubric: ArchitectureRubric,
): boolean {
  const types = nodeTypes(graph)
  if (types.includes(type)) return true
  const alts = rubric.acceptableAlternatives[type] ?? []
  return alts.some((alt) => types.includes(alt))
}

export interface GraphGrade {
  score: number
  max: number
  feedback: string[]
}

export function gradeArchitecture(
  graph: UserGraph,
  rubric: ArchitectureRubric,
  maxPoints = 30,
): GraphGrade {
  const feedback: string[] = []
  if (graph.nodes.length === 0) {
    return { score: 0, max: maxPoints, feedback: ['Add components and connect the request path.'] }
  }

  const capTotal = rubric.requiredCapabilities.length
  let capScore = 0
  for (const cap of rubric.requiredCapabilities) {
    if (capabilitySatisfied(graph, cap, rubric)) {
      capScore += 1
    } else {
      feedback.push(`Missing capability: ${cap.replace(/_/g, ' ')}.`)
    }
  }

  const pathTotal = rubric.requiredPaths.length
  let pathScore = 0
  for (const p of rubric.requiredPaths) {
    if (hasPath(graph, p.from, p.to)) {
      pathScore += 1
    } else {
      feedback.push(`Expected flow from ${p.from} to ${p.to}.`)
    }
  }

  let reliability = 1
  if (hasUnsafeFlow(graph, rubric)) {
    reliability = 0.4
    feedback.push('Unsafe flow detected (e.g., client hitting DB directly).')
  }

  const capRatio = capTotal === 0 ? 1 : capScore / capTotal
  const pathRatio = pathTotal === 0 ? 1 : pathScore / pathTotal
  const raw = (capRatio * 0.55 + pathRatio * 0.45) * reliability
  const score = Math.round(raw * maxPoints)

  if (feedback.length === 0) {
    feedback.push('Architecture covers required paths without unsafe shortcuts.')
  }

  return { score, max: maxPoints, feedback }
}
