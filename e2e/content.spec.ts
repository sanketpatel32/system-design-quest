import { expect, test } from '@playwright/test'
import { seed } from './helpers'

test('one interview framework: lesson 1 and Interview mode both use the six stages with API', async ({ page }) => {
  await seed(page)
  await page.goto('/topic/the-system-design-interview')
  for (let i = 1; i <= 6 && !(await page.getByRole('list', { name: 'Steps' }).count()); i++) await page.getByRole('button', { name: `Go to card ${i}`, exact: true }).click()
  const flow = page.getByRole('list', { name: 'Steps' })
  await expect(flow.getByRole('listitem')).toHaveCount(6)
  await expect(flow).toContainText('API · 10–15 min')
  await page.goto('/interview')
  await expect(page.getByText('API', { exact: true }).first()).toBeAttached()
})

test('lesson cards: specific headings, and card 2 is no longer a repeat of the intro', async ({ page }) => {
  await seed(page, { extra: { unlockedTopicIds: [1, 2, 16] } })
  for (const slug of ['back-of-envelope-estimation', 'cache-strategies']) {
    await page.goto(`/topic/${slug}`)
    const intro = (await page.locator('header ul li').first().innerText()).trim()
    const n = await page.getByRole('button', { name: /^Go to card/ }).count()
    for (let i = 1; i <= n; i++) {
      await page.getByRole('button', { name: `Go to card ${i}`, exact: true }).click()
      if (await page.getByTestId('interactive').count()) continue // the try-it card has its own checks
      const h = page.locator('.panel h3').first()
      await expect(h).not.toHaveText(/^(Key idea|The core idea|How a request flows|Watch out for|Common trap)$/)
      expect((await page.locator('.panel p.text-\\[1\\.125rem\\]').first().innerText()).trim()).not.toBe(intro)
    }
  }
  await page.goto('/topic/back-of-envelope-estimation')
  await page.getByRole('button', { name: 'Go to card 3', exact: true }).click()
  await expect(page.locator('.panel h3').first()).toHaveText(/^Worked example/)
  await expect(page.getByTestId('card-note')).toContainText('relatively modest under these assumptions')
})

test('numeric feedback: "Why" gives a sanity check, not the worked answer again', async ({ page }) => {
  await seed(page, { extra: { unlockedTopicIds: [1, 2] } })
  await page.goto('/quiz/back-of-envelope-estimation')
  await page.getByRole('button', { name: /^Question 2/ }).click()
  await page.getByRole('spinbutton').fill('23')
  await page.getByRole('button', { name: 'Submit' }).first().click()
  const sheet = page.getByTestId('feedback-sheet')
  await expect(sheet).toContainText('Why: Sanity check')
  await expect(sheet).not.toContainText('2B ÷ 86,400')
})
