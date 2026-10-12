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
