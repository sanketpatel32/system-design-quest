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
  await page.goto('/')
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
  await page.goto('/')
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
  await expect(page.getByTestId('see-all-bosses')).toHaveText('See all 40 bosses')
})

test('bug 5: one numbering scheme and consistent lock messages', async ({ page }) => {
  await seed(page)
  await expect(page.getByText(/79 lessons in 10 units, the Interview Playbook, then 40 boss fights/)).toBeVisible()
  await page.goto('/topic/interview-playbook')
  await expect(page.getByText(/^Clear Unit 1 \(finish Lesson 3/)).toBeVisible()
  await page.goto('/topic/pastebin')
  await expect(page.getByText('Locked · Boss 2 of 40')).toBeVisible()
  await expect(page.getByText('Defeat Boss 1 (URL Shortener) to unlock Boss 2.')).toBeVisible()
  await page.goto('/topic/back-of-envelope-estimation')
  await expect(page.getByText(/Clear Lesson 1 \(The System Design Interview\) to unlock Lesson 2\./)).toBeVisible()
})
