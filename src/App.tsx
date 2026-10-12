import { useEffect } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { WorldMap } from './components/WorldMap'
import { BossPage } from './pages/BossPage'
import { CheatSheetPage } from './pages/CheatSheetPage'
import { InterviewPage } from './pages/InterviewPage'
import { QuizPage } from './pages/QuizPage'
import { RevisionPage } from './pages/RevisionPage'
import { SettingsPage } from './pages/SettingsPage'
import { TopicPage } from './pages/TopicPage'
import { useGameStore } from './stores/gameStore'

import { Mascot } from './components/art/Mascot'

function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <Mascot mood="sad" size={140} className="mx-auto" />
      <p className="mt-2 text-sm font-extrabold uppercase tracking-wide text-[var(--color-fault)]">Page not found</p>
      <h1 className="font-display text-4xl text-chalk mt-1">This page is not on the map</h1>
      <p className="font-bold text-dim mt-2">The link may be old or mistyped. Every topic is reachable from the map.</p>
      <Link to="/" className="btn-cta mt-5">Back to the map</Link>
    </div>
  )
}

function AppRoutes() {
  const hydrate = useGameStore((s) => s.hydrate)
  const hydrated = useGameStore((s) => s.hydrated)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 font-extrabold text-dim" role="status">
        <Mascot size={110} className="anim-bob" />
        Loading your progress…
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<WorldMap />} />
      <Route path="/topic/:slug" element={<TopicPage />} />
      <Route path="/quiz/:slug" element={<QuizPage />} />
      <Route path="/boss/:slug" element={<BossPage />} />
      <Route path="/interview" element={<InterviewPage />} />
      <Route path="/revision" element={<RevisionPage />} />
      <Route path="/cheat-sheet" element={<CheatSheetPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <AppRoutes />
      </Layout>
    </BrowserRouter>
  )
}
