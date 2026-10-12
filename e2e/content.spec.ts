import { expect, test } from '@playwright/test'
import { seed } from './helpers'

test('one interview framework: lesson 1 and Interview mode both use the six stages with API', async ({ page }) => {
  await seed(page)
  await page.goto('/topic/the-system-design-interview')
  await page.getByRole('button', { name: 'Go to card 3' }).click()
  const flow = page.getByRole('list', { name: 'Steps' })
  await expect(flow.getByRole('listitem')).toHaveCount(6)
  await expect(flow).toContainText('API · 10–15 min')
  await page.goto('/interview')
  await expect(page.getByText('API', { exact: true }).first()).toBeAttached()
})
