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
