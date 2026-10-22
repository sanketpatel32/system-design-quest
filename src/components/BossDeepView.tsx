import type { BossDeep } from '../content/types'
import { DiagramFigure } from './DiagramFigure'
import { SectionNav } from './SectionNav'

/** Boss study brief: requirements, capacity maths, reference architecture, deep dives and a rubric hint. */
export function BossDeepView({ brief, accent, topicId }: { brief: BossDeep; accent: string; topicId: number }) {
  const r = brief.requirements
  return (
    <section aria-labelledby="boss-brief-title" className="space-y-3" style={{ ['--accent' as string]: accent }}>
      <h2 id="boss-brief-title" className="font-display text-2xl text-chalk">Study brief</h2>
      <SectionNav sections={[{ id: 'brief-requirements', label: 'Requirements' }, { id: 'brief-capacity-maths', label: 'Capacity maths' }, { id: 'brief-reference-architecture', label: 'Reference architecture' }, { id: 'brief-deep-dives', label: 'Deep dives' }]} />
      <p className="text-chalk">{brief.pitch}</p>

      <details id="brief-requirements" className="deep-card" open>
        <summary>Requirements</summary>
        <div className="deep-body grid gap-4 sm:grid-cols-3">
          <div>
            <p className="deep-label text-hero-deep">Functional</p>
            <ul className="deep-list deep-list-yes">{r.functional.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div>
            <p className="deep-label">Non-functional</p>
            <ul className="deep-list">{r.nonFunctional.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div>
            <p className="deep-label text-wrong-text">Out of scope</p>
            <ul className="deep-list deep-list-no">{r.outOfScope.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        </div>
      </details>

      <details id="brief-capacity-maths" className="deep-card" open>
        <summary>Capacity maths</summary>
        <div className="deep-body">
          <div className="deep-callout deep-callout-maths">
            <p className="deep-label">Assumptions</p>
            <ul className="deep-list">{brief.capacity.assumptions.map((s) => <li key={s}>{s}</li>)}</ul>
            <p className="deep-label mt-2">Working</p>
            <ol className="deep-maths">{brief.capacity.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <p className="mt-2 font-extrabold text-chalk">→ {brief.capacity.result}</p>
          </div>
        </div>
      </details>

      <details id="brief-reference-architecture" className="deep-card" open>
        <summary>Reference architecture</summary>
        <div className="deep-body">
          <ol className="deep-steps">
            {brief.architecture.steps.map((s, i) => (
              <li key={i}>
                <span className="deep-step-n" aria-hidden>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <DiagramFigure topicId={topicId} ascii={brief.architecture.diagram} label="Reference architecture" />
        </div>
      </details>

      <details id="brief-deep-dives" className="deep-card">
        <summary>Deep dives</summary>
        <div className="deep-body space-y-3">
          {brief.deepDives.map((d) => (
            <div key={d.title} className="deep-pitfall">
              <p className="font-extrabold text-chalk">{d.title}</p>
              <p className="mt-1">{d.body}</p>
            </div>
          ))}
        </div>
      </details>

      <div className="deep-takeaways">
        <p className="font-display text-lg text-chalk">Rubric hint: a strong answer…</p>
        <ul className="deep-list deep-list-yes mt-1">{brief.rubric.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>
    </section>
  )
}
