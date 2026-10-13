import { expect, test } from '@playwright/test'

test('record product demo', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/s/system-design')
  await page.waitForTimeout(4500)
  await page.getByTestId('help-shortcuts-trigger').click()
  await page.waitForTimeout(2000)
  await page.keyboard.press('Escape')
  await page.getByTestId('station-1').click()
  await page.getByTestId('start-topic').click()
  await page.waitForTimeout(3000)
  await page.getByRole('button', { name: /Next card/i }).click()
  await page.waitForTimeout(2500)
  await page.getByRole('button', { name: /Next card/i }).click()
  await page.waitForTimeout(2500)
  await page.getByRole('link', { name: /Quiz/i }).click()
  await page.waitForTimeout(2500)
  await page.keyboard.press('2')
  await page.getByRole('button', { name: 'Submit' }).first().click()
  await page.waitForTimeout(3500)
  await page.goto('/revision')
  await page.waitForTimeout(3000)
  await page.goto('/cheat-sheet')
  await page.waitForTimeout(3000)
  await page.getByRole('link', { name: 'Interview' }).click()
  await page.getByRole('button', { name: 'Start mock' }).click()
  await page.waitForTimeout(6000)
  await page.goto('/s/system-design')
  await page.waitForTimeout(2500)
  await page.evaluate(() => {
    localStorage.setItem(
      'sdq-progress-v3',
      JSON.stringify({
        version: 3,
        xp: 100,
        badges: ['first_steps'],
        unlockedTopicIds: [1, 2, 74, 75],
        topicProgress: { 1: { completed: true, bestScorePercent: 83, attempts: 1, firstClearXpAwarded: true } },
        bossProgress: { completed: false, bestScore: 0, firstClearXpAwarded: false, drafts: {}, submissions: {} },
        streak: { lastActiveDay: '2026-10-12', history: ['2026-10-12'] },
        srs: [],
        interviews: [],
        preferences: { soundEnabled: false, reducedMotion: true, hasGestureForSound: false },
        quizAttempts: {},
      }),
    )
  })
  await page.reload()
  await page.waitForTimeout(3000)
  await page.goto('/boss/url-shortener')
  await page.waitForTimeout(3000)
  await page.getByRole('button', { name: '+ Client' }).click()
  await page.getByRole('button', { name: '+ Load Balancer' }).click()
  await page.getByRole('button', { name: '+ Service' }).click()
  await page.getByRole('button', { name: '+ SQL DB' }).click()
  await page.waitForTimeout(5000)
  await page.getByRole('button', { name: 'Submit boss attempt' }).click()
  await page.waitForTimeout(5000)
  await page.getByText(/Score:/i).scrollIntoViewIfNeeded()
  await page.waitForTimeout(10000)
  await page.goto('/s/system-design')
  await page.waitForTimeout(8000)
  await expect(page.getByRole('link', { name: /System Design Quest/ })).toBeVisible()
})
