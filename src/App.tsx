import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
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

function AppRoutes() {
  const hydrate = useGameStore((s) => s.hydrate)
  const hydrated = useGameStore((s) => s.hydrated)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!hydrated) {
    return <div className="p-8 text-slate-400" role="status">Loading your quest progress…</div>
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
      <Route path="*" element={<div className="text-slate-400">Page not found. <a href="/">Map</a></div>} />
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
