import { expect, test, type Page } from '@playwright/test'
import { seed } from './helpers'

const UNIT_FIRST: [number, string][] = [[1, 'the-system-design-interview'], [4, 'osi-tcp-ip'], [11, 'lb-algorithms'], [15, 'where-to-cache'], [21, 'sql-vs-nosql'], [36, 'message-queues'], [45, 'consensus-raft'], [50, 'monolith-vs-microservices'], [57, 'authn-vs-authz'], [115, 'clarifying-requirements']]

async function lastCard(page: Page) {
  await page.getByRole('button', { name: 'Go to card 1', exact: true }).waitFor()
  const n = await page.getByRole('button', { name: /^Go to card/ }).count()
  await page.getByRole('button', { name: `Go to card ${n}`, exact: true }).click()
}

test('sample units 1–10: first lesson opens with cards and a try-it, and its quiz loads', async ({ page }) => {
  await seed(page, { extra: { unlockedTopicIds: UNIT_FIRST.map(([id]) => id) } })
  for (const [, slug] of UNIT_FIRST) {
    await page.goto(`/topic/${slug}`)
    await expect(page.locator('h1').first()).toBeVisible()
    await lastCard(page)
    await expect(page.getByTestId('interactive'), slug).toBeVisible()
    await page.goto(`/quiz/${slug}`)
    await expect(page.getByRole('button', { name: /^Question 1/ }), slug).toBeVisible()
  }
})

const wrong = (n: number, hearts: number, done = 6) =>
  async (page: Page) => {
    const topics = (await (await page.request.get('/src/content/generated/topics.json')).json()) as { id: number; questions: { id: string }[] }[]
    const qs = topics.find((t) => t.id === 1)!.questions
    const results: Record<string, boolean> = {}
    qs.slice(0, done).forEach((q, i) => (results[q.id] = i >= n))
    return { quizAttempts: { 'topic-1': { hearts, answers: {}, results, completed: false } } }
  }

test('out of hearts is a nudge, not a lockout: the quiz carries on and can still be finished', async ({ page }) => {
  await page.goto('/s/system-design')
  await seed(page, { extra: await wrong(3, 0, 4)(page) })
  await page.goto('/quiz/the-system-design-interview')
  await expect(page.getByTestId('hearts-nudge')).toContainText('Out of hearts')
  await expect(page.getByRole('heading', { name: /correct, you need/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Question 5/ })).toHaveAttribute('aria-current', 'step')
  await page.getByTestId('hearts-nudge').getByRole('button', { name: 'Keep going' }).click()
  await expect(page.getByTestId('hearts-nudge')).toHaveCount(0)
  await page.getByRole('radio').first().check()
  // Trade-off questions also want at least one reason
  if (await page.getByRole('checkbox').count()) await page.getByRole('checkbox').first().check()
  await page.getByRole('button', { name: 'Submit' }).first().click()
  await expect(page.getByRole('button', { name: /^Question 5: (wrong|correct)/ })).toBeVisible()
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq-progress-v3')!))
  expect(Object.keys(st.quizAttempts['topic-1'].results ?? {})).toHaveLength(5)
  expect(st.quizAttempts['topic-1'].hearts).toBe(0)
})

test('failure recovery: failing below 70% shows "Not cleared yet", missed ideas, and a retry', async ({ page }) => {
  await page.goto('/s/system-design')
  await seed(page, { extra: await wrong(2, 1)(page) })
  await page.goto('/quiz/the-system-design-interview')
  await expect(page.getByText('Not cleared yet')).toBeVisible()
  await expect(page.getByRole('heading', { name: '4/6 correct, you need 5' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Review these ideas' })).toBeVisible()
  await page.getByRole('button', { name: 'Retry quiz' }).click()
  await expect(page.getByRole('button', { name: /^Question 1/ })).toBeVisible()
  await page.goto('/s/system-design')
  await expect(page.getByTestId('continue-link')).toBeVisible()
})

test.describe('mobile (390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })
  test('map, lesson with interactive, and quiz fit the screen', async ({ page }) => {
    await seed(page, { extra: { unlockedTopicIds: [1, 2] } })
    const noOverflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)
    await noOverflow()
    await expect(page.getByTestId('continue-link')).toBeVisible()
    await page.goto('/topic/back-of-envelope-estimation')
    await noOverflow()
    await lastCard(page)
    await expect(page.getByTestId('interactive')).toBeVisible()
    await noOverflow()
    await page.goto('/quiz/back-of-envelope-estimation')
    await expect(page.getByRole('button', { name: /^Question 1/ })).toBeVisible()
    await noOverflow()
  })
})
