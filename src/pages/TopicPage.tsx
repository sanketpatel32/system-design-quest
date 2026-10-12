import { Link, useParams } from 'react-router-dom'
import { allTopics, topicsById } from '../content/catalog'
import { LessonDeck } from '../components/LessonDeck'
import { getUnlockHint, topicStatus } from '../lib/progression/unlocks'
import { completedTopicIds, useGameStore } from '../stores/gameStore'

export function TopicPage() {
  const { slug } = useParams()
  const topic = allTopics.find((t) => t.slug === slug)
  const state = useGameStore()
  const completed = completedTopicIds(state)

  if (!topic) {
    return (
      <div>
        <h1 className="text-xl text-rose-300">Topic not found</h1>
        <Link to="/" className="text-cyan-300">Back to map</Link>
      </div>
    )
  }

  const status = topicStatus(topic, state.unlockedTopicIds, completed, false)
  if (status === 'locked') {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl">{topic.title}</h1>
        <p className="text-slate-400">{getUnlockHint(topic.id, completed)}</p>
        <Link to="/" className="text-cyan-300">Return to map</Link>
      </div>
    )
  }

  const prereqLinks = (topic.boss?.prerequisiteTopicIds ?? topic.prereqIds)
    .map((id) => topicsById.get(id))
    .filter(Boolean)

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Topic {topic.id}</p>
        <h1 className="text-3xl font-bold text-cyan-100">{topic.title}</h1>
        <p className="text-slate-400 mt-2">{topic.objectives.join(' · ')}</p>
        {prereqLinks.length > 0 && (
          <p className="text-sm text-amber-200/90 mt-2">
            Recommended prereqs:{' '}
            {prereqLinks.map((p) => (
              <Link key={p!.id} className="underline mx-1" to={`/topic/${p!.slug}`}>{p!.title}</Link>
            ))}
          </p>
        )}
      </header>
      <LessonDeck cards={topic.cards} />
      <div className="flex flex-wrap gap-3">
        {topic.kind === 'boss' ? (
          <Link to={`/boss/${topic.slug}`} className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/50">
            Enter Boss Fight
          </Link>
        ) : (
          <Link to={`/quiz/${topic.slug}`} className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/50">
            Start Quiz (3 ❤️)
          </Link>
        )}
        <Link to="/" className="px-4 py-2 rounded-lg border border-slate-600">Map</Link>
      </div>
      <section>
        <h2 className="text-lg font-semibold mb-2">Sources</h2>
        <ul className="text-sm text-slate-400 space-y-1">
          {topic.sources.map((s) => (
            <li key={s.url}><a className="text-cyan-300 hover:underline" href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>
          ))}
        </ul>
      </section>
    </div>
  )
}
