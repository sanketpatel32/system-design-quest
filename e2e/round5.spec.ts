import { expect, test, type Page } from '@playwright/test'
import { seed } from './helpers'

type T = { id: number; slug: string; title: string; questions: { id: string; type: string; rationaleConflicts?: Record<string, string> }[] }
const topics = async (page: Page) => (await (await page.request.get('/src/content/generated/topics.json')).json()) as T[]
const kolkataDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const setPractice = (page: Page, v: Record<string, unknown>) =>
  page.evaluate((v) => localStorage.setItem('sdq-practice-v1', JSON.stringify({ goal: 10, days: {}, mistakes: [], last: null, welcomeDone: true, goalCelebrated: null, ...v })), v)

test('first visit: welcome card, goal picker and a 3-question warm-up with a shareable result', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  const welcome = page.getByTestId('welcome')
  await expect(welcome).toBeVisible()
  await page.getByTestId('goal-5').click()
  await expect(page.getByTestId('goal-5')).toHaveAttribute('aria-pressed', 'true')
  await page.getByTestId('welcome-try').click()
  await expect(page).toHaveURL(/\/play\?warmup=1/)
  await expect(page.getByText(/^Warm-up · from/)).toBeVisible()
  await expect(page.getByTestId('play-mix')).toHaveCount(0)
  for (let i = 0; i < 3; i++) {
    await page.getByRole('radio').first().waitFor()
    await page.keyboard.press('1')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('feedback-sheet')).toBeVisible()
    await page.keyboard.press('Enter')
  }
  await expect(page.getByTestId('play-result')).toContainText('/3 correct')
  await expect(page.getByTestId('warmup-next')).toBeVisible()
  await page.getByTestId('share-btn').click()
  await expect(page.getByTestId('share-status')).toContainText('Copied')
  const clip = await page.evaluate(() => navigator.clipboard.readText())
  expect(clip).toMatch(/System Design Quest · Warm-up\n[🟩🟥]{3} \d\/3\n/u)

  // Back home: the welcome is gone, today's goal shows 3 of 5, and quick play kept the streak alive
  await page.goto('/')
  await expect(welcome).toHaveCount(0)
  await expect(page.getByTestId('today-count')).toHaveText('3 of 5 today')
  await expect(page.getByTestId('home-continue')).toBeVisible()
  await expect(page.getByTestId('hud-streak')).toContainText('1')
})

test('welcome is optional: "Not now" hides it and nothing is locked', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('welcome-dismiss').click()
  await expect(page.getByTestId('welcome')).toHaveCount(0)
  await expect(page.getByTestId('today')).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('welcome')).toHaveCount(0)
  await expect(page.getByTestId('section-card-system-design')).toBeVisible()
})

test('home Continue opens the topic you were last in, and the map agrees', async ({ page }) => {
  const all = await topics(page)
  const t = all.find((x) => x.slug === 'where-to-cache')!
  await seed(page)
  await page.goto(`/topic/${t.slug}`)
  await expect(page.locator('h1').first()).toBeVisible()
  await page.goto('/')
  await expect(page.getByTestId('home-continue')).toContainText(t.title)
  await expect(page.getByTestId('home-continue-link')).toHaveAttribute('href', `/topic/${t.slug}`)
  await page.goto('/s/system-design')
  await expect(page.getByTestId('continue-quest')).toContainText(t.title)
})

test('missed questions come back on a later day and can be retired from Review', async ({ page }) => {
  const all = await topics(page)
  const t = all.find((x) => x.id === 1)!
  await seed(page)
  await setPractice(page, { mistakes: [{ topicId: 1, questionId: t.questions[0]!.id, dueAt: new Date(Date.now() - 60_000).toISOString(), step: 0, misses: 1 }] })
  await page.goto('/')
  await expect(page.getByTestId('today-review')).toContainText('1 missed question')
  // Missed questions span every section, so the title says so even with a section picked
  await page.goto('/revision?s=system-design&mode=missed')
  await expect(page.getByTestId('mode-missed')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Missed questions: all sections')
  await page.getByTestId('mode-cards').click()
  await expect(page.getByRole('heading', { level: 1 })).not.toContainText('all sections')
  await page.getByTestId('mode-missed').click()
  await expect(page.getByTestId('missed-review')).toContainText('You missed this before')
  await page.getByRole('radio').first().check()
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('feedback-sheet')).toBeVisible()
  await page.getByTestId('feedback-sheet').getByRole('button', { name: 'Finish' }).click()
  await expect(page.getByTestId('missed-empty')).toBeVisible()
  // Answered (right or wrong) it is no longer due today
  const dueAt = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq-practice-v1')!).mistakes[0]?.dueAt ?? null)
  expect(dueAt === null || new Date(dueAt).getTime() > Date.now()).toBe(true)
})

test('reaching the daily goal shows a small, non-blocking cheer', async ({ page }) => {
  await page.goto('/')
  await setPractice(page, { goal: 5, days: { [kolkataDay()]: 4 } })
  // The warm-up is multiple choice only, so "1" always picks an answer
  await page.goto('/play?warmup=1')
  await page.getByRole('radio').first().check()
  const submit = page.getByRole('button', { name: 'Submit' })
  await submit.click()
  await expect(page.getByTestId('goal-toast')).toContainText('Daily goal reached')
  await expect(page.getByTestId('feedback-sheet')).toBeVisible()
})

test('tradeoff feedback can explain why every other reason fails', async ({ page }) => {
  const all = await topics(page)
  const t = all.find((x) => x.questions.some((q) => q.type === 'tradeoff' && q.rationaleConflicts && Object.keys(q.rationaleConflicts).length))!
  const n = t.questions.findIndex((q) => q.type === 'tradeoff' && q.rationaleConflicts)
  await seed(page, { extra: { unlockedTopicIds: [1, t.id] } })
  await page.goto(`/quiz/${t.slug}`)
  await page.getByRole('button', { name: new RegExp(`^Question ${n + 1}\\b`) }).click()
  await page.getByRole('radio').first().check()
  await page.getByRole('checkbox').first().check()
  await page.getByRole('button', { name: 'Submit' }).click()
  const why = page.getByTestId('why-others')
  await expect(why).toBeVisible()
  await why.locator('summary').click()
  await expect(why.locator('li').first()).toBeVisible()
})

test('Settings sets or turns off the daily goal', async ({ page }) => {
  await page.goto('/settings')
  await page.getByTestId('settings-goal').getByTestId('goal-20').click()
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('sdq-practice-v1', JSON.stringify({ ...JSON.parse(localStorage.getItem('sdq-practice-v1')!), welcomeDone: true })))
  await page.reload()
  await expect(page.getByTestId('today-count')).toHaveText('0 of 20 today')
  await page.goto('/settings')
  await page.getByTestId('goal-0').click()
  await page.goto('/')
  await expect(page.getByTestId('today-count')).toHaveText('0 answered today')
})
