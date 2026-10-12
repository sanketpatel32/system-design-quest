/**
 * Small, exact models behind the in-lesson sliders. Each takes the slider value `x` and the
 * lesson's fixed parameters and returns rows to show plus an optional verdict against a goal.
 * Keep these pure and unit-tested: the lesson text quotes their results.
 */
export type ModelId =
  | 'peak-qps'
  | 'servers'
  | 'rtt-handshake'
  | 'dns-ttl'
  | 'cache-hit'
  | 'cdn-offload'
  | 'quorum'
  | 'ring-moves'
  | 'availability'
  | 'token-bucket'
  | 'retry-amplification'
  | 'raft-majority'
  | 'gossip-rounds'
  | 'queue-backlog'
  | 'btree-levels'

export interface ModelRow {
  label: string
  value: string
  strong?: boolean
}
export interface ModelOutput {
  rows: ModelRow[]
  verdict?: { ok: boolean; text: string }
}
type Params = Record<string, number>

export const fmt = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 })

/** Format large rates with K/M so they read like the lessons (23K/s, 6.25M/s) */
export function short(n: number) {
  if (n >= 1e6) return `${fmt(n / 1e6, 2)}M`
  if (n >= 1e4) return `${fmt(n / 1e3, 0)}K`
  if (n >= 1e3) return `${fmt(n / 1e3, 1)}K`
  return fmt(n, n < 10 ? 1 : 0)
}

