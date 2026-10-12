import { Link, useParams } from 'react-router-dom'
import { allTopics, regions, topicsById } from '../content/catalog'
import { LessonDeck } from '../components/LessonDeck'
import { transitLineColor } from '../lib/design/transitTheme'
import { getUnlockHint, topicStatus } from '../lib/progression/unlocks'
import { completedTopicIds, useGameStore } from '../stores/gameStore'

export function TopicPage() {
  const { slug } = useParams()
  const topic = allTopics.find((t) => t.slug === slug)
  const state = useGameStore()
  const completed = completedTopicIds(state)
  const accent = topic ? transitLineColor(topic.region) : 'var(--color-amber)'

  if (!topic) {
    return (
      <div>
        <h1 className="font-display text-xl text-rose-400">Topic not found</h1>
        <Link to="/" className="text-[var(--color-teal)] text-sm">Back to map</Link>
      </div>
    )
  }

  const status = topicStatus(topic, state.unlockedTopicIds, completed, false)
  if (status === 'locked') {
    return (
      <div className="max-w-lg space-y-3 panel-slab p-5">
        <h1 className="font-display text-2xl font-bold">{topic.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">{getUnlockHint(topic.id, completed)}</p>
        <Link to="/" className="text-[var(--color-teal)] text-sm font-semibold">Return to map</Link>
      </div>
    )
  }

  const regionName = regions.find((r) => r.id === topic.region)?.subtitle ?? ''
  const finalAction =
    topic.kind === 'boss' ? (
      <Link to={`/boss/${topic.slug}`} className="btn-cta">Enter the boss fight</Link>
    ) : (
      <Link to={`/quiz/${topic.slug}`} className="btn-cta">Take the quiz · 3 hearts</Link>
    )

  const prereqLinks = (topic.boss?.prerequisiteTopicIds ?? topic.prereqIds)
    .map((id) => topicsById.get(id))
    .filter(Boolean)

  return (
    <div className="grid lg:grid-cols-[1fr_220px] gap-6 items-start">
      <div className="space-y-5 min-w-0">
        <header>
          <p className="text-sm font-semibold flex items-center gap-2" style={{ color: accent }}>
            <span className="inline-block h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: accent }} aria-hidden />
            {regionName} · topic {topic.id}
          </p>
          <h1 className="font-display text-4xl font-extrabold text-chalk mt-2 leading-tight" data-testid="topic-title">{topic.title}</h1>
          {topic.objectives.length > 0 && (
            <ul className="mt-3 space-y-1 text-[15px] text-dim max-w-xl">
              {topic.objectives.map((o) => (
                <li key={o} className="flex gap-2">
                  <span aria-hidden className="mt-[0.6em] h-px w-3 shrink-0" style={{ background: accent }} />
                  {o}
                </li>
              ))}
            </ul>
          )}
        </header>
        <LessonDeck cards={topic.cards} accent={accent} finalAction={finalAction} />
        <div className="flex flex-wrap gap-2">
          {topic.kind === 'boss' ? (
            <Link to={`/boss/${topic.slug}`} className="btn-quiet" style={{ borderColor: 'var(--color-fault)', color: 'var(--color-fault)' }}>
              Skip to boss fight
            </Link>
          ) : (
            <Link to={`/quiz/${topic.slug}`} className="btn-quiet">
              Skip to quiz
            </Link>
          )}
          <Link to="/" className="btn-quiet">Back to map</Link>
        </div>
      </div>
      <aside className="panel-slab p-4 text-sm space-y-4 lg:sticky lg:top-24">
        {prereqLinks.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-chalk mb-2">Ride these lines first</h2>
            <ul className="space-y-1">
              {prereqLinks.map((p) => (
                <li key={p!.id}>
                  <Link className="text-[var(--color-teal)] hover:underline" to={`/topic/${p!.slug}`}>{p!.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h2 className="text-sm font-semibold text-chalk mb-2">Further reading</h2>
          <ul className="space-y-2 text-xs text-[var(--color-muted)]">
            {topic.sources.map((s) => (
              <li key={s.url}>
                <a className="text-[#cbd5e1] hover:text-[var(--color-teal)] underline-offset-2 hover:underline" href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
