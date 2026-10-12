#!/usr/bin/env node
/**
 * Deterministic content repair pass over scripts/authored/*.json.
 * Idempotent: running it twice gives the same output. See README "Content fixes".
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LESSONS, CARDS_ONLY, EXTRA_CARDS, TEXT_FIXES } from './fixes/lessons.mjs'
import { BLOCK_OWNER, AUTHORED_BLOCKS } from './fixes/bosses.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'scripts/authored')
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
const chunks = files.map((f) => ({ f, topics: JSON.parse(readFileSync(join(dir, f), 'utf8')) }))
const all = chunks.flatMap((c) => c.topics)
const byId = new Map(all.map((t) => [t.id, t]))

// ---------- helpers ----------
function hash(seed) {
  let h = 2166136261
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}
function shuffle(arr, seed) {
  const out = [...arr]
  let h = hash(seed)
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    const j = h % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
const human = (n) => {
  const u = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']]
  for (const [v, s] of u) if (n >= v) return `${+(n / v).toFixed(n / v >= 100 ? 0 : 1)}${s}`
  return String(Math.round(n))
}
const sig2 = (n) => {
  if (n === 0) return 0
  const p = Math.pow(10, Math.floor(Math.log10(n)) - 1)
  return Math.round(n / p) * p
}
const comma = (n) => Math.round(n).toLocaleString('en-US')
const isTemplate = (q) => /«[^»]*»/.test(q.prompt)
const mc = (id, prompt, correct, wrong, explanation, tags) => ({
  id, type: 'multiple_choice', prompt,
  choices: [correct, ...wrong].map((label, i) => ({ id: 'abcdef'[i], label })),
  correctChoiceIds: ['a'], explanation, ...(tags ? { tags } : {}),
})
const KIND = new Set(['text', 'diagram', 'animation'])

/** Mix choice order so the right answer is not always first. Ids stay stable. */
const byKey = (a, b) => (a.id < b.id ? -1 : 1)
function shuffleChoices(q) {
  // Sort to a canonical order first so repeated runs give the same result
  if (q.type === 'multiple_choice') q.choices = shuffle([...q.choices].sort(byKey), q.id)
  if (q.type === 'tradeoff') {
    q.approaches = shuffle([...q.approaches].sort(byKey), q.id)
    if (q.rationaleOptions) q.rationaleOptions = shuffle([...q.rationaleOptions].sort(byKey), q.id + 'r')
  }
  return q
}

function fixCard(c) {
  // Imported cards had kind and title swapped ("text" shown as a heading)
  if (KIND.has(c.title) && !KIND.has(c.kind)) [c.kind, c.title] = [c.title, c.kind]
  const m = /^Step through how a request moves\.\s*\n\s*\nFlow:\s*(.+)$/s.exec(c.body ?? '')
  if (m) {
    c.steps = m[1].split('→').map((s) => s.trim()).filter(Boolean)
    c.body = flowBody(c.steps)
    c.kind = 'diagram'
  }
  if (c.steps?.length && /^(Follow one request from start to finish\.|From “.*”, one step at a time\.)$/.test(c.body)) c.body = flowBody(c.steps)
  return c
}
const flowBody = (st) => `${st.length} steps from “${st[0]}” to “${st.at(-1)}”, via “${st[1]}”.`
const cardsFrom = (id, list) =>
  list.map(([title, body, steps], i) => ({
    id: `t${id}-c${i + 1}`,
    kind: steps ? 'diagram' : 'text',
    title,
    body: body ?? flowBody(steps),
    ...(steps ? { steps } : {}),
  }))

