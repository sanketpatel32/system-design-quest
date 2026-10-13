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
  | 'transfer-time'
  | 'cidr-hosts'
  | 'pool-size'
  | 'n-plus-one'
  | 'bdp-window'
  | 'frame-budget'
  | 'thread-pool'
  | 'backoff'

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
  // Fundamentals · Networking: time = round trips × RTT + size ÷ bandwidth
  'transfer-time': {
    params: ['rttMs', 'roundTrips', 'mbps'],
    run: (x, p) => {
      const latency = p.roundTrips! * p.rttMs!
      const transfer = (x * 8 * 1000) / p.mbps! // x in MB → ms
      return {
        rows: [
          { label: `Waiting on ${p.roundTrips} round trips`, value: `${fmt(latency)} ms` },
          { label: `Sending ${fmt(x, 2)} MB at ${p.mbps} Mbit/s`, value: `${fmt(transfer)} ms` },
          { label: 'Total', value: `${fmt(latency + transfer)} ms`, strong: true },
        ],
        verdict: latency >= transfer
          ? { ok: true, text: 'Latency-bound: fewer round trips help more than a faster link' }
          : { ok: false, text: 'Bandwidth-bound: a faster link or a smaller payload helps more' },
      }
    },
  },
  // Fundamentals · Networking: a /x IPv4 prefix leaves 32 − x host bits
  'cidr-hosts': {
    params: ['need'],
    run: (x, p) => {
      const total = Math.pow(2, 32 - x)
      // /31 (RFC 3021) and /32 are special; for ordinary subnets the network and broadcast addresses are not usable
      const usable = x >= 31 ? total : total - 2
      return {
        rows: [
          { label: 'Prefix', value: `/${x}` },
          { label: 'Addresses in the block', value: fmt(total) },
          { label: 'Usable host addresses', value: fmt(usable), strong: true },
        ],
        verdict: usable >= p.need!
          ? { ok: true, text: `Room for the ${fmt(p.need!)} hosts you need` }
          : { ok: false, text: `Too small for ${fmt(p.need!)} hosts` },
      }
    },
  },
  // Fundamentals · Databases: Little's law, connections busy = arrival rate × time each holds one
  'pool-size': {
    params: ['qps', 'pool'],
    run: (x, p) => {
      const busy = (p.qps! * x) / 1000
      return {
        rows: [
          { label: 'Query time', value: `${fmt(x)} ms` },
          { label: 'Connections busy on average', value: fmt(busy, 1), strong: true },
          { label: 'Pool size', value: fmt(p.pool!) },
        ],
        verdict: busy < p.pool!
          ? { ok: true, text: 'The pool keeps up on average (bursts still queue briefly)' }
          : { ok: false, text: 'Requests queue for a connection; latency climbs' },
      }
    },
  },
  // Fundamentals · Databases: one query per parent row vs one batched query
  'n-plus-one': {
    params: ['rttMs'],
    run: (x, p) => {
      const naive = (x + 1) * p.rttMs!
      const batched = 2 * p.rttMs!
      return {
        rows: [
          { label: 'Rows on the page', value: fmt(x) },
          { label: `N + 1 queries (${fmt(x + 1)} round trips)`, value: `${fmt(naive, 1)} ms`, strong: true },
          { label: 'Two queries (list, then all children at once)', value: `${fmt(batched, 1)} ms` },
        ],
        verdict: naive <= 100
          ? { ok: true, text: 'Under a 100 ms budget, but it grows with every row' }
          : { ok: false, text: 'Over a 100 ms budget from round trips alone' },
      }
    },
  },
  // Fundamentals · Networking: one connection's throughput ≤ window ÷ RTT
  'bdp-window': {
    params: ['rttMs', 'linkMbps'],
    run: (x, p) => {
      const mbps = (x * 1024 * 8) / (p.rttMs! / 1000) / 1e6 // x in KiB
      const bdpKiB = (p.linkMbps! * 1e6 * (p.rttMs! / 1000)) / 8 / 1024
      return {
        rows: [
          { label: 'Window', value: `${fmt(x)} KiB` },
          { label: `Max throughput at ${p.rttMs} ms RTT`, value: `${fmt(Math.min(mbps, p.linkMbps!), 1)} Mbit/s`, strong: true },
          { label: 'Window needed to fill the link (bandwidth × delay)', value: `${fmt(bdpKiB)} KiB` },
        ],
        verdict: mbps >= p.linkMbps!
          ? { ok: true, text: `Fills the ${p.linkMbps} Mbit/s link` }
          : { ok: false, text: 'The window, not the link, limits this connection' },
      }
    },
  },
  // Fundamentals · Frontend: one frame lasts 1000 ÷ refresh rate milliseconds
  'frame-budget': {
    params: ['workMs'],
    run: (x, p) => {
      const frame = 1000 / x
      return {
        rows: [
          { label: 'Refresh rate', value: `${fmt(x)} Hz` },
          { label: 'Time per frame', value: `${fmt(frame, 1)} ms`, strong: true },
          { label: 'Your work per frame', value: `${fmt(p.workMs!, 1)} ms` },
        ],
        verdict: p.workMs! <= frame
          ? { ok: true, text: 'Fits in the frame' }
          : { ok: false, text: 'Overruns the frame: expect dropped frames' },
      }
    },
  },
  // Fundamentals · Backend: Little's law for a thread-per-request server, threads busy = arrival rate × time each request holds one
  'thread-pool': {
    params: ['rps', 'threads'],
    run: (x, p) => {
      const busy = (p.rps! * x) / 1000
      return {
        rows: [
          { label: 'Time a request holds its thread', value: `${fmt(x)} ms` },
          { label: 'Threads busy on average', value: fmt(busy, 1), strong: true },
          { label: 'Threads in the pool', value: fmt(p.threads!) },
        ],
        verdict: busy < p.threads!
          ? { ok: true, text: 'The pool keeps up on average' }
          : { ok: false, text: 'Every thread is busy: new requests queue and latency climbs' },
      }
    },
  },
  // Fundamentals · Backend: exponential backoff, delay before retry n = min(cap, base × 2^(n − 1))
  'backoff': {
    params: ['baseMs', 'capMs'],
    run: (x, p) => {
      const delay = (n: number) => Math.min(p.capMs!, p.baseMs! * Math.pow(2, n - 1))
      let total = 0
      for (let n = 1; n <= x; n++) total += delay(n)
      return {
        rows: [
          { label: 'Retries so far', value: `${x}` },
          { label: `Wait before retry ${x} (max, before jitter)`, value: `${fmt(delay(x))} ms`, strong: true },
          { label: 'Total waiting across all retries', value: `${fmt(total)} ms` },
        ],
        verdict: total <= 10_000
          ? { ok: true, text: 'Total wait fits a 10 s budget' }
          : { ok: false, text: 'Total wait is over a 10 s budget: stop retrying sooner' },
      }
    },
  },
}
