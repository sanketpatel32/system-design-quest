import { Link } from 'react-router-dom'
import { regions, orderedTopicsInRegion } from '../content/catalog'
import { getUnlockHint, topicStatus } from '../lib/progression/unlocks'
import { useGameStore } from '../stores/gameStore'

const themeBorder: Record<string, string> = {
  cyan: 'border-cyan-400/40 hover:border-cyan-300',
  violet: 'border-violet-400/40 hover:border-violet-300',
  amber: 'border-amber-400/40 hover:border-amber-300',
  sky: 'border-sky-400/40 hover:border-sky-300',
  emerald: 'border-emerald-400/40 hover:border-emerald-300',
  orange: 'border-orange-400/40 hover:border-orange-300',
  rose: 'border-rose-400/40 hover:border-rose-300',
  indigo: 'border-indigo-400/40 hover:border-indigo-300',
  fuchsia: 'border-fuchsia-400/40 hover:border-fuchsia-300',
  red: 'border-red-400/40 hover:border-red-300',
  lime: 'border-lime-400/40 hover:border-lime-300',
}

export function WorldMap() {
  const unlocked = useGameStore((s) => s.unlockedTopicIds)
  const topicProgress = useGameStore((s) => s.topicProgress)
  const quizAttempts = useGameStore((s) => s.quizAttempts)
  const completed = new Set(
    Object.entries(topicProgress)
      .filter(([, v]) => v.completed)
      .map(([id]) => Number(id)),
  )

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-cyan-200">Explore the System Design World</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">
          Clear topics in order to unlock the next stop. Finish Launchpad to enter the Boss Arena.
          Interview Mode is always open for timed mocks.
        </p>
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        {regions.map((region) => {
          const topics = orderedTopicsInRegion(region.id)
          const cleared = topics.filter((t) => completed.has(t.id)).length
          return (
            <article
              key={region.id}
              className={`rounded-2xl border bg-[#121a2f]/80 p-4 ${themeBorder[region.theme] ?? 'border-slate-600'}`}
            >
              <header className="mb-3">
                <h2 className="text-xl font-semibold">{region.name}</h2>
                <p className="text-sm text-slate-400">{region.subtitle}</p>
                <p className="text-xs text-slate-500 mt-1">{cleared}/{topics.length} cleared</p>
              </header>
              <ol className="space-y-2 max-h-64 overflow-auto pr-1">
                {topics.map((topic) => {
                  const inProgress = Boolean(
                    quizAttempts[`topic-${topic.id}`] && !topicProgress[topic.id]?.completed,
                  )
                  const status = topicStatus(topic, unlocked, completed, inProgress)
                  const locked = status === 'locked'
                  return (
                    <li key={topic.id}>
                      {locked ? (
                        <div className="text-sm px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-500" title={getUnlockHint(topic.id, completed)}>
                          <span className="mr-2">🔒</span>
                          {topic.id}. {topic.title}
                          <div className="text-xs mt-1 text-slate-500">{getUnlockHint(topic.id, completed)}</div>
                        </div>
                      ) : (
                        <Link
                          to={`/topic/${topic.slug}`}
                          className={`block text-sm px-3 py-2 rounded-lg border transition ${
                            status === 'completed'
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                              : status === 'in_progress'
                                ? 'border-amber-400/40 bg-amber-500/10'
                                : 'border-slate-600 bg-slate-900/40 hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="mr-2">
                            {status === 'completed' ? '✅' : status === 'in_progress' ? '⚡' : topic.kind === 'boss' ? '👹' : '📘'}
                          </span>
                          {topic.id}. {topic.title}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ol>
            </article>
          )
        })}
      </div>
    </div>
  )
}