// ---------- lessons ----------
for (const t of all.filter((t) => t.kind !== 'boss')) {
  const L = LESSONS[t.id] ?? CARDS_ONLY[t.id]
  if (L?.cards) t.cards = cardsFrom(t.id, L.cards)
  if (L?.flashcards) t.flashcards = L.flashcards.map(([front, back], i) => ({ id: `t${t.id}-f${i + 1}`, front, back }))
  if (LESSONS[t.id]?.questions) t.questions = LESSONS[t.id].questions.map((q) => structuredClone(q))

  t.cards = (t.cards ?? []).map(fixCard)
  for (const c of t.cards) for (const [from, to] of TEXT_FIXES) c.body = c.body.replace(from, to)
  for (const [i, [title, body]] of (EXTRA_CARDS[t.id] ?? []).entries()) {
    const id = `t${t.id}-x${i + 1}`
    if (!t.cards.some((c) => c.id === id)) t.cards.push({ id, kind: 'text', title, body, accent: 'Worked example' })
  }
  // Drop the templated closer: it only repeated the mental-model card
  t.cards = t.cards.filter((c) => !/^Close by restating scope, numbers, and the main risk/.test(c.body))

  // Template questions used the lesson title as a fake product and had joke distractors
  t.questions = t.questions.filter((q) => !isTemplate(q))
  for (const q of t.questions) {
    q.prompt = q.prompt.replace(/^Topic \d+:\s*/, '')
    // "Match X to Y" questions listed only true pairings: turn into "which pairing is correct"
    if (q.type === 'multiple_choice' && q.choices.length === 2 && q.choices.every((c) => c.label.includes('→'))) {
      const [a, b] = q.choices.map((c) => c.label.split('→').map((s) => s.trim()))
      q.prompt = q.prompt.replace(/^Match .*$/, 'Which pairing is correct?')
      q.choices = [
        { id: 'a', label: `${a[0]} → ${a[1]}` },
        { id: 'c', label: `${a[0]} → ${b[1]}` },
        { id: 'd', label: `${b[0]} → ${a[1]}` },
      ]
      q.correctChoiceIds = ['a']
    }
  }

  // Quizzes need at least 3 questions; top up with recall questions on this topic's own flashcards
  const regionBacks = all.filter((o) => o.region === t.region && o.id !== t.id).flatMap((o) => o.flashcards.map((f) => f.back))
  for (const [i, f] of t.flashcards.entries()) {
    if (t.questions.length >= 3) break
    const id = `t${t.id}-r${i + 1}`
    if (t.questions.some((q) => q.id === id)) continue
    const wrong = shuffle(regionBacks.filter((b) => b !== f.back), id).slice(0, 3)
    t.questions.push(mc(id, f.front, f.back, wrong, `From the lesson: ${f.back}`))
  }
  for (const q of t.questions) {
    if (q.prompt === 'Which pairing is correct?') {
      const left = (id) => q.choices.find((c) => c.id === id)?.label.split('→')[0].trim()
      q.prompt = `${left('a')} vs ${left('d')}: which pairing is correct?`
    }
  }
  t.questions = t.questions.map(shuffleChoices)

  if (L?.objectives) t.objectives = L.objectives
  else if (t.objectives?.some((o) => /with measurable requirements and failure modes/.test(o))) {
    const rest = t.objectives.filter((o) => !/with measurable requirements and failure modes/.test(o))
    t.objectives = [...rest, ...t.flashcards.slice(0, 2).map((f) => `Answer: ${f.front.replace(/\?$/, '')}?`)]
  }
}

// The tutorial is a lesson, not a boss: its leftover template boss stages are never shown
if (byId.get(74)) delete byId.get(74).bossStages

// ---------- bosses ----------
const bosses = all.filter((t) => t.kind === 'boss')
const BLOCK_KEYS = ['functionalRequirements', 'nonFunctionalRequirements', 'exclusions', 'requirementDistractors', 'estimationScenario', 'rubric', 'gradingProfile', 'deepDiveAnswers', 'referenceNodes', 'referenceEdges']
const blocks = new Map()
for (const b of bosses) {
  const owner = BLOCK_OWNER[b.boss.functionalRequirements?.[0]]
  if (owner) blocks.set(owner, Object.fromEntries(BLOCK_KEYS.map((k) => [k, b.boss[k]])))
}

function parseScenario(s) {
  const m = /([\d,]+) DAU, ([\d,]+) actions\/user\/day, peak factor (\d+)× — estimate peak (.+?) (?:QPS|per second)/.exec(s)
  if (!m) return null
  const dau = Number(m[1].replace(/,/g, ''))
  const actions = Number(m[2].replace(/,/g, ''))
  const sc = { peak: Number(m[3]), noun: m[4] }
  return dau <= 1 ? { ...sc, daily: actions } : { ...sc, dau, actions }
}

function scenarioOf(b) {
  const s = b.boss.scenario ?? parseScenario(b.boss.estimationScenario) ?? { dau: 10_000_000, actions: 10, peak: 3, noun: 'requests' }
  const daily = s.daily ?? s.dau * s.actions
  const avg = daily / 86400
  const peak = avg * s.peak
  return { ...s, daily, avg, peakQps: peak }
}

