import { expect, test, type Page } from '@playwright/test'
import { seed } from './helpers'

async function lastCard(page: Page) {
  await page.getByRole('button', { name: 'Go to card 1', exact: true }).waitFor()
  const n = await page.getByRole('button', { name: /^Go to card/ }).count()
  await page.getByRole('button', { name: `Go to card ${n}`, exact: true }).click()
}

test('interactive slider: moving it changes the model output and the takeaway is shown', async ({ page }) => {
  await seed(page, { extra: { unlockedTopicIds: [1, 15] } })
  await page.goto('/topic/where-to-cache')
  await lastCard(page)
  const box = page.getByTestId('interactive')
  await expect(box).toHaveAttribute('data-kind', 'slider')
  const before = await box.innerText()
  await box.getByRole('slider').fill('95')
  await expect(page.getByTestId('interactive-value')).toContainText('95')
  expect(await box.innerText()).not.toBe(before)
  await expect(page.getByTestId('interactive-takeaway')).toBeVisible()
})

test('interactive predict: a choice reveals feedback and the explanation', async ({ page }) => {
  await seed(page, { extra: { unlockedTopicIds: [1, 17] } })
  await page.goto('/topic/eviction-policies')
  await lastCard(page)
  await expect(page.getByTestId('interactive')).toHaveAttribute('data-kind', 'predict')
  await page.getByTestId('interactive-choice-c').click()
  await expect(page.getByTestId('interactive-feedback')).toBeVisible()
  await page.getByRole('button', { name: 'Try again' }).click()
  await page.getByTestId('interactive-choice-a').click()
  await expect(page.getByTestId('interactive-feedback')).toBeVisible()
})

