export function CheatSheetPage() {
  return (
    <div className="space-y-6 prose prose-invert max-w-none">
      <h1 className="text-3xl text-cyan-200">Numbers & Patterns Cheat Sheet</h1>
      <section className="rounded-xl border border-slate-700 p-4">
        <h2 className="text-xl font-semibold">Time & throughput</h2>
        <ul className="text-slate-300 text-sm space-y-1 list-disc pl-5">
          <li><strong>Exact:</strong> 1 day = 86,400 s</li>
          <li><strong>Approx (interview):</strong> 1 day ≈ 10<sup>5</sup> s</li>
          <li><strong>Exact:</strong> 1M requests/day ÷ 86,400 ≈ 11.57 QPS</li>
          <li><strong>Approx:</strong> 1M requests/day ≈ 12 QPS average (use 10<sup>5</sup> denominator)</li>
          <li>Peak QPS ≈ average × peak factor (often 3–10× for India lunch/IPL spikes)</li>
        </ul>
      </section>
      <section className="rounded-xl border border-slate-700 p-4">
        <h2 className="text-xl font-semibold">Storage units</h2>
        <ul className="text-slate-300 text-sm space-y-1 list-disc pl-5">
          <li>Decimal (SI): KB=10³, MB=10⁶, GB=10⁹</li>
          <li>Binary: KiB=2¹⁰, MiB=2²⁰, GiB=2³⁰ — say which you mean in interviews</li>
          <li>1 byte = 8 bits</li>
        </ul>
      </section>
      <section className="rounded-xl border border-slate-700 p-4">
        <h2 className="text-xl font-semibold">Availability math</h2>
        <p className="text-sm text-slate-300">99.9% ≈ 8.76 h downtime/year. Serial dependencies multiply failure; parallel redundancy improves availability if independent.</p>
      </section>
      <section className="rounded-xl border border-slate-700 p-4">
        <h2 className="text-xl font-semibold">Illustrative latencies (not SLAs)</h2>
        <ul className="text-slate-300 text-sm list-disc pl-5">
          <li>L1 cache ~1 ns · SSD read ~100 µs · cross-region RTT ~100–300 ms</li>
        </ul>
      </section>
      <section className="rounded-xl border border-slate-700 p-4">
        <h2 className="text-xl font-semibold">Pattern → use case</h2>
        <table className="w-full text-sm text-left">
          <thead><tr className="text-slate-400"><th>Pattern</th><th>Use when</th></tr></thead>
          <tbody className="text-slate-300">
            <tr><td>Cache-aside</td><td>Read-heavy, tolerate staleness</td></tr>
            <tr><td>Queue + workers</td><td>Spiky writes, async side effects</td></tr>
            <tr><td>Sharding</td><td>Single-node storage saturated</td></tr>
            <tr><td>CDN</td><td>Static/media nationwide (Hotstar, Flipkart images)</td></tr>
            <tr><td>Idempotency keys</td><td>Payment retries (UPI)</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}
