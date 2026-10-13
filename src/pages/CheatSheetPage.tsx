import type { ReactNode } from 'react'
import { PageHero } from '../components/ui/PageHero'
import { Link, useSearchParams } from 'react-router-dom'
import { SECTION_BY_ID, isSectionId, sectionPalette, sectionTopics, type SectionId } from '../content/sections'
import { SectionPicker } from '../components/map/SectionPicker'
import { topicLabel } from '../content/numbering'
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
    <section className={`panel min-w-0 p-5 ${className}`} aria-labelledby={`cs-${title}`}>
      <h2 id={`cs-${title}`} className="font-display text-xl text-chalk mb-3">{title}</h2>
      {children}
    </section>
  )
}

function Row({ k, v, approx }: { k: ReactNode; v: ReactNode; approx?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b-2 border-[#F1EDE6] py-2 last:border-0 text-[0.9375rem]">
      <dt className="min-w-0 text-dim font-bold">{k}</dt>
      <dd className={`ml-auto tabular-nums text-right ${approx ? 'text-[#8350C7] font-extrabold' : 'text-chalk font-semibold'}`}>{v}</dd>
    </div>
  )
}

/** Non-System-Design sections: one card per topic, built from each lesson's takeaways */
function SectionSheet({ id }: { id: SectionId }) {
  const s = SECTION_BY_ID.get(id)!
  const pal = sectionPalette(id)
  const topics = sectionTopics(id).filter((t) => t.deep?.takeaways?.length)
  return (
    <div className="space-y-5">
      <PageHero eyebrow="Reference card" title={`${s.name} cheat sheet`} icon="cheat" tone="purple">
        The key takeaways from every {s.name} lesson on one page. Open a lesson for the reasoning and sources.
      </PageHero>
      <SectionPicker current={id} label="Cheat sheet by section" to={(x) => (x === 'system-design' || x === 'all' ? '/cheat-sheet' : `/cheat-sheet?s=${x}`)} />
      <div className="grid gap-4 md:grid-cols-2" data-testid={`cheat-${id}`}>
        {topics.map((t) => (
          <section key={t.id} className="panel min-w-0 p-5" style={{ borderTop: `4px solid ${pal.bright}` }}>
            <h2 className="font-display text-lg text-chalk mb-2">
              <Link to={`/topic/${t.slug}`} className="hover:underline"><span style={{ color: pal.deep }}>{topicLabel(t.id)}</span> {t.title}</Link>
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-[0.9375rem] text-chalk">
              {t.deep!.takeaways.map((k) => <li key={k}>{k}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

export function CheatSheetPage() {
  const [params] = useSearchParams()
  const sp = params.get('s') ?? undefined
  if (isSectionId(sp) && sp !== 'system-design') return <SectionSheet id={sp} />
  return (
    <div className="space-y-5">
      <PageHero eyebrow="Reference card" title="Numbers and patterns" icon="cheat" tone="purple">
        Exact values in plain text, interview shortcuts highlighted. Say which one you are using out loud.
      </PageHero>
      <SectionPicker current="system-design" label="Cheat sheet by section" to={(x) => (x === 'system-design' || x === 'all' ? '/cheat-sheet' : `/cheat-sheet?s=${x}`)} />

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
          <table className="block w-full text-[0.9375rem] text-left md:table">
            <thead className="hidden md:table-header-group">
              <tr className="text-dim border-b border-[var(--color-rail)]">
                <th scope="col" className="py-2 pr-4 font-normal">Pattern</th>
                <th scope="col" className="py-2 pr-4 font-normal">Reach for it when</th>
                <th scope="col" className="py-2 pr-4 font-normal">Watch out for</th>
                <th scope="col" className="py-2 font-normal">Lesson</th>
              </tr>
            </thead>
            <tbody className="block text-chalk align-top md:table-row-group">
              {PATTERNS.map(([p, u, w, id]) => {
                const topic = topicsById.get(id)
                return (
                  <tr key={p} className="block border-b-2 border-[#F1EDE6] py-2 last:border-0 md:table-row md:py-0">
                    <th scope="row" className="block py-0.5 pr-4 font-display md:table-cell md:py-2">{p}</th>
                    <td className="block py-0.5 pr-4 font-bold text-chalk md:table-cell md:py-2">{u}</td>
                    <td className="block py-0.5 pr-4 text-dim md:table-cell md:py-2">{w}</td>
                    <td className="block py-0.5 md:table-cell md:py-2">
                      {topic && (
                        <Link className="font-bold text-[#12749f] underline-offset-2 hover:underline" to={`/topic/${topic.slug}`}>
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
                <a className="text-chalk underline underline-offset-2 hover:text-[#12749f] font-bold" href={url} target="_blank" rel="noreferrer">{title}</a>
              </li>
            ))}
          </ul>
        </Sheet>
      </div>
    </div>
  )
}
