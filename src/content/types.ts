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
  | 'f1-frontend'
  | 'f2-backend'
  | 'f3-networking'
  | 'f4-databases'
  | 'f5-os'
  | 'f6-security'
  | 'f7-cloud'

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
  /** Shown after the steps, e.g. the result of a worked example */
  note?: string
  /** 'deep-numbers' when the card is the lesson's worked calculation (the deep section then links to it) */
  source?: 'deep-numbers'
}

/** A small in-lesson experiment or decision, shown as the last step before the quiz */
export type Interactive = InteractiveSlider | InteractivePredict

export interface InteractiveSlider {
  kind: 'slider'
  title: string
  /** What to try, e.g. "Find the lowest hit rate the database survives" */
  prompt: string
  model: import('../lib/interactive/models').ModelId
  params: Record<string, number>
  control: { label: string; min: number; max: number; step: number; initial: number; unit?: string; /** Show 10^x instead of x */ log10?: boolean }
  /** Shown once the learner has moved the slider */
  takeaway: string
}

export interface InteractivePredict {
  kind: 'predict' | 'tradeoff'
  title: string
  prompt: string
  /** Optional facts to reason from */
  setup?: string[]
  choices: { id: string; label: string; feedback: string }[]
  correctId: string
  /** The reasoning, shown after any answer */
  reveal: string
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
  /** Other complete orders that are equally valid (e.g. two independent steps that may swap) */
  alternativeOrders?: string[][]
}

export interface EstimationQuestion extends BaseQuestion {
  type: 'estimation'
  unit: string
  target: number
  assumptions: string[]
  formula: string
  workedAnswer: string
  /**
   * Accepted relative error: accept if abs(ans - target) / target <= tolerance.
   * Defaults to 0.5 for order-of-magnitude estimates; use 0 for exact counts
   * (round trips, hosts, levels) and a tight value when a classic mistake is close.
   */
  tolerance?: number
  /** Classic wrong answers this question is designed to catch; the audit checks they fall outside the tolerance */
  trapAnswers?: number[]
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

/** Deeper lesson material shown under the card deck (authored in scripts/authored/deep/*.json). */
export interface DeepLesson {
  /** Concepts this material teaches, so quiz questions can point at it */
  teaches: string[]
  mechanism: { title: string; steps: string[] }
  useWhen: string[]
  avoidWhen: string[]
  tradeoffs: { columns: string[]; rows: string[][] }
  numbers: { title: string; assumptions: string[]; steps: string[]; result: string }
  /** Indian-market example. `label` says how sure we are, e.g. "Publicly reported" or "Illustrative estimate". */
  india: { title: string; body: string; label: string }
  pitfalls: { trap: string; say: string }[]
  /** Optional monospace diagram */
  diagram?: string
  takeaways: string[]
}

/** Boss-fight study brief (authored in scripts/authored/boss-deep/*.json). */
export interface BossDeep {
  pitch: string
  requirements: { functional: string[]; nonFunctional: string[]; outOfScope: string[] }
  capacity: { assumptions: string[]; steps: string[]; result: string }
  architecture: { steps: string[]; diagram: string }
  deepDives: { title: string; body: string }[]
  /** What a strong answer covers */
  rubric: string[]
}

export interface Topic {
  interactive?: Interactive
  /** Fundamentals: existing system-design lessons that cover the same ground at the architecture level */
  seeAlso?: { topicId: number; why: string }[]
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
  deep?: DeepLesson
  bossDeep?: BossDeep
  bossStages?: BossStage[]
}

export interface RegionMeta {
  id: RegionId
  name: string
  subtitle: string
  theme: string
  topicIds: number[]
  /** 'fundamentals' regions live on the Fundamentals track, outside the numbered system-design units */
  track?: 'fundamentals'
}
