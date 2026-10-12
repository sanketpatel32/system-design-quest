import { test } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const out = '/opt/cursor/artifacts/screenshots'

test('capture key screens', async ({ page }) => {
  mkdirSync(out, { recursive: true })
  await page.goto('/')
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${out}/01-world-map.png`, fullPage: true })

  await page.getByRole('link', { name: /The System Design Interview/i }).first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${out}/02-lesson-topic.png`, fullPage: true })

  await page.getByRole('link', { name: /Quiz/i }).click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/03-quiz.png`, fullPage: true })

  await page.goto('/interview')
  await page.getByRole('button', { name: 'Start mock' }).click()
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/04-interview.png`, fullPage: true })
})
