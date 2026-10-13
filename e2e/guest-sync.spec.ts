import { expect, test } from '@playwright/test'
import { seed } from './helpers'

test('guests are unaffected by cloud save: no /api calls, no sync badge, progress stays local', async ({ page }) => {
  const apiCalls: string[] = []
  page.on('request', (r) => { if (new URL(r.url()).pathname.startsWith('/api/')) apiCalls.push(r.url()) })
  await seed(page)
  await page.goto('/topic/the-system-design-interview')
  await page.getByRole('button', { name: /^Go to card/ }).last().click()
  await page.goto('/s/system-design')
  await expect(page.getByTestId('continue-link')).toBeVisible()
  await expect(page.getByTestId('sync-status')).toHaveCount(0)
  await page.waitForTimeout(2500) // longer than the save debounce
  expect(apiCalls).toEqual([])
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq-progress-v3') || '{}'))
  expect(saved.lessonProgress?.['1']?.viewed).toBe(true)
})
