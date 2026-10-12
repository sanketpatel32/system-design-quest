import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { topicsById } from '../content/catalog'

const PATTERNS: [string, string, string, number][] = [
  ['Cache-aside', 'Read-heavy data that can be briefly stale', 'Stampedes on expiry, invalidation on writes', 16],
  ['CDN', 'Static and media content for users across India', 'Purging, cache keys, private content', 19],
  ['Read replicas', 'Reads outgrow one primary', 'Replication lag: read-your-writes', 28],
  ['Sharding', 'One node runs out of storage or write/read throughput', 'Hot keys, cross-shard queries, resharding', 30],
  ['Queue + workers', 'Spiky writes, slow side effects', 'Duplicates (at-least-once), retries, ordering, backlog growth', 36],
  ['Idempotency keys', 'Client retries on payments (UPI) or orders', 'Atomic key insert, key expiry', 40],
  ['Rate limiting', 'Protect APIs from abuse and overload', 'Per-user vs global limits, distributed counters', 41],
  ['Circuit breaker', 'A dependency is slow or failing', 'Fallback behaviour, tuning thresholds', 53],
  ['Saga', 'A workflow spans several services', 'Compensations, visibility of in-between states', 43],
  ['Outbox + CDC', 'Update a DB and publish an event reliably', 'Relay lag, duplicate events', 44],
]

const SOURCES: [string, string][] = [
  ['Google SRE Book: Availability table and error budgets', 'https://sre.google/sre-book/availability-table/'],
  ['Jeff Dean: Latency numbers every programmer should know', 'https://gist.github.com/jboner/2841832'],
  ['AWS Well-Architected: Reliability pillar', 'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html'],
  ['Designing Data-Intensive Applications (Kleppmann), ch. 5–9', 'https://dataintensive.net/'],
]

function Sheet({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`panel p-5 ${className}`} aria-labelledby={`cs-${title}`}>
      <h2 id={`cs-${title}`} className="font-display text-lg font-bold text-chalk mb-3">{title}</h2>
      {children}
    </section>
  )
}

function Row({ k, v, approx }: { k: ReactNode; v: ReactNode; approx?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-rail)] py-2 last:border-0 text-sm">
      <dt className="text-dim">{k}</dt>
      <dd className={`tabular-nums text-right ${approx ? 'text-[var(--color-amber)]' : 'text-chalk font-semibold'}`}>{v}</dd>
    </div>
  )
}

export function CheatSheetPage() {
  return (
    <div className="space-y-5">
      <header className="border-b border-[var(--color-rail)] pb-4">
        <p className="text-sm font-semibold text-[var(--color-amber)]">Reference card</p>
        <h1 className="font-display text-4xl font-extrabold text-chalk mt-1">Numbers and patterns</h1>
        <p className="text-[15px] text-dim mt-2 max-w-2xl">
          Exact values in chalk, interview shortcuts in <span className="text-[var(--color-amber)]">amber</span>. Say which one you are using out loud.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Sheet title="Time and throughput">
          <dl>
            <Row k="1 day" v="86,400 s" />
            <Row k="1M requests/day ÷ 86,400" v="≈ 11.6/s (call it 12)" />
            <Row k="Rougher shortcut: 1 day ≈ 10⁵ s" v="1M/day ≈ 10/s" approx />
            <Row k="100M requests/day" v="≈ 1,160/s average" />
            <Row k="Peak" v="average × peak factor" />
          </dl>
          <p className="text-xs text-dim mt-2">
            The 10⁵ shortcut undercounts by about 14%; fine for orders of magnitude, say so out loud. Peak factors are a workload
            assumption you state, not a constant: a steady B2B API may peak at 2×, an IPL final or a flash sale far higher.
          </p>
        </Sheet>

        <Sheet title="Worked storage and bandwidth">
          <dl>
            <Row k="10M new posts/day × 1 KB" v="10 GB/day ≈ 3.65 TB/year" />
            <Row k="× 3 replicas" v="≈ 11 TB/year raw" />
            <Row k="1M image views/day × 200 KB" v="200 GB/day egress" />
            <Row k="200 GB ÷ 86,400 s" v="≈ 2.3 MB/s ≈ 19 Mbit/s average" />
          </dl>
          <p className="text-xs text-dim mt-2">Decimal units: KB = 10³, MB = 10⁶, GB = 10⁹, TB = 10¹². Binary KiB = 2¹⁰ etc.; 1 byte = 8 bits.</p>
        </Sheet>

        <Sheet title="Availability math">
          <dl>
            <Row k="99.9% per year" v="≈ 8.76 h downtime" />
            <Row k="99.99% per year" v="≈ 52.6 min downtime" />
            <Row k="Serial A then B" v="A × B (e.g. 0.999 × 0.999 ≈ 0.998)" />
            <Row k="Parallel, either works" v="1 − (1 − A)(1 − B)" />
          </dl>
          <p className="text-xs text-dim mt-2">Both formulas assume failures are independent. Shared power, deploys or a region outage break that assumption.</p>
        </Sheet>

        <Sheet title="Illustrative latencies">
          <dl>
            <Row k="L1 cache reference" v="~1 ns" />
            <Row k="Main memory reference" v="~100 ns" />
            <Row k="Redis GET in the same zone" v="~0.5–1 ms" />
            <Row k="SSD random read" v="~100 µs" />
            <Row k="Round trip within a region" v="~1 ms" />
            <Row k="Mumbai ↔ Singapore round trip" v="~60 ms" />
            <Row k="Mumbai ↔ US East round trip" v="~200 ms" />
          </dl>
          <p className="text-xs text-dim mt-2">Orders of magnitude for reasoning, not SLAs; measure your own system.</p>
        </Sheet>

        <Sheet title="Pattern → use case" className="md:col-span-2">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-dim border-b border-[var(--color-rail)]">
                <th scope="col" className="py-2 pr-4 font-normal">Pattern</th>
                <th scope="col" className="py-2 pr-4 font-normal">Reach for it when</th>
                <th scope="col" className="py-2 pr-4 font-normal">Watch out for</th>
                <th scope="col" className="py-2 font-normal">Lesson</th>
              </tr>
            </thead>
            <tbody className="text-chalk align-top">
              {PATTERNS.map(([p, u, w, id]) => {
                const topic = topicsById.get(id)
                return (
                  <tr key={p} className="border-b border-[var(--color-rail)] last:border-0">
                    <th scope="row" className="py-2 pr-4 font-display font-semibold">{p}</th>
                    <td className="py-2 pr-4 text-[#d6d0c2]">{u}</td>
                    <td className="py-2 pr-4 text-dim">{w}</td>
                    <td className="py-2">
                      {topic && (
                        <Link className="text-[var(--color-amber)] underline-offset-2 hover:underline" to={`/topic/${topic.slug}`}>
                          {topic.title}
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Sheet>

        <Sheet title="Sources" className="md:col-span-2">
          <ul className="text-sm space-y-1.5">
            {SOURCES.map(([title, url]) => (
              <li key={url}>
                <a className="text-chalk underline underline-offset-2 hover:text-[var(--color-amber)]" href={url} target="_blank" rel="noreferrer">{title}</a>
              </li>
            ))}
          </ul>
        </Sheet>
      </div>
    </div>
  )
}
