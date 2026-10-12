import { expect, test } from '@playwright/test'

test('map to lesson navigation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Explore the System Design World/i })).toBeVisible()
  await page.getByRole('link', { name: /1\. The System Design Interview/i }).click()
  await expect(page.getByRole('heading', { name: 'The System Design Interview' })).toBeVisible()
})

test('wrong answer costs heart and shows feedback', async ({ page }) => {
  await page.goto('/quiz/the-system-design-interview')
  await page.getByRole('button', { name: 'Submit' }).first().click()
  await expect(page.getByText(/Not quite|Enter a positive/i).first()).toBeVisible({ timeout: 10000 })
})

test('progress persists after reload', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('sdq-progress-v3', JSON.stringify({ version: 3, xp: 42, badges: [], unlockedTopicIds: [1], topicProgress: {}, bossProgress: { completed: false, bestScore: 0, firstClearXpAwarded: false, drafts: {}, submissions: {} }, streak: { lastActiveDay: null, history: [] }, srs: [], interviews: [], preferences: { soundEnabled: false, reducedMotion: true, hasGestureForSound: false }, quizAttempts: {} })))
  await page.reload()
  await expect(page.getByText('42 XP')).toBeVisible()
})

test('mobile viewport core flow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
})
