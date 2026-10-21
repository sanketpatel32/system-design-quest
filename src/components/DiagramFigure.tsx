import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import diagrams from '../content/generated/diagrams.json'

type Entry = { alt: string; width: number; height: number }
const index = diagrams as Record<string, Entry>

export function hasDiagram(topicId: number): boolean {
  return Boolean(index[String(topicId)])
}

/**
 * Hand-drawn diagram (pre-rendered SVG, lazy-loaded) with the ASCII version kept as a text fallback.
 * On phones the diagram fits the card width; tapping it opens a full-screen view that pans and pinch-zooms.
 * The .excalidraw source can be downloaded and opened at excalidraw.com.
 */
export function DiagramFigure({ topicId, ascii, label }: { topicId: number; ascii?: string; label: string }) {
  const d = index[String(topicId)]
  const [zoomed, setZoomed] = useState(false)
  if (!d) return ascii ? <pre className="deep-diagram" aria-label={label}>{ascii}</pre> : null
  const src = `/diagrams/${topicId}.svg`
  return (
    <figure className="sketch-figure" data-testid="sketch-figure">
      <div className="sketch-frame">
        <button type="button" className="sketch-zoom-btn" onClick={() => setZoomed(true)} aria-label={`Open the diagram full screen: ${label}`} data-testid="diagram-zoom">
          <img
            src={src}
            alt={d.alt}
            width={d.width}
            height={d.height}
            loading="lazy"
            decoding="async"
            className="sketch-img"
            style={{ maxWidth: d.width, '--sketch-min': `${Math.min(d.width, 560)}px` } as React.CSSProperties}
          />
          <span className="sketch-zoom-hint" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
            Zoom
          </span>
        </button>
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
      {zoomed && <DiagramViewer src={src} entry={d} label={label} onClose={() => setZoomed(false)} />}
    </figure>
  )
}

/** Full-screen diagram: opens zoomed in so the hand-drawn labels are readable (drag to pan, pinch to zoom); "Fit screen" shows the whole picture. */
function DiagramViewer({ src, entry, label, onClose }: { src: string; entry: Entry; label: string; onClose: () => void }) {
  const [actual, setActual] = useState(true)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      opener?.focus()
    }
  }, [onClose])
  return createPortal(
    <div className="diagram-viewer anim-pop" role="dialog" aria-modal="true" aria-label={label} data-testid="diagram-viewer">
      <div className="diagram-viewer-bar">
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate font-extrabold text-chalk">{label}</span>
          <span className="block truncate text-xs font-bold text-dim">{actual ? 'Drag to pan, pinch to zoom' : 'Whole diagram'}</span>
        </span>
        <button type="button" className="btn-quiet !min-h-[44px] !px-3 text-sm" onClick={() => setActual((v) => !v)} aria-pressed={actual}>
          {actual ? 'Fit screen' : 'Zoom in'}
        </button>
        <button ref={closeRef} type="button" className="diagram-viewer-close" onClick={onClose} aria-label="Close the diagram">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" /></svg>
        </button>
      </div>
      <div className="diagram-viewer-body" data-testid="diagram-viewer-body">
        <img src={src} alt={entry.alt} width={entry.width} height={entry.height} className={actual ? 'diagram-viewer-img-actual' : 'diagram-viewer-img-fit'}
          // Zoomed: big enough to read the hand-drawn labels, never past the drawing's own size
          style={actual ? { width: `min(${entry.width}px, max(100%, ${Math.round(entry.width * 0.6)}px))` } : undefined}
        />
      </div>
    </div>,
    document.body,
  )
}
