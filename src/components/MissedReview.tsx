import { useState } from 'react'
import { Link } from 'react-router-dom'
import { topicsById } from '../content/catalog'
import { QuestionRenderer } from './QuestionRenderer'
import { Mascot } from './art/Mascot'
import { byteReaction } from '../lib/fun/fun'
import { MISTAKE_STEPS, dueMistakes, recordAnswer, usePractice, type Mistake } from '../lib/fun/practice'
import { useGameStore } from '../stores/gameStore'

const resolve = (m: Mistake) => {
  const topic = topicsById.get(m.topicId)
  const question = topic?.questions.find((q) => q.id === m.questionId)
  return topic && question ? { m, topic, question } : null
}

/** Questions the learner got wrong before, asked again on later days. Right twice more and they retire. */
export function MissedReview() {
  const p = usePractice()
  const markActive = useGameStore((s) => s.markActive)
  // Snapshot the queue: answering moves an item out of "due", but its feedback should stay on screen
  const [queue] = useState(() => dueMistakes(p).map(resolve).filter((x): x is NonNullable<ReturnType<typeof resolve>> => Boolean(x)))
  const [i, setI] = useState(0)
  const [right, setRight] = useState(0)
  const [reaction, setReaction] = useState('')
  const [seed] = useState(() => Math.random().toString(36).slice(2))
  const [now] = useState(() => Date.now())
  const later = p.mistakes.filter((m) => new Date(m.dueAt).getTime() > now)
  const nextDue = later.map((m) => m.dueAt).sort()[0]

  if (i >= queue.length) {
    return (
      <div className="panel p-8 text-center" data-testid="missed-empty">
        <Mascot mood="happy" size={120} className="mx-auto" />
        <p className="font-display text-2xl text-chalk mt-2">{queue.length ? `${right} of ${queue.length} right this time` : 'No missed questions due'}</p>
        <p className="font-bold text-dim mt-1">
          {queue.length ? 'Right answers come back less often; misses come back tomorrow. ' : 'Questions you miss in quizzes and quick play come back here on later days. '}
          {nextDue ? `${later.length} waiting; the next is due ${new Date(nextDue).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}.` : ''}
        </p>
        <Link to="/play" className="btn-quiet mt-4">Quick play</Link>
      </div>
    )
  }
  const cur = queue[i]!
  return (
    <div data-testid="missed-review">
      <p className="mb-2 text-sm font-extrabold text-dim">
        You missed this before · from <Link to={`/topic/${cur.topic.slug}`} className="text-teal hover:underline">{cur.topic.title}</Link>
        {' · '}{cur.m.step + 1} of {MISTAKE_STEPS.length} to retire it
      </p>
      <QuestionRenderer
        key={`${cur.question.id}-${i}`}
        scrambleSeed={seed}
        question={cur.question}
        number={i + 1}
        total={queue.length}
        sheet={{ onContinue: () => { setI((x) => x + 1); setReaction('') }, continueLabel: i === queue.length - 1 ? 'Finish' : 'Next', reaction }}
        onSubmit={(_, r) => {
          recordAnswer(cur.topic.id, cur.question.id, r.correct)
          markActive()
          if (r.correct) setRight((n) => n + 1)
          setReaction(byteReaction(r.correct, r.correct ? 1 : 0, `${cur.question.id}-${seed}`))
        }}
      />
    </div>
  )
}
