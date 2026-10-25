import { expect, test } from '@playwright/test'
import { seed } from './helpers'

const QUIZ = '/quiz/the-system-design-interview'

test('bug 1: See result never crashes and a pass saves automatically', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await seed(page, { answeredTopic1: true })
  await page.goto(QUIZ)
  // Saved without any "Claim progress" step, even after a reload
  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Claim progress' })).toHaveCount(0)
  await page.getByRole('button', { name: /^Question 6/ }).click()
  await page.getByRole('button', { name: 'See result' }).click()
  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible()
  expect(errors).toEqual([])
  await page.goto('/s/system-design')
  await expect(page.getByTestId('station-2')).toHaveAttribute('data-status', 'available')
})

test('bug 2: an untouched order question cannot be submitted or cost a heart', async ({ page }) => {
  await seed(page)
  await page.goto(QUIZ)
  await page.getByRole('button', { name: /^Question 2/ }).click()
  const submit = page.getByRole('button', { name: 'Submit' })
  await expect(submit).toBeDisabled()
  await expect(page.getByText('Move at least one step to set your order.')).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('feedback-sheet')).toHaveCount(0)
  await expect(page.getByLabel('3 of 3 hearts remaining').first()).toBeVisible()
  await page.getByRole('button', { name: /Move .* down/ }).first().click()
  await expect(submit).toBeEnabled()
})

test('bug 3: a finished quiz can be retaken for practice', async ({ page }) => {
  await seed(page, { answeredTopic1: true })
  await page.goto(QUIZ)
  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Total XP')).toBeVisible()
  await expect(page.getByText(/^Saved$/)).toBeVisible()
  await page.getByTestId('practice-again').click()
  await expect(page.getByText(/Question 1 of 6/)).toBeVisible()
  // Progress stays saved
  await page.goto('/s/system-design')
  await expect(page.getByTestId('station-1')).toHaveAttribute('data-status', 'completed')
})

test('bug 6: a number key then Enter shows feedback instead of skipping it', async ({ page }) => {
  await seed(page)
  await page.goto(QUIZ)
  await expect(page.getByTestId('shortcut-hint')).toBeVisible()
  await page.keyboard.press('1')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('feedback-sheet')).toBeVisible()
  await expect(page.getByText(/Question 1 of 6/)).toBeVisible()
})

test('quiz opened directly offers the lesson first; shortcut hint only on multiple choice', async ({ page }) => {
  await seed(page)
  await page.goto(QUIZ)
  await expect(page.getByTestId('lesson-first').getByRole('link', { name: 'Read the lesson' })).toHaveAttribute('href', '/topic/the-system-design-interview')
  await page.getByRole('button', { name: /^Question 2/ }).click()
  await expect(page.getByTestId('shortcut-hint')).toHaveCount(0)
})

test('bug 4: "See all bosses" scrolls to the full boss list on the map', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await seed(page)
  await page.getByTestId('see-all-bosses').click()
  await expect(page.locator('#arena')).toBeInViewport()
  await expect(page.getByTestId('boss-node-114')).toBeAttached()
  await expect(page.getByTestId('see-all-bosses')).toHaveText(/40 bosses/)
})

test('bug 5: one numbering scheme and consistent lock messages', async ({ page }) => {
  await seed(page)
  await expect(page.getByText(/87 lessons cleared in 10 units · practice track/)).toBeVisible()
  await page.goto('/topic/interview-playbook')
  await expect(page.getByText(/^Clear Unit 1 \(finish Lesson 4/)).toBeVisible()
  await page.goto('/topic/pastebin')
  await expect(page.getByText('Locked · Boss 2 of 40')).toBeVisible()
  await expect(page.getByText('Defeat Boss 1 (URL Shortener) to unlock Boss 2.')).toBeVisible()
  await page.goto('/topic/back-of-envelope-estimation')
  await expect(page.getByText(/Clear Lesson 1 \(The System Design Interview\) to unlock Lesson 2\./)).toBeVisible()
})

test('review: Again brings the card back in the same session', async ({ page }) => {
  await seed(page)
  await page.goto('/revision')
  const front = page.locator('.panel p.font-display').first()
  const first = (await front.textContent())!
  await page.getByRole('button', { name: 'Show answer' }).click()
  await expect(page.getByRole('button', { name: /^Again/ })).toContainText('in 10 min')
  await page.getByRole('button', { name: /^Again/ }).click()
  await expect(page.getByRole('status')).toContainText('comes back at the end of this session')
  let seenAgain = false
  for (let i = 0; i < 30; i++) {
    if ((await front.textContent()) === first) { seenAgain = true; break }
    await page.getByRole('button', { name: 'Show answer' }).click()
    await page.getByRole('button', { name: /^Good/ }).click()
  }
  expect(seenAgain).toBe(true)
})

test('interview: brief stays visible, canvas reachable, no badge for an empty finish, scenario-specific reference', async ({ page }) => {
  await seed(page)
  await page.goto('/interview')
  await page.getByRole('button', { name: 'Start mock' }).click()
  await expect(page.getByTestId('interview-brief')).toBeVisible()
  await expect(page.getByTestId('interview-brief')).toContainText('Create short link')
  await page.getByTestId('open-canvas').click()
  await expect(page.getByRole('button', { name: '+ Client' })).toBeVisible()
  await page.getByRole('button', { name: 'Finish early' }).click()
  await expect(page.getByTestId('no-badge-note')).toBeVisible()
  await expect(page.getByText(/^Canvas:/)).toHaveCount(0)
  const ref = page.getByTestId('reference-solution')
  await expect(ref).toContainText('POST /v1/links')
  await expect(ref).not.toContainText('/v1/items')
  const badges = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq-progress-v3') || '{}').badges ?? [])
  expect(badges).toEqual([])
})

test('visual: on a 2560px screen the Submit bar is centred on the question column', async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1400 })
  await seed(page)
  await page.goto(QUIZ)
  const col = await page.getByText(/Question 1 of 6/).boundingBox()
  const bar = await page.locator('.quizbar > div').boundingBox()
  const prompt = await page.locator('main .max-w-3xl').first().boundingBox()
  expect(col && bar && prompt).toBeTruthy()
  expect(Math.abs(bar!.x + bar!.width / 2 - (prompt!.x + prompt!.width / 2))).toBeLessThan(24)
  // UI scales up on very wide screens
  expect(await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))).toBeGreaterThan(16)
})

test('visual: phone lesson has no sideways scrolling and powers render as superscripts', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/topic/back-of-envelope-estimation?unlockAll=1')
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => ((d as HTMLDetailsElement).open = true)))
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await expect(page.getByText(/10⁵/).first()).toBeAttached()
  await expect(page.getByText(/10\^5/)).toHaveCount(0)
})
