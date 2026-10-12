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

function NotFound() {
  return (
    <div className="max-w-lg py-10">
      <p className="text-sm font-semibold text-[var(--color-fault)]">Signal failure</p>
      <h1 className="font-display text-4xl font-extrabold text-chalk mt-1">This station is not on the map</h1>
      <p className="text-[15px] text-dim mt-2">The link may be old or mistyped. Every topic is reachable from the network map.</p>
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
      <div className="flex items-center gap-3 p-8 text-dim" role="status">
        <span className="h-3 w-3 rounded-full border-2 border-[var(--color-amber)] motion-safe:animate-pulse" aria-hidden />
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
