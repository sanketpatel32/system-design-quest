import type { ReactNode } from 'react'

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
            <Row k="1 day, for quick maths" v="≈ 10⁵ s" approx />
            <Row k="1M requests/day ÷ 86,400" v="≈ 11.57 QPS" />
            <Row k="1M requests/day, quick" v="≈ 12 QPS average" approx />
            <Row k="Peak QPS" v="average × peak factor" />
          </dl>
          <p className="text-xs text-dim mt-2">Peak factors of 3 to 10× are common for India lunch-hour and IPL spikes.</p>
        </Sheet>

        <Sheet title="Storage units">
          <dl>
            <Row k="Decimal (SI)" v="KB = 10³ · MB = 10⁶ · GB = 10⁹" />
            <Row k="Binary" v="KiB = 2¹⁰ · MiB = 2²⁰ · GiB = 2³⁰" />
            <Row k="1 byte" v="8 bits" />
          </dl>
          <p className="text-xs text-dim mt-2">Say which unit family you mean in interviews.</p>
        </Sheet>

        <Sheet title="Availability math">
          <dl>
            <Row k="99.9% uptime" v="≈ 8.76 h downtime/year" />
          </dl>
          <p className="text-sm text-[#d6d0c2] mt-3 leading-relaxed">
            Serial dependencies multiply failure. Parallel redundancy improves availability, but only if the copies fail independently.
          </p>
        </Sheet>

        <Sheet title="Illustrative latencies">
          <dl>
            <Row k="L1 cache read" v="~1 ns" />
            <Row k="SSD read" v="~100 µs" />
            <Row k="Cross-region round trip" v="~100–300 ms" />
          </dl>
          <p className="text-xs text-dim mt-2">Orders of magnitude, not SLAs.</p>
        </Sheet>

        <Sheet title="Pattern → use case" className="md:col-span-2">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-dim border-b border-[var(--color-rail)]">
                <th scope="col" className="py-2 pr-4 font-normal">Pattern</th>
                <th scope="col" className="py-2 font-normal">Reach for it when</th>
              </tr>
            </thead>
            <tbody className="text-chalk">
              {[
                ['Cache-aside', 'Read-heavy, tolerate staleness'],
                ['Queue + workers', 'Spiky writes, async side effects'],
                ['Sharding', 'Single-node storage saturated'],
                ['CDN', 'Static/media nationwide (Hotstar, Flipkart images)'],
                ['Idempotency keys', 'Payment retries (UPI)'],
              ].map(([p, u]) => (
                <tr key={p} className="border-b border-[var(--color-rail)] last:border-0">
                  <th scope="row" className="py-2 pr-4 font-display font-semibold">{p}</th>
                  <td className="py-2 text-[#d6d0c2]">{u}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Sheet>
      </div>
    </div>
  )
}
