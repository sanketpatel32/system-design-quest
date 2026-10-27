import { useState } from 'react'

/** Plain-text squares for the shared message (chat apps render these); the page itself draws real squares */
const RIGHT = '\u{1F7E9}', MISS = '\u{1F7E5}'

function shareText(title: string, results: boolean[], origin: string) {
  const grid = results.map((r) => (r ? RIGHT : MISS)).join('')
  const n = results.filter(Boolean).length
  return `System Design Quest · ${title}\n${grid} ${n}/${results.length}\n${origin}`
}

/** Share a spoiler-free result card: the green/red grid, the score and a link. Phones get the share sheet; elsewhere it copies. */
export function ShareResult({ title, results, path = '/' }: { title: string; results: boolean[]; path?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const text = shareText(title, results, `${window.location.origin}${path}`)
  const share = async () => {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    if (coarse && typeof navigator.share === 'function') {
      try { await navigator.share({ text }); return } catch { /* cancelled: fall through to copy */ }
    }
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      setState('failed')
    }
    window.setTimeout(() => setState('idle'), 2400)
  }
  return (
    <div className="flex flex-col items-center gap-2" data-testid="share">
      <p className="share-grid" role="img" aria-label={`${results.filter(Boolean).length} of ${results.length} correct`}>
        {results.map((r, i) => <span key={i} className={r ? 'share-sq share-sq-ok' : 'share-sq share-sq-miss'} />)}
      </p>
      <button type="button" className="btn-quiet min-w-[220px]" onClick={() => void share()} data-testid="share-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="mr-2 inline"><path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Share result
      </button>
      <p className="min-h-[1.25rem] text-sm font-extrabold text-hero-deep" role="status" data-testid="share-status">
        {state === 'copied' ? 'Copied. Paste it anywhere.' : state === 'failed' ? 'Could not copy here. Try a screenshot.' : ''}
      </p>
    </div>
  )
}
