import { chromium } from 'playwright'
const BASE = process.env.BASE || 'https://system-design-quest-phi.vercel.app'
const TAG = process.env.TAG || 'before'
const out = (n) => `/workspace/sdq-push-shots/fix-${TAG}-${n}.png`
const b = await chromium.launch()
async function seed(page, extra = {}) {
  await page.goto(BASE + '/')
  const topics = await (await fetch(BASE.includes('127.0.0.1') ? BASE + '/src/content/generated/topics.json' : 'http://127.0.0.1:43123/src/content/generated/topics.json')).json()
  const t = topics[0]
  const answers = {}, results = {}
  for (const q of t.questions) {
    answers[q.id] = q.type === 'multiple_choice' ? q.correctChoiceIds : q.type === 'drag_order' ? q.correctOrder : q.type === 'tradeoff' ? { approachId: q.correctApproachId, rationaleIds: q.correctRationaleIds } : q.type === 'spot_bottleneck' ? q.correctNodeIds : String(q.target)
    results[q.id] = true
  }
  await page.evaluate(([answers, results, extra]) => {
    localStorage.setItem('sdq-progress-v3', JSON.stringify({ version: 3, xp: 0, badges: [], unlockedTopicIds: [1], topicProgress: {}, bossProgress: { completed: false, bestScore: 0, firstClearXpAwarded: false, drafts: {}, submissions: {} }, streak: { lastActiveDay: null, history: [] }, srs: [], interviews: [], preferences: { soundEnabled: false, reducedMotion: true, hasGestureForSound: false }, quizAttempts: { 'topic-1': { hearts: 3, answers, results, completed: false } }, ...extra }))
  }, [answers, results, extra])
}
// 1. crash
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  await seed(p)
  await p.goto(BASE + '/quiz/the-system-design-interview')
  await p.waitForTimeout(800)
  await p.screenshot({ path: out('quiz-result-after-reload') })
  await p.getByRole('button', { name: /Question 6/ }).click()
  await p.getByRole('button', { name: 'See result' }).click()
  await p.waitForTimeout(800)
  await p.screenshot({ path: out('see-result') })
  console.log('see-result errors:', errs)
  await p.close()
}
for (const [w, h, name] of [[2560, 1400, 'wide2560'], [3800, 2000, 'wide3800']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await p.goto(BASE + '/'); await p.waitForTimeout(800); await p.screenshot({ path: out(name + '-map') })
  await p.goto(BASE + '/quiz/the-system-design-interview'); await p.waitForTimeout(800); await p.screenshot({ path: out(name + '-quiz') })
  await p.goto(BASE + '/topic/the-system-design-interview'); await p.waitForTimeout(800); await p.screenshot({ path: out(name + '-lesson') })
  await p.close()
}
{
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await p.goto(BASE + '/'); await p.waitForTimeout(800); await p.screenshot({ path: out('phone-map') })
  await p.goto(BASE + '/topic/back-of-envelope-estimation'); await p.waitForTimeout(800); await p.screenshot({ path: out('phone-lesson'), fullPage: true })
  await p.close()
}
await b.close()
