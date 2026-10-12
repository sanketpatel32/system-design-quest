/** "On this page" chips: jump to a section of the lesson and open it if it is collapsed. */
export function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const go = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    if (el instanceof HTMLDetailsElement) el.open = true
    el.scrollIntoView({ block: 'start' })
    el.querySelector('summary')?.focus({ preventScroll: true })
  }
  return (
    <nav aria-label="On this page" className="section-nav">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="section-chip"
          onClick={(e) => {
            e.preventDefault()
            go(s.id)
            history.replaceState(null, '', `#${s.id}`)
          }}
        >
          {s.label}
        </a>
      ))}
    </nav>
  )
}
