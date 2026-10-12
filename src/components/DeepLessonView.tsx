import type { DeepLesson } from '../content/types'

/** "Go deeper" material under the card deck: collapsible cards, callouts and a comparison table. */
export function DeepLessonView({ deep, accent }: { deep: DeepLesson; accent: string }) {
  return (
    <section aria-labelledby="deep-title" className="space-y-3" style={{ ['--accent' as string]: accent }}>
      <h2 id="deep-title" className="font-display text-2xl text-chalk">Go deeper</h2>

      <details className="deep-card" open>
        <summary>How it works</summary>
        <div className="deep-body">
          <p className="font-extrabold text-chalk">{deep.mechanism.title}</p>
          <ol className="deep-steps">
            {deep.mechanism.steps.map((s, i) => (
              <li key={i}>
                <span className="deep-step-n" aria-hidden>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          {deep.diagram && (
            <pre className="deep-diagram" aria-label="Diagram">{deep.diagram}</pre>
          )}
        </div>
      </details>

      <details className="deep-card">
        <summary>When to use it, and when not to</summary>
        <div className="deep-body grid gap-4 sm:grid-cols-2">
          <div>
            <p className="deep-label text-[#2f7d00]">Use it when</p>
            <ul className="deep-list deep-list-yes">{deep.useWhen.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div>
            <p className="deep-label text-[#c0392b]">Avoid it when</p>
            <ul className="deep-list deep-list-no">{deep.avoidWhen.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        </div>
      </details>

      <details className="deep-card">
        <summary>Trade-offs at a glance</summary>
        <div className="deep-body overflow-x-auto">
          <table className="deep-table">
            <thead>
              <tr>{deep.tradeoffs.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
            </thead>
            <tbody>
              {deep.tradeoffs.rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="deep-card" open>
        <summary>Do the maths</summary>
        <div className="deep-body">
          <div className="deep-callout deep-callout-maths">
            <p className="font-extrabold text-chalk">{deep.numbers.title}</p>
            <p className="deep-label mt-2">Assumptions</p>
            <ul className="deep-list">{deep.numbers.assumptions.map((s) => <li key={s}>{s}</li>)}</ul>
            <p className="deep-label mt-2">Working</p>
            <ol className="deep-maths">{deep.numbers.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <p className="mt-2 font-extrabold text-chalk">→ {deep.numbers.result}</p>
          </div>
        </div>
      </details>

      <details className="deep-card">
        <summary>India example: {deep.india.title}</summary>
        <div className="deep-body">
          <div className="deep-callout deep-callout-india">
            <span className="deep-badge">{deep.india.label}</span>
            <p className="mt-2 text-chalk">{deep.india.body}</p>
          </div>
        </div>
      </details>

      <details className="deep-card">
        <summary>Interview pitfalls</summary>
        <div className="deep-body space-y-3">
          {deep.pitfalls.map((p) => (
            <div key={p.trap} className="deep-pitfall">
              <p><span className="deep-label text-[#c0392b]">Trap</span> {p.trap}</p>
              <p className="mt-1"><span className="deep-label text-[#2f7d00]">Say instead</span> {p.say}</p>
            </div>
          ))}
        </div>
      </details>

      <div className="deep-takeaways">
        <p className="font-display text-lg text-chalk">Key takeaways</p>
        <ul className="deep-list deep-list-yes mt-1">{deep.takeaways.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>
    </section>
  )
}
