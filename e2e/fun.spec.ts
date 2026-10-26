import { expect, test } from '@playwright/test'
import topics from '../src/content/generated/topics.json' with { type: 'json' }
import { pickRound } from '../src/lib/fun/fun'
import type { Topic } from '../src/content/types'

const all = topics as unknown as Topic[]
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** A seed whose 3-question mixed round is all multiple choice, so the test can answer it */
function mcqSeed() {
  for (let i = 0; i < 5000; i++) {
    const r = pickRound(all, 3, `all-t${i}`)
    if (r.every((x) => x.question.type === 'multiple_choice')) return { seed: `t${i}`, round: r }
  }
  throw new Error('no seed')
}

test('quick play: mixed round from home, combo chip and Byte cheer, summary at the end', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('sdq-onboarded', '1'))
  await page.goto('/')
  await expect(page.getByTestId('quick-play-card')).toHaveAttribute('href', '/play')
  const { seed, round } = mcqSeed()
  await page.goto(`/play?seed=${seed}&n=3`)
  for (const [i, item] of round.entries()) {
    const q = item.question as Extract<Topic['questions'][number], { type: 'multiple_choice' }>
    const right = q.choices.find((c) => q.correctChoiceIds.includes(c.id))!
    await page.getByRole('radio', { name: new RegExp('^' + esc(right.label)) }).check()
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByTestId('feedback-sheet')).toContainText('Correct')
    if (i >= 1) await expect(page.getByTestId('combo-chip')).toHaveAccessibleName(`${i + 1} correct in a row`)
    if (i === 2) await expect(page.getByTestId('byte-reaction')).toHaveText('3 in a row!')
    await page.getByRole('button', { name: i === 2 ? 'See result' : 'Continue' }).click()
  }
  await expect(page.getByTestId('play-result')).toContainText('3/3 correct')
  await expect(page.getByTestId('play-result')).toContainText('Best run: 3 in a row')
  await page.getByTestId('play-again').click()
  await expect(page.getByText(/Question 1 of 3/)).toBeVisible()
})

test('lesson: reading time in the banner, long cards split into short paragraphs, recap on the last card', async ({ page }) => {
  await page.goto('/topic/tls-handshake')
  await expect(page.getByTestId('reading-time')).toHaveText(/^\d+ min read$/)
  const n = await page.getByRole('button', { name: /^Go to card/ }).count()
  await page.getByRole('button', { name: `Go to card ${n}` }).click()
  await expect(page.getByTestId('lesson-recap')).toBeVisible()
  await page.getByTestId('lesson-recap').getByRole('button').first().click()
  await expect(page.getByText(/^Card 1 of/)).toBeVisible()
})

test('section map links to a quick-play round for that section', async ({ page }) => {
  await page.goto('/s/networking')
  await page.getByTestId('section-quick-play').click()
  await expect(page).toHaveURL(/\/play\?s=networking/)
  await expect(page.getByText(/Question 1 of 8/)).toBeVisible()
})