for (const b of bosses) {
  const block = AUTHORED_BLOCKS[b.id]
    ? { ...AUTHORED_BLOCKS[b.id], rubric: { acceptableAlternatives: { sql_db: ['nosql_db'], nosql_db: ['sql_db'] }, minSeparation: [], ...AUTHORED_BLOCKS[b.id].rubric } }
    : blocks.get(b.id)
  if (block) Object.assign(b.boss, structuredClone(block))
  const s = scenarioOf(b)
  b.boss.scenario = { ...(s.dau ? { dau: s.dau, actions: s.actions } : { daily: s.daily }), peak: s.peak, noun: s.noun }
  const volume = s.dau ? `${human(s.dau)} daily users each doing about ${s.actions} ${s.noun} a day` : `about ${human(s.daily)} ${s.noun} a day`
  b.boss.estimationScenario = `${b.title}: assume ${volume}, with traffic peaking at ${s.peak}× the daily average.`
  const avgR = sig2(s.avg)
  const peakR = sig2(s.peakQps)
  b.boss.workedEstimate = `${s.dau ? `${human(s.dau)} × ${s.actions} = ` : ''}${human(s.daily)} ${s.noun}/day ÷ 86,400 s ≈ ${comma(avgR)}/s on average; × ${s.peak} peak ≈ ${comma(peakR)}/s.`
  if (b.boss.gradingProfile) b.boss.gradingProfile.expectedPeakQps = s.peakQps

  const fr = b.boss.functionalRequirements
  const nfr = b.boss.nonFunctionalRequirements
  const ex = b.boss.exclusions ?? []
  const dis = b.boss.requirementDistractors ?? []
  const checks = b.boss.rubric.reliabilityChecks ?? []
  const store = b.boss.rubric.requiredCapabilities.find((c) => c === 'sql_db' || c === 'nosql_db') ?? 'sql_db'
  const storeLabel = store === 'sql_db' ? 'Primary SQL database' : 'Primary NoSQL store'
  const P = `b${b.id}`
  b.boss.referenceNotes = `Core flows: ${fr.join('; ')}. Must hold: ${nfr.join('; ')}. Key mechanisms: ${checks.join(' ')}`

  const stages = {
    requirements: [
      mc(`${P}-req1`, `Which of these belongs in the first version of ${b.title}?`, fr[0], [...dis.slice(0, 2), ex[0]].filter(Boolean),
        `In scope: ${fr.join('; ')}. Out of scope for this interview: ${[...ex, ...dis].join('; ')}.`, ['requirements']),
      mc(`${P}-req2`, `Which of these is a non-functional requirement for ${b.title}?`, nfr[0], fr.slice(1, 3).concat(dis[0] ? [dis[0]] : []),
        `Non-functional requirements describe qualities such as latency, durability and availability: ${nfr.join('; ')}. The others are features (functional) or out of scope.`, ['requirements']),
    ],
    estimation: [
      {
        id: `${P}-est1`, type: 'estimation', tags: ['estimation'],
        prompt: `${b.boss.estimationScenario} Estimate peak ${s.noun} per second.`,
        unit: `${s.noun}/s`, target: peakR,
        assumptions: [s.dau ? `${human(s.dau)} users × ${s.actions} per day = ${human(s.daily)}/day` : `${human(s.daily)} per day`, '86,400 seconds in a day', `Peak = ${s.peak} × average`],
        formula: 'peak/s = daily volume ÷ 86,400 × peak factor',
        workedAnswer: b.boss.workedEstimate,
        explanation: `Average first, then apply the peak factor. ${b.boss.workedEstimate} Anything within about 50% shows the right order of magnitude.`,
      },
    ],
    api: [
      mc(`${P}-api1`, `A mobile client times out on “${fr[0]}” and retries. How do you stop the action happening twice?`,
        'Send an idempotency key; the server stores the result for that key and returns it on retry',
        ['Raise the client timeout so retries never happen', 'Switch the endpoint to GET so repeating it is harmless', 'Rely on TCP retransmission to drop the duplicate'],
        'Timeouts can fire after the server already did the work, and TCP cannot tell two HTTP requests apart. An application-level idempotency key identifies the retry.', ['api']),
    ],
    deep_dive: [
      {
        id: `${P}-dd1`, type: 'spot_bottleneck', tags: ['deep_dive'],
        prompt: `Traffic for ${b.title} jumps 10× and there is no cache or replica yet. Which component saturates first?`,
        diagramNodes: [
          { id: 'n1', label: 'Clients', x: 0, y: 0 },
          { id: 'n2', label: 'Load balancer', x: 1, y: 0 },
          { id: 'n3', label: 'App servers (autoscaled)', x: 2, y: 0 },
          { id: 'n4', label: storeLabel, x: 3, y: 0 },
        ],
        diagramEdges: [{ from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }, { from: 'n3', to: 'n4' }],
        correctNodeIds: ['n4'],
        explanation: 'Stateless app servers scale out behind the load balancer; a single primary store does not. Relieve it with caching or read replicas for reads, and partitioning or queues for writes.',
      },
      mc(`${P}-dd2`, `Which mechanism does ${b.title} need for reliability?`, checks[0] ?? 'Replicate data across zones',
        ['Keep user sessions in one server’s memory', 'Retry failed writes forever without idempotency', 'Run a single database with no backups'],
        `${checks.join(' ')} The other options are common reliability mistakes.`, ['deep_dive']),
    ],
    tradeoffs: [
      {
        id: `${P}-to1`, type: 'tradeoff', tags: ['tradeoffs'],
        prompt: `${b.title} must ${fr[0].charAt(0).toLowerCase() + fr[0].slice(1)} while side effects (notifications, analytics, indexing) also happen. How should the request be structured?`,
        constraints: nfr,
        approaches: [
          { id: 'a1', label: 'Synchronous critical path, queue for side effects', description: 'Do only what the user must wait for, publish the rest as events.' },
          { id: 'a2', label: 'Everything synchronous', description: 'The request waits for every downstream call.' },
          { id: 'a3', label: 'Everything asynchronous', description: 'Acknowledge immediately, do all work later, including the core write.' },
        ],
        correctApproachId: 'a1',
        rationaleOptions: [
          { id: 'r1', label: 'User-facing latency only includes the steps the user needs' },
          { id: 'r2', label: 'Side effects can retry from the queue without failing the request' },
          { id: 'r3', label: 'A queue delivers exactly once, so consumers need no idempotency' },
          { id: 'r4', label: 'A queue removes the need to watch backlog' },
        ],
        correctRationaleIds: ['r1', 'r2'],
        distractorRationaleIds: ['r3', 'r4'],
        rationaleConflicts: {
          r3: 'Most brokers deliver at least once, so consumers must be idempotent or they will repeat side effects.',
          r4: 'If consumers fall behind the backlog grows; you still need lag alerts, autoscaling and dead-letter queues.',
        },
        explanation: 'Keep the core write synchronous so the user gets a truthful answer, and move side effects behind a queue. Queues bring their own duties: duplicates, retries, ordering and backlog.',
      },
    ],
  }
  for (const st of b.bossStages) {
    if (stages[st.kind]) st.questions = stages[st.kind].map((q) => shuffleChoices(structuredClone(q)))
    if (st.kind === 'requirements') st.prompt = 'Ask clarifying questions and pin down scope before designing.'
  }
  b.flashcards = [
    { id: `t${b.id}-f1`, front: `Core flows of ${b.title}?`, back: fr.join('; ') },
    { id: `t${b.id}-f2`, front: `Peak load estimate for ${b.title}?`, back: b.boss.workedEstimate },
    { id: `t${b.id}-f3`, front: `Key reliability mechanism in ${b.title}?`, back: checks[0] ?? nfr[0] },
  ]
  b.objectives = [`Scope ${b.title}: ${fr.slice(0, 2).join(', ').toLowerCase()}`, `Size it: ${human(s.daily)} ${s.noun}/day, about ${comma(peakR)}/s at peak`, `Defend the design: ${(checks[0] ?? nfr[0]).replace(/\.$/, '').toLowerCase()}`]
  b.cards = b.cards.map(fixCard)
  // The topic-level list mirrors the stages (used by review and audit), never the old templates
  b.questions = b.bossStages.flatMap((st) => st.questions).map((q) => structuredClone(q))
}

for (const { f, topics } of chunks) writeFileSync(join(dir, f), JSON.stringify(topics, null, 2) + '\n')
console.log(`fix-content: ${all.length} topics repaired`)
