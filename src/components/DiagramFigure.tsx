import diagrams from '../content/generated/diagrams.json'

type Entry = { alt: string; width: number; height: number }
const index = diagrams as Record<string, Entry>

export function hasDiagram(topicId: number): boolean {
  return Boolean(index[String(topicId)])
}

/**
 * Hand-drawn diagram (pre-rendered SVG, lazy-loaded) with the ASCII version kept as a text fallback.
 * The .excalidraw source can be downloaded and opened at excalidraw.com.
 */
export function DiagramFigure({ topicId, ascii, label }: { topicId: number; ascii?: string; label: string }) {
  const d = index[String(topicId)]
  if (!d) return ascii ? <pre className="deep-diagram" aria-label={label}>{ascii}</pre> : null
  return (
    <figure className="sketch-figure" data-testid="sketch-figure">
      <div className="sketch-frame">
        <img
          src={`/diagrams/${topicId}.svg`}
          alt={d.alt}
          width={d.width}
          height={d.height}
          loading="lazy"
          decoding="async"
          className="sketch-img"
          style={{ maxWidth: d.width, minWidth: Math.min(d.width, 560) }}
        />
      </div>
      <figcaption className="sketch-caption">
        <span>{label}</span>
        <a href={`/diagrams/${topicId}.excalidraw`} download={`sdq-${topicId}.excalidraw`} className="sketch-link">
          Download .excalidraw
        </a>
        <a href="https://excalidraw.com" target="_blank" rel="noreferrer" className="sketch-link">
          Open Excalidraw
        </a>
      </figcaption>
      {ascii && (
        <details className="sketch-ascii">
          <summary>Text version</summary>
          <pre className="deep-diagram">{ascii}</pre>
        </details>
      )}
    </figure>
  )
}
