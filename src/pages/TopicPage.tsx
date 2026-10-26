import { Link, useParams } from 'react-router-dom'
import type { Topic } from '../content/types'
import { SECTION_BY_ID, sectionOfTopic, sectionPath } from '../content/sections'
import { topicLabel } from '../content/numbering'
import { allTopics, regions, topicsById } from '../content/catalog'
import { LessonDeck } from '../components/LessonDeck'
import { DeepLessonView } from '../components/DeepLessonView'
import { BossDeepView } from '../components/BossDeepView'
import { regionPalette, transitLineColor } from '../lib/design/transitTheme'
import { Mascot } from '../components/art/Mascot'
import { IconCheck } from '../components/icons/HudIcons'
import { suggestionHint } from '../lib/progression/unlocks'
import { readingMinutes } from '../lib/fun/fun'
import { completedTopicIds, useGameStore } from '../stores/gameStore'

export function TopicPage() {
  const { slug } = useParams()
  const topic = allTopics.find((t) => t.slug === slug)
  const state = useGameStore()
  const recordLessonCard = useGameStore((s) => s.recordLessonCard)
  const completed = completedTopicIds(state)
  const accent = topic ? transitLineColor(topic.region) : 'var(--color-amber)'
  /** Reverse index: section topics whose seeAlso points at this System Design lesson */
  const deeperIn = topic
    ? allTopics.flatMap((t) => (t.seeAlso ?? []).filter((x) => x.topicId === topic.id && !(topic.seeAlso ?? []).some((y) => y.topicId === t.id)).map((x) => ({ t, why: x.why })))
    : []

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

  const hint = completed.has(topic.id) ? '' : suggestionHint(topic.id, completed)

  const pal = regionPalette(topic.region)
  const regionName = topic.region === 'boss-arena' ? 'Boss fights' : regions.find((r) => r.id === topic.region)?.track === 'fundamentals' ? 'Fundamentals' : regions.find((r) => r.id === topic.region)?.name ?? ''
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
        <header className="unit-banner flex items-center gap-4 p-4 sm:p-5" style={{ background: pal.deep, ['--banner-shadow' as string]: pal.shadow }}>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[1.75rem] sm:text-4xl text-white mt-1 leading-tight" data-testid="topic-title">{topic.title}</h1>
            <p className="text-sm font-extrabold text-white">
              {regionName} · {topicLabel(topic.id)} · <span data-testid="reading-time">{readingMinutes(topic)} min read</span>
            </p>
            {topic.objectives.length > 0 && (
              <>
                {/* Phones: goals fold away so the first card is on the first screen */}
                <details className="lesson-goals mt-1 text-white sm:hidden" data-testid="lesson-goals">
                  <summary className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-extrabold">
                    What you'll learn · {topic.objectives.length}
                  </summary>
                  <Objectives items={topic.objectives} />
                  {hint && <p className="mt-2 text-sm font-bold text-white" data-testid="suggestion-hint-phone">{hint}</p>}
                </details>
                <div className="hidden sm:block"><Objectives items={topic.objectives} /></div>
              </>
            )}
          </div>
        </header>
        {hint && (
          <p className={`panel items-center gap-2 px-4 ${topic.objectives.length > 0 ? 'hidden sm:flex' : 'flex'} py-2.5 text-sm font-bold text-dim`} data-testid="suggestion-hint">
            <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: pal.bright }} />
            {hint}
          </p>
        )}
        <LessonDeck
          key={topic.id}
          cards={topic.cards}
          interactive={topic.interactive}
          accent={accent}
          finalAction={finalAction}
          recap
          skipAction={
            <Link to={topic.kind === 'boss' ? `/boss/${topic.slug}` : `/quiz/${topic.slug}`} className="inline-flex min-h-[44px] items-center gap-1 text-sm font-extrabold text-teal hover:underline" data-testid="skip-to-quiz">
              {topic.kind === 'boss' ? 'Skip to boss fight' : 'Skip to quiz'}
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          }
          initialIndex={completed.has(topic.id) ? 0 : (state.lessonProgress[topic.id]?.card ?? 0)}
          onIndexChange={(i) => recordLessonCard(topic.id, i, topic.cards.length + (topic.interactive ? 1 : 0))}
        />
        {topic.deep && <DeepLessonView deep={topic.deep} accent={accent} topicId={topic.id} numbersInCards={topic.cards.some((c) => c.source === 'deep-numbers')} />}
        {topic.bossDeep && <BossDeepView brief={topic.bossDeep} accent={accent} topicId={topic.id} />}
        <div className="flex flex-wrap gap-2">
          <Link to={topic ? sectionPath(sectionOfTopic(topic.id)) : '/'} className="btn-quiet">Back to map</Link>
        </div>
      </div>
      <aside className="panel p-5 space-y-5 lg:sticky lg:top-24">
        {prereqLinks.length > 0 && (
          <div>
            <h2 className="font-display text-lg text-chalk mb-2">Helps to know first</h2>
            <ul className="space-y-1" data-testid="helps-first">
              {prereqLinks.map((p) => (
                <li key={p!.id} className="flex items-center gap-2">
                  {completed.has(p!.id) ? <IconCheck size={16} color="var(--color-hero-deep)" /> : <span aria-hidden className="ml-1 mr-0.5 h-2 w-2 shrink-0 rounded-full bg-rail" />}
                  <Link className="font-bold text-teal hover:underline" to={`/topic/${p!.slug}`}>{p!.title}</Link>
                  {completed.has(p!.id) && <span className="sr-only">(cleared)</span>}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs font-bold text-dim">Optional. Everything is open.</p>
          </div>
        )}
        {topic.seeAlso?.length ? (
          <div data-testid="see-also">
            <h2 className="font-display text-lg text-chalk mb-2">See also</h2>
            <ul className="space-y-2 text-sm">
              {topic.seeAlso.map((s) => {
                const t = topicsById.get(s.topicId)
                return t ? <RelatedLink key={s.topicId} t={t} why={s.why} done={completed.has(t.id)} /> : null
              })}
            </ul>
          </div>
        ) : null}
        {deeperIn.length ? (
          <div data-testid="deeper-in-sections">
            <h2 className="font-display text-lg text-chalk mb-2">Go deeper in other sections</h2>
            <ul className="space-y-2 text-sm">
              {deeperIn.map(({ t, why }) => (
                <RelatedLink key={t.id} t={t} why={why} done={completed.has(t.id)} />
              ))}
            </ul>
          </div>
        ) : null}
        <div>
          <h2 className="font-display text-lg text-chalk mb-2">Further reading</h2>
          <ul className="space-y-2 text-sm font-bold">
            {topic.sources.map((s) => (
              <li key={s.url}>
                <a className="text-teal hover:text-[var(--color-teal)] underline-offset-2 hover:underline" href={s.url} target="_blank" rel="noreferrer">
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

/** A related-lesson link that names its section and ticks lessons already cleared */
function RelatedLink({ t, why, done }: { t: Topic; why: string; done: boolean }) {
  return (
    <li data-testid={`related-${t.id}`} data-done={done ? 'true' : 'false'}>
      <span className="block text-xs font-extrabold text-dim">{SECTION_BY_ID.get(sectionOfTopic(t.id))?.name}</span>
      <Link className="font-bold text-teal hover:underline" to={`/topic/${t.slug}`}>{t.title}</Link>
      {done && (
        <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-right-wash px-1.5 py-0.5 align-middle text-xs font-bold text-chalk">
          <IconCheck size={12} color="var(--color-hero-deep)" /> Cleared
        </span>
      )}
      <span className="block text-dim">{why}</span>
    </li>
  )
}

function Objectives({ items }: { items: string[] }) {
  return (
    <ul className="mt-1 space-y-1 font-bold text-white max-w-xl sm:mt-3">
      {items.map((o) => (
        <li key={o} className="flex gap-2">
          <span aria-hidden className="mt-[0.55em] h-2 w-2 shrink-0 rounded-full bg-white" />
          {o}
        </li>
      ))}
    </ul>
  )
}
