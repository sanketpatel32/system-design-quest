import { describe, expect, it } from 'vitest'
import { MODELS } from './models'

const v = (id: keyof typeof MODELS, x: number, p: Record<string, number> = {}) => MODELS[id].run(x, p)

describe('interactive models', () => {
  it('peak-qps matches Lesson 2 (50M × 40 ÷ 86,400 ≈ 23K, ×3 ≈ 69K)', () => {
    const o = v('peak-qps', 3, { dau: 50e6, actions: 40, capacity: 100_000 })
    expect(o.rows[0]!.value).toBe('23K/s')
    expect(o.rows[1]!.value).toBe('69K/s')
    expect(o.verdict?.ok).toBe(true)
    expect(v('peak-qps', 5, { dau: 50e6, actions: 40, capacity: 100_000 }).verdict?.ok).toBe(false)
  })
  it('servers: 60K at 5K each, 30% headroom = 16, plus 1 spare = 17', () => {
    expect(v('servers', 60_000, { perServer: 5000, headroomPct: 30, spares: 1, budget: 20 }).rows[2]!.value).toBe('17 servers')
  })
  it('servers: 60K at 2K each with 30% headroom is exactly 39 (+1 spare = 40), no float round-up', () => {
    expect(v('servers', 60_000, { perServer: 2000, headroomPct: 30, spares: 1, budget: 40 }).verdict?.ok).toBe(true)
  })
  it('cache-hit: 20K reads at 90% leaves 2,000 for the DB', () => {
    expect(v('cache-hit', 90, { reads: 20_000, dbCapacity: 3000 }).rows[1]!.value).toBe('2,000/s')
  })
  it('quorum overlap needs R + W > N', () => {
    expect(v('quorum', 2, { n: 5, w: 3 }).verdict?.ok).toBe(false)
    expect(v('quorum', 3, { n: 5, w: 3 }).verdict?.ok).toBe(true)
  })
  it('ring: 4 nodes plus one moves 20%', () => {
    expect(v('ring-moves', 4).rows[1]!.value).toBe('20%')
  })
  it('availability: two 99% replicas give 99.99%', () => {
    const o = v('availability', 2, { nodePct: 99, targetPct: 99.99 })
    expect(o.rows[1]!.value).toBe('99.99%')
    expect(o.verdict?.ok).toBe(true)
  })
  it('token bucket: capacity 20 + 5/s over 4 s = 40', () => {
    expect(v('token-bucket', 20, { rate: 5, seconds: 4, burst: 20 }).rows[2]!.value).toBe('40')
  })
  it('retries: 3 attempts over 3 layers = 27', () => {
    expect(v('retry-amplification', 3, { attempts: 3, limit: 10 }).rows[1]!.value).toBe('27')
  })
  it('raft: survive 3 failures with 7 nodes', () => {
    expect(v('raft-majority', 3).rows[1]!.value).toBe('7')
  })
  it('gossip: 1,000 nodes in 10 rounds', () => {
    expect(v('gossip-rounds', 3).rows[1]!.value).toBe('10')
  })
  it('queue: 6,000/min in, 2 workers × 2,000/min, 15 min → 30,000 backlog', () => {
    expect(v('queue-backlog', 2, { arrivalsPerMin: 6000, perWorkerPerMin: 2000, minutes: 15 }).rows[2]!.value).toBe('30,000 jobs')
    expect(v('queue-backlog', 3, { arrivalsPerMin: 6000, perWorkerPerMin: 2000, minutes: 15 }).verdict?.ok).toBe(true)
  })
  it('b-tree: 100M rows with fan-out 100 = 4 levels', () => {
    expect(v('btree-levels', 8, { fanout: 100 }).rows[1]!.value).toBe('4')
  })
  it('rtt: 3 round trips at 60 ms = 180 ms', () => {
    expect(v('rtt-handshake', 60, { roundTrips: 3, budgetMs: 200 }).rows[1]!.value).toBe('180 ms')
  })
})

