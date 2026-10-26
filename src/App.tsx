import { useEffect, useLayoutEffect } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigationType, useParams, useSearchParams } from 'react-router-dom'
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
import { SectionsPage } from './pages/SectionsPage'
import { PlayPage } from './pages/PlayPage'
import { isSectionId, rememberSection } from './content/sections'

import { Mascot } from './components/art/Mascot'

function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <Mascot mood="sad" size={140} className="mx-auto" />
      <h1 className="font-display text-4xl text-chalk mt-1">This page is not on the map</h1>
      <p className="mt-2 text-sm font-extrabold text-[var(--color-fault)]">Page not found</p>
      <p className="font-bold text-dim mt-2">The link may be old or mistyped. Every topic is reachable from the map.</p>
      <Link to="/" className="btn-cta mt-5">Back to the map</Link>
    </div>
  )
}

/** A new page starts at the top (Back keeps the browser's restored position). Runs before the map's own scroll-to-node effect. */
function ScrollToTop() {
  const { pathname } = useLocation()
  const nav = useNavigationType()
  useLayoutEffect(() => {
    if (nav !== 'POP') window.scrollTo(0, 0)
  }, [pathname, nav])
  return null
}

/** /s/:section, one map per section */
function SectionMap() {
  const { section } = useParams()
  useEffect(() => { if (isSectionId(section)) rememberSection(section) }, [section])
  if (!isSectionId(section)) return <NotFound />
  return <WorldMap key={section} sectionId={section} />
}

/** Old links (/?track=fundamentals) still work: they open the first Fundamentals section */
function Home() {
  const [params] = useSearchParams()
  if (params.get('track') === 'fundamentals') return <Navigate to="/s/frontend" replace />
  return <SectionsPage />
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
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/s/:section" element={<SectionMap />} />
      <Route path="/topic/:slug" element={<TopicPage />} />
      <Route path="/quiz/:slug" element={<QuizPage />} />
      <Route path="/boss/:slug" element={<BossPage />} />
      <Route path="/play" element={<PlayPage />} />
      <Route path="/interview" element={<InterviewPage />} />
      <Route path="/revision" element={<RevisionPage />} />
      <Route path="/cheat-sheet" element={<CheatSheetPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
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
