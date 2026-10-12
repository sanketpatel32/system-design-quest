import { Link, useParams } from 'react-router-dom'
import { topicLabel } from '../content/numbering'
import { allTopics, regions, topicsById } from '../content/catalog'
import { LessonDeck } from '../components/LessonDeck'
import { DeepLessonView } from '../components/DeepLessonView'
import { BossDeepView } from '../components/BossDeepView'
import { regionPalette, transitLineColor } from '../lib/design/transitTheme'
import { RegionArt } from '../components/art/RegionArt'
import { Mascot } from '../components/art/Mascot'
import { IconLock } from '../components/icons/HudIcons'
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
      <div className="py-10 text-center">
        <Mascot mood="sad" size={130} className="mx-auto" />
        <h1 className="font-display text-3xl text-chalk mt-3">Topic not found</h1>
        <p className="font-bold text-dim mt-1">Byte looked everywhere. This lesson isn’t on the map.</p>
        <Link to="/" className="btn-cta mt-5">Back to the map</Link>
      </div>
    )
  }

  const status = topicStatus(topic, state.unlockedTopicIds, completed, false)
  if (status === 'locked') {
    return (
      <div className="mx-auto mt-6 max-w-lg space-y-3 panel p-6 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#E5E0D8] shadow-[0_6px_0_#CFC7BA]"><IconLock size={40} color="#8C8476" /></div>
        <p className="text-sm font-extrabold uppercase tracking-wide text-dim">Locked · {topicLabel(topic.id)}</p>
        <h1 className="font-display text-3xl text-chalk">{topic.title}</h1>
        <p className="font-bold text-chalk">{getUnlockHint(topic.id, completed)}</p>
        <Link to="/" className="btn-cta">Back to the map</Link>
      </div>
    )
  }

  const pal = regionPalette(topic.region)
  const regionName = regions.find((r) => r.id === topic.region)?.subtitle ?? ''
  const finalAction =
    topic.kind === 'boss' ? (
      <Link to={`/boss/${topic.slug}`} className="btn-cta flex-1 sm:flex-none">Enter the boss fight</Link>
    ) : (
      <Link to={`/quiz/${topic.slug}`} className="btn-cta flex-1 sm:flex-none">Take the quiz</Link>
    )

  const prereqLinks = (topic.boss?.prerequisiteTopicIds ?? topic.prereqIds)
    .map((id) => topicsById.get(id))
    .filter(Boolean)

  return (
    <div className="grid xl:grid-cols-[1fr_16.25rem] 2xl:grid-cols-[1fr_19rem] gap-6 items-start">
      <div className="space-y-5 min-w-0">
        <header className="unit-banner flex items-center gap-4 p-5 sm:p-6" style={{ background: pal.deep, ['--banner-shadow' as string]: pal.shadow }}>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold uppercase tracking-wider text-white">{regionName} · {topicLabel(topic.id)}</p>
            <h1 className="font-display text-3xl sm:text-4xl text-white mt-1 leading-tight" data-testid="topic-title">{topic.title}</h1>
            {topic.objectives.length > 0 && (
              <ul className="mt-3 space-y-1 font-bold text-white max-w-xl">
                {topic.objectives.map((o) => (
                  <li key={o} className="flex gap-2">
                    <span aria-hidden className="mt-[0.55em] h-2 w-2 shrink-0 rounded-full bg-white" />
                    {o}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <RegionArt regionId={topic.region} width={170} className="hidden shrink-0 sm:block" />
        </header>
        <LessonDeck cards={topic.cards} accent={accent} finalAction={finalAction} />
        {topic.deep && <DeepLessonView deep={topic.deep} accent={accent} topicId={topic.id} />}
        {topic.bossDeep && <BossDeepView brief={topic.bossDeep} accent={accent} topicId={topic.id} />}
        <div className="flex flex-wrap gap-2">
          {topic.kind === 'boss' ? (
            <Link to={`/boss/${topic.slug}`} className="btn-quiet">
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
      <aside className="panel p-5 space-y-5 lg:sticky lg:top-24">
        {prereqLinks.length > 0 && (
          <div>
            <h2 className="font-display text-lg text-chalk mb-2">Learn these first</h2>
            <ul className="space-y-1">
              {prereqLinks.map((p) => (
                <li key={p!.id}>
                  <Link className="font-bold text-[#12749f] hover:underline" to={`/topic/${p!.slug}`}>{p!.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h2 className="font-display text-lg text-chalk mb-2">Further reading</h2>
          <ul className="space-y-2 text-sm font-bold">
            {topic.sources.map((s) => (
              <li key={s.url}>
                <a className="text-[#12749f] hover:text-[var(--color-teal)] underline-offset-2 hover:underline" href={s.url} target="_blank" rel="noreferrer">
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
