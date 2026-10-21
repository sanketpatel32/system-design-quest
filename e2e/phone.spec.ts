import { expect, test } from '@playwright/test'

// Phone layout checks: focus mode, no sideways scrolling, comfortable tap targets
test.describe('phone layout', () => {
  test.use({ hasTouch: true })

  test('quiz runs in focus mode: no app header or tab bar on a phone, in portrait and landscape', async ({ page }) => {
    for (const [w, h] of [[390, 844], [740, 360]] as const) {
      await page.setViewportSize({ width: w, height: h })
      await page.goto('/quiz/the-system-design-interview?unlockAll=1')
      await expect(page.getByRole('button', { name: /^Question 1/ })).toBeVisible()
      await expect(page.getByTestId('app-header')).toBeHidden()
      await expect(page.locator('nav.tabbar')).toBeHidden()
      // The first answer option is on the first screen even sideways
      const first = page.locator('label.choice-row').first()
      await expect(first).toBeVisible()
      const box = await first.boundingBox()
      const bar = await page.locator('.quizbar').boundingBox()
      expect(box!.y + 20, `first option peeks above the submit bar at ${w}x${h}`).toBeLessThan(bar!.y)
    }
    await page.setViewportSize({ width: 1280, height: 900 })
    await expect(page.getByTestId('app-header')).toBeVisible()
  })
})
