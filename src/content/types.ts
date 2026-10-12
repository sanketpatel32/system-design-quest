export type RegionId =
  | 'r1-foundations'
  | 'r2-networking'
  | 'r3-load-balancing'
  | 'r4-caching'
  | 'r5-databases'
  | 'r6-messaging'
  | 'r7-coordination'
  | 'r8-microservices'
  | 'r9-security-storage'
  | 'boss-arena'
  | 'r10-strategy'

export type TopicKind = 'lesson' | 'boss' | 'tutorial'

export type CardKind = 'text' | 'diagram' | 'animation'

export interface LessonCard {
  id: string
  kind: CardKind
  title: string
  body: string
  /** SVG or mermaid-like description rendered as diagram */
  diagram?: string
  /** Ordered steps of a request flow, rendered as a connected sequence */
  steps?: string[]
  accent?: string
  /** Concepts this card teaches (matched against question.concept by the audit) */
  teaches?: string[]
}

export interface SourceRef {
  title: string
  url: string
}

export interface Flashcard {
  id: string
  front: string
  back: string
}

export type QuestionType =
  | 'multiple_choice'
  | 'spot_bottleneck'
  | 'drag_order'
  | 'estimation'
  | 'tradeoff'

export interface BaseQuestion {
  id: string
  type: QuestionType
  prompt: string
  explanation: string
  /** For flashcard-derived review */
  tags?: string[]
  /** Concept this question tests; a card in the topic (or a prerequisite) must teach it */
  concept?: string
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice'
  choices: { id: string; label: string }[]
  correctChoiceIds: string[]
  /** Alternative valid choice ids */
  alternativeChoiceIds?: string[]
}

export interface SpotBottleneckQuestion extends BaseQuestion {
  type: 'spot_bottleneck'
  diagramNodes: { id: string; label: string; x: number; y: number }[]
  diagramEdges: { from: string; to: string }[]
  correctNodeIds: string[]
}

export interface DragOrderQuestion extends BaseQuestion {
  type: 'drag_order'
  items: { id: string; label: string }[]
  correctOrder: string[]
}

export interface EstimationQuestion extends BaseQuestion {
  type: 'estimation'
  unit: string
  target: number
  assumptions: string[]
  formula: string
  workedAnswer: string
  /** Accept if abs(ans-target)/target <= 0.5 */
}

export interface TradeoffQuestion extends BaseQuestion {
  type: 'tradeoff'
  constraints: string[]
  approaches: { id: string; label: string; description: string }[]
  correctApproachId: string
  /** Structured rationale — select valid option ids (not free text). */
  rationaleOptions: { id: string; label: string }[]
  correctRationaleIds: string[]
  /** Optional distractor rationale ids that fail grading if selected */
  distractorRationaleIds?: string[]
  /** Why each distractor reason is wrong under the stated constraints */
  rationaleConflicts?: Record<string, string>
}

export type Question =
  | MultipleChoiceQuestion
  | SpotBottleneckQuestion
  | DragOrderQuestion
  | EstimationQuestion
  | TradeoffQuestion

export type CanvasComponentType =
  | 'client'
  | 'dns'
  | 'load_balancer'
  | 'api_gateway'
  | 'service'
  | 'cache'
  | 'sql_db'
  | 'nosql_db'
  | 'queue'
  | 'cdn'
  | 'blob_storage'
  | 'search'
  | 'worker'

export interface BossStage {
  id: string
  title: string
  kind:
    | 'requirements'
    | 'estimation'
    | 'api'
    | 'architecture'
    | 'deep_dive'
    | 'tradeoffs'
  prompt: string
  questions: Question[]
}

export interface GraphNodeSpec {
  id: string
  type: CanvasComponentType
  label?: string
}

export interface GraphEdgeSpec {
  from: string
  to: string
  label?: string
}

export interface ArchitectureRubric {
  requiredCapabilities: CanvasComponentType[]
  acceptableAlternatives: Partial<Record<CanvasComponentType, CanvasComponentType[]>>
  requiredPaths: { from: CanvasComponentType; to: CanvasComponentType }[]
  unsafeFlows: { from: CanvasComponentType; to: CanvasComponentType }[]
  minSeparation: { types: CanvasComponentType[]; reason: string }[]
  reliabilityChecks: string[]
}

export interface BossContent {
  functionalRequirements: string[]
  nonFunctionalRequirements: string[]
  exclusions: string[]
  requirementDistractors: string[]
  estimationScenario: string
  apiPrompt: string
  deepDivePrompts: string[]
  tradeoffPrompt: string
  rubric: ArchitectureRubric
  referenceNodes: GraphNodeSpec[]
  referenceEdges: GraphEdgeSpec[]
  referenceNotes: string
  workedEstimate: string
  exampleApi: string
  deepDiveAnswers: string[]
  tradeoffAnalysis: string
  alternativeArchitectures: string[]
  prerequisiteTopicIds: number[]
}

export interface Topic {
  id: number
  slug: string
  region: RegionId
  order: number
  title: string
  kind: TopicKind
  objectives: string[]
  difficulty: 1 | 2 | 3 | 4 | 5
  durationMinutes: number
  prereqIds: number[]
  cards: LessonCard[]
  questions: Question[]
  flashcards: Flashcard[]
  sources: SourceRef[]
  boss?: BossContent
  bossStages?: BossStage[]
}

export interface RegionMeta {
  id: RegionId
  name: string
  subtitle: string
  theme: string
  topicIds: number[]
}