describe('fundamentals models', () => {
  const val = (o: { rows: { label: string; value: string }[] }, i: number) => o.rows[i]!.value
  it('thread-pool: 400 rps × 50 ms = 20 busy threads; overflows a pool of 16', () => {
    expect(val(MODELS['thread-pool'].run(50, { rps: 400, threads: 32 }), 1)).toBe('20')
    expect(MODELS['thread-pool'].run(50, { rps: 400, threads: 32 }).verdict!.ok).toBe(true)
    expect(MODELS['thread-pool'].run(50, { rps: 400, threads: 16 }).verdict!.ok).toBe(false)
  })
  it('backoff: base 100, cap 2000 doubles then caps', () => {
    const r5 = MODELS['backoff'].run(5, { baseMs: 100, capMs: 2000 })
    expect(val(r5, 1)).toMatch(/^1,?600 ms$/)
    expect(val(r5, 2)).toMatch(/^3,?100 ms$/)
    expect(val(MODELS['backoff'].run(7, { baseMs: 100, capMs: 2000 }), 1)).toMatch(/^2,?000 ms$/)
    expect(MODELS['backoff'].run(10, { baseMs: 100, capMs: 2000 }).verdict!.ok).toBe(false)
  })
  it('backoff: the deadline comes from the lesson (2 s fits three retries of 200/400/800 ms, not four)', () => {
    expect(MODELS['backoff'].run(3, { baseMs: 200, capMs: 5000, budgetMs: 2000 }).verdict!.ok).toBe(true)
    expect(MODELS['backoff'].run(4, { baseMs: 200, capMs: 5000, budgetMs: 2000 }).verdict!.ok).toBe(false)
    expect(MODELS['backoff'].run(4, { baseMs: 200, capMs: 5000, budgetMs: 2000 }).verdict!.text).toContain('2 s')
  })
  it('transfer-time: latency- and bandwidth-bound are neutral observations', () => {
    expect(MODELS['transfer-time'].run(0.05, { rttMs: 100, roundTrips: 3, mbps: 8 }).verdict!.neutral).toBe(true)
    expect(MODELS['transfer-time'].run(5, { rttMs: 100, roundTrips: 3, mbps: 8 }).verdict!.neutral).toBe(true)
  })
  it('frame-budget: 60 Hz gives 16.7 ms, 90 Hz overruns 12 ms of work', () => {
    expect(val(MODELS['frame-budget'].run(60, { workMs: 12 }), 1)).toBe('16.7 ms')
    expect(MODELS['frame-budget'].run(90, { workMs: 12 }).verdict!.ok).toBe(false)
  })
  it('cidr-hosts: /24 has 254 usable, /31 has 2', () => {
    expect(val(MODELS['cidr-hosts'].run(24, { need: 1 }), 2)).toBe('254')
    expect(val(MODELS['cidr-hosts'].run(31, { need: 1 }), 2)).toBe('2')
  })
  it('transfer-time: 3 × 100 ms + 1 MB at 8 Mbit/s = 1,300 ms', () => {
    expect(val(MODELS['transfer-time'].run(1, { rttMs: 100, roundTrips: 3, mbps: 8 }), 2)).toBe('1,300 ms')
  })
  it("pool-size: Little's law 500 qps × 20 ms = 10 busy", () => {
    expect(val(MODELS['pool-size'].run(20, { qps: 500, pool: 20 }), 1)).toBe('10')
  })
  it('n-plus-one: 50 rows at 2 ms = 102 ms', () => {
    expect(val(MODELS['n-plus-one'].run(50, { rttMs: 2 }), 1)).toBe('102 ms')
  })
  it('bdp-window: 64 KiB over 100 ms is about 5.2 Mbit/s', () => {
    expect(val(MODELS['bdp-window'].run(64, { rttMs: 100, linkMbps: 100 }), 1)).toBe('5.2 Mbit/s')
  })
  it('context-switch: 10 ms slice, 5 µs switch = 0.05%; 11 threads wait 100 ms', () => {
    const o = MODELS['context-switch'].run(10, { switchUs: 5, runnable: 11 })
    expect(val(o, 2)).toBe('0.05%')
    expect(val(o, 3)).toBe('100 ms')
  })
  it('hash-cost: each +1 doubles the cost (50 ms at 10 -> 200 ms at 12)', () => {
    const o = MODELS['hash-cost'].run(12, { msAt10: 50, attackerPerSecAt10: 100000 })
    expect(val(o, 1)).toBe('200 ms')
    expect(val(o, 3)).toBe('25K')
  })
  it('fr-tracks: 1000 px, 200 px fixed, two 20 px gaps, 3 fr -> 1fr = 253.3 px', () => {
    const o = MODELS['fr-tracks'].run(1000, { fixedPx: 200, gapPx: 20, gaps: 2, frTotal: 3 })
    expect(val(o, 2)).toBe('253.3 px')
    expect(o.verdict!.ok).toBe(true)
    expect(MODELS['fr-tracks'].run(560, { fixedPx: 200, gapPx: 20, gaps: 2, frTotal: 3 }).verdict!.ok).toBe(false)
  })
  it('heap-growth: 40 MB + 3 MB x 50 route changes = 190 MB, over a 150 MB budget', () => {
    const o = MODELS['heap-growth'].run(50, { baseMb: 40, leakMb: 3, budgetMb: 150 })
    expect(val(o, 2)).toBe('190 MB')
    expect(o.verdict!.ok).toBe(false)
    expect(MODELS['heap-growth'].run(30, { baseMb: 40, leakMb: 3, budgetMb: 150 }).verdict!.ok).toBe(true)
  })
  it('rollout: 1% of 60,000 rpm at 5% errors = 30 failures/min, alarm at 50 in 1.7 min', () => {
    const o = MODELS['rollout'].run(1, { rpm: 60000, badPct: 5, alarmFailures: 50 })
    expect(val(o, 1)).toBe('30')
    expect(val(o, 2)).toBe('1.7')
  })
})
