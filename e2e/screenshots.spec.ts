import { test } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const out = process.env.SDQ_SHOTS_DIR ?? 'test-results/screenshots'

test('capture key screens', async ({ page }) => {
  mkdirSync(out, { recursive: true })
  await page.goto('/s/system-design')
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${out}/01-world-map.png`, fullPage: true })

  await page.getByTestId('station-1').click()
  await page.getByTestId('start-topic').click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${out}/02-lesson-topic.png`, fullPage: true })

  await page.getByTestId('skip-to-quiz').click()
  await page.waitForTimeout(500)
  await page.keyboard.press('2')
  await page.getByRole('button', { name: 'Submit' }).first().click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${out}/03-quiz-feedback.png`, fullPage: true })

  await page.goto('/s/system-design')
  await page.evaluate(() => {
    localStorage.setItem(
      'sdq-progress-v3',
      JSON.stringify({
        version: 3,
        xp: 80,
        badges: ['first_steps'],
        unlockedTopicIds: [1, 2, 74, 75],
        topicProgress: {},
        bossProgress: { completed: false, bestScore: 0, firstClearXpAwarded: false, drafts: {}, submissions: {} },
        streak: { lastActiveDay: null, history: [] },
        srs: [],
        interviews: [],
        preferences: { soundEnabled: false, reducedMotion: true, hasGestureForSound: false },
        quizAttempts: {},
      }),
    )
  })
  await page.reload()
  await page.goto('/boss/url-shortener')
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${out}/04-boss-canvas.png`, fullPage: true })
  await page.getByRole('button', { name: '+ Client' }).click()
  await page.getByRole('button', { name: '+ Load Balancer' }).click()
  await page.getByRole('button', { name: '+ Service' }).click()
  await page.getByRole('button', { name: '+ SQL DB' }).click()
  await page.getByRole('button', { name: 'Submit boss attempt' }).click()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${out}/05-boss-results.png`, fullPage: true })

  await page.goto('/interview')
  await page.getByRole('button', { name: 'Start mock' }).click()
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/06-interview.png`, fullPage: true })

  await page.goto('/revision')
  await page.waitForTimeout(500)
  if (await page.getByRole('button', { name: 'good' }).isVisible()) {
    await page.getByRole('button', { name: 'good' }).click()
    await page.waitForTimeout(300)
  }
  await page.screenshot({ path: `${out}/07-review.png`, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/s/system-design')
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${out}/08-mobile-map.png`, fullPage: true })
})