export const MODELS: Record<ModelId, { params: string[]; run: (x: number, p: Params) => ModelOutput }> = {
  // Lesson 2: average from DAU, then the peak you assume
  'peak-qps': {
    params: ['dau', 'actions', 'capacity'],
    run: (x, p) => {
      const avg = (p.dau! * p.actions!) / 86_400
      const peak = avg * x
      return {
        rows: [
          { label: 'Average', value: `${short(avg)}/s` },
          { label: `Peak at ${fmt(x, 1)}×`, value: `${short(peak)}/s`, strong: true },
        ],
        verdict: peak <= p.capacity!
          ? { ok: true, text: `Fits the ${short(p.capacity!)}/s you provisioned` }
          : { ok: false, text: `Above the ${short(p.capacity!)}/s you provisioned` },
      }
    },
  },
  // Lesson 3 / 119: servers = peak ÷ per-server, plus headroom, plus spares
  servers: {
    params: ['perServer', 'headroomPct', 'spares', 'budget'],
    run: (x, p) => {
      // epsilon: 60,000 ÷ 2,000 × 1.3 is 39.000000000000004 in floating point, which must stay 39
      const base = Math.ceil(x / p.perServer! - 1e-9)
      const withHeadroom = Math.ceil((x / p.perServer!) * (1 + p.headroomPct! / 100) - 1e-9)
      const total = withHeadroom + p.spares!
      return {
        rows: [
          { label: 'Peak ÷ per-server capacity', value: `${base}` },
          { label: `With ${p.headroomPct}% headroom`, value: `${withHeadroom}` },
          { label: `Plus ${p.spares} spare for failures`, value: `${total} servers`, strong: true },
        ],
        verdict: total <= p.budget!
          ? { ok: true, text: `Within the budget of ${p.budget} servers` }
          : { ok: false, text: `Over the budget of ${p.budget} servers` },
      }
    },
  },
  // Lessons 4, 7: round trips before the first byte of a cold HTTPS request
  'rtt-handshake': {
    params: ['roundTrips', 'budgetMs'],
    run: (x, p) => {
      const ms = x * p.roundTrips!
      return {
        rows: [
          { label: 'One round trip', value: `${fmt(x)} ms` },
          { label: `${p.roundTrips} round trips before the first byte`, value: `${fmt(ms)} ms`, strong: true },
        ],
        verdict: ms <= p.budgetMs!
          ? { ok: true, text: `Inside a ${fmt(p.budgetMs!)} ms budget` }
          : { ok: false, text: `Over a ${fmt(p.budgetMs!)} ms budget: move the edge closer or reuse connections` },
      }
    },
  },
  // Lesson 6: worst-case time users keep a cached record after you change it
  'dns-ttl': {
    params: ['detectS', 'budgetS'],
    run: (x, p) => {
      const worst = x + p.detectS!
      return {
        rows: [
          { label: 'TTL', value: `${fmt(x)} s` },
          { label: 'Detection + full TTL (worst case)', value: `${fmt(worst)} s`, strong: true },
        ],
        verdict: worst <= p.budgetS!
          ? { ok: true, text: `Failover completes within ${fmt(p.budgetS!)} s` }
          : { ok: false, text: `Some users stay on the dead address past ${fmt(p.budgetS!)} s` },
      }
    },
  },
  // Lesson 15: reads that miss the cache land on the database
  'cache-hit': {
    params: ['reads', 'dbCapacity'],
    run: (x, p) => {
      const db = p.reads! * (1 - x / 100)
      return {
        rows: [
          { label: 'Hit rate', value: `${fmt(x, 1)}%` },
          { label: 'Reads reaching the database', value: `${fmt(Math.round(db))}/s`, strong: true },
        ],
        verdict: db <= p.dbCapacity!
          ? { ok: true, text: `The database (about ${fmt(p.dbCapacity!)}/s) keeps up` }
          : { ok: false, text: `More than the database's ~${fmt(p.dbCapacity!)}/s` },
      }
    },
  },
  // Lesson 19: origin egress = total × miss ratio
  'cdn-offload': {
    params: ['totalGbps', 'originGbps'],
    run: (x, p) => {
      const origin = p.totalGbps! * (1 - x / 100)
      return {
        rows: [
          { label: 'Edge hit ratio', value: `${fmt(x, 1)}%` },
          { label: 'Egress from your origin', value: `${fmt(origin, 1)} Gbps`, strong: true },
        ],
        verdict: origin <= p.originGbps!
          ? { ok: true, text: `Within the origin's ${fmt(p.originGbps!)} Gbps uplink` }
          : { ok: false, text: `More than the origin's ${fmt(p.originGbps!)} Gbps uplink` },
      }
    },
  },
  // Lesson 29: a read is guaranteed to overlap the latest write when R + W > N
  quorum: {
    params: ['n', 'w'],
    run: (x, p) => {
      const ok = x + p.w! > p.n!
      return {
        rows: [
          { label: 'R + W', value: `${x} + ${p.w} = ${x + p.w!}` },
          { label: 'N', value: `${p.n}` },
          { label: 'Replicas each read waits for', value: `${x}`, strong: true },
        ],
        verdict: ok
          ? { ok: true, text: 'Every read set overlaps every write set' }
          : { ok: false, text: 'A read can miss the latest write' },
      }
    },
  },
  // Lesson 31: keys that move when one node joins N existing nodes
  'ring-moves': {
    params: [],
    run: (x) => ({
      rows: [
        { label: 'Nodes before the new one joins', value: `${x}` },
        { label: 'Hash ring: keys that move', value: `${fmt((1 / (x + 1)) * 100, 1)}%`, strong: true },
        { label: 'hash mod N: keys that move', value: `≈ ${fmt((x / (x + 1)) * 100, 1)}%` },
      ],
    }),
  },
  // Lesson 55: n independent replicas in parallel
  availability: {
    params: ['nodePct', 'targetPct'],
    run: (x, p) => {
      const a = 1 - Math.pow(1 - p.nodePct! / 100, x)
      const downMin = (1 - a) * 365 * 24 * 60
      return {
        rows: [
          { label: 'Replicas', value: `${x}` },
          { label: 'Availability (independent failures)', value: `${fmt(a * 100, 4)}%`, strong: true },
          { label: 'Expected downtime per year', value: downMin >= 120 ? `${fmt(downMin / 60, 1)} h` : `${fmt(downMin, 1)} min` },
        ],
        verdict: a * 100 >= p.targetPct!
          ? { ok: true, text: `Meets ${p.targetPct}% on paper, if failures really are independent` }
          : { ok: false, text: `Below the ${p.targetPct}% target` },
      }
    },
  },
  // Lesson 41: requests allowed in the first `seconds` from a full bucket
  'token-bucket': {
    params: ['rate', 'seconds', 'burst'],
    run: (x, p) => ({
      rows: [
        { label: 'Bucket capacity (burst)', value: `${x}` },
        { label: `Sustained rate`, value: `${p.rate}/s` },
        { label: `Most requests in the first ${p.seconds} s`, value: `${x + p.rate! * p.seconds!}`, strong: true },
      ],
      verdict: x >= p.burst!
        ? { ok: true, text: `A burst of ${p.burst} at once gets through` }
        : { ok: false, text: `A burst of ${p.burst} at once is partly rejected` },
    }),
  },
  // Lesson 53: retries multiply across layers
  'retry-amplification': {
    params: ['attempts', 'limit'],
    run: (x, p) => {
      const calls = Math.pow(p.attempts!, x)
      return {
        rows: [
          { label: 'Layers that retry', value: `${x}` },
          { label: `Worst-case calls to the bottom service`, value: `${fmt(calls)}`, strong: true },
        ],
        verdict: calls <= p.limit!
          ? { ok: true, text: `At most ${p.limit} calls per user request` }
          : { ok: false, text: `More than ${p.limit} calls per user request: a retry storm` },
      }
    },
  },
  // Lesson 45: tolerate f failures with 2f + 1 nodes
  'raft-majority': {
    params: [],
    run: (x) => ({
      rows: [
        { label: 'Failures to survive', value: `${x}` },
        { label: 'Nodes needed', value: `${2 * x + 1}`, strong: true },
        { label: 'Acks needed per write (majority)', value: `${x + 1}` },
      ],
    }),
  },
  // Lesson 48: news roughly doubles each round, so rounds ≈ log2(N)
  'gossip-rounds': {
    params: [],
    run: (x) => {
      const n = Math.pow(10, x)
      return {
        rows: [
          { label: 'Cluster size', value: fmt(n) },
          { label: 'Rounds until everyone knows (≈ log₂ N)', value: `${Math.ceil(Math.log2(n))}`, strong: true },
        ],
      }
    },
  },
  // Lesson 36: backlog after a spike with x workers
  'queue-backlog': {
    params: ['arrivalsPerMin', 'perWorkerPerMin', 'minutes'],
    run: (x, p) => {
      const drain = x * p.perWorkerPerMin!
      const backlog = Math.max(0, (p.arrivalsPerMin! - drain) * p.minutes!)
      return {
        rows: [
          { label: 'Workers', value: `${x}` },
          { label: 'Processed per minute', value: fmt(drain) },
          { label: `Backlog after ${p.minutes} min`, value: `${fmt(backlog)} jobs`, strong: true },
        ],
        verdict: backlog === 0
          ? { ok: true, text: 'Workers keep up with the spike' }
          : { ok: false, text: 'Jobs pile up; latency grows every minute' },
      }
    },
  },
  // Lesson 23: levels ≈ ceil(log_fanout(rows))
  'btree-levels': {
    params: ['fanout'],
    run: (x, p) => {
      const rows = Math.pow(10, x)
      // small epsilon so exact powers (100^4 = 10^8) don't round up from floating error
      const levels = Math.max(1, Math.ceil(Math.log(rows) / Math.log(p.fanout!) - 1e-9))
      return {
        rows: [
          { label: 'Rows', value: fmt(rows) },
          { label: `Levels with fan-out ${p.fanout}`, value: `${levels}`, strong: true },
          { label: 'Full scan instead', value: `${fmt(rows)} rows` },
        ],
      }
    },
  },
}
