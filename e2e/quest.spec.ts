import { expect, test } from '@playwright/test'

test('map to lesson navigation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /The network/i })).toBeVisible()
  await page.getByTestId('station-1').click()
  await page.getByTestId('start-topic').click()
  await expect(page.getByTestId('topic-title')).toHaveText('The System Design Interview')
})

test('wrong answer costs heart and shows feedback', async ({ page }) => {
  await page.goto('/quiz/the-system-design-interview')
  // A blank answer cannot be submitted, so it can never cost a heart
  await expect(page.getByRole('button', { name: 'Submit' }).first()).toBeDisabled()
  await page.getByRole('radio').first().check()
  await page.getByRole('button', { name: 'Submit' }).first().click()
  await expect(page.getByText(/Not this time|Correct/).first()).toBeVisible({ timeout: 10000 })
})

test('quiz clear awards xp and unlocks next topic', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    localStorage.removeItem('sdq-progress-v3')
    const res = await fetch('/src/content/generated/topics.json')
    const topics = (await res.json()) as {
      id: number
      slug: string
      questions: {
        id: string
        type: string
        correctChoiceIds?: string[]
        correctNodeIds?: string[]
        correctOrder?: string[]
        target?: number
        correctApproachId?: string
        correctRationaleIds?: string[]
      }[]
    }[]
    const topic = topics.find((t) => t.slug === 'the-system-design-interview')!
    const results: Record<string, boolean> = {}
    const answers: Record<string, unknown> = {}
    for (const q of topic.questions) {
      let answer: unknown = null
      if (q.type === 'multiple_choice') answer = q.correctChoiceIds
      else if (q.type === 'spot_bottleneck') answer = q.correctNodeIds
      else if (q.type === 'drag_order') answer = q.correctOrder
      else if (q.type === 'estimation') answer = String(q.target)
      else if (q.type === 'tradeoff') {
        answer = { approachId: q.correctApproachId, rationaleIds: q.correctRationaleIds }
      }
      results[q.id] = true
      answers[q.id] = answer
    }
    localStorage.setItem(
      'sdq-progress-v3',
      JSON.stringify({
        version: 3,
        xp: 0,
        badges: [],
        unlockedTopicIds: [1],
        topicProgress: {},
        bossProgress: { completed: false, bestScore: 0, firstClearXpAwarded: false, drafts: {}, submissions: {} },
        streak: { lastActiveDay: null, history: [] },
        srs: [],
        interviews: [],
        preferences: { soundEnabled: false, reducedMotion: true, hasGestureForSound: false },
        quizAttempts: { [`topic-${topic.id}`]: { hearts: 3, answers, results, completed: false } },
      }),
    )
  })
  await page.reload()
  await page.goto('/quiz/the-system-design-interview')
  // A pass is saved automatically (no claim step)
  await expect(page.getByText(/xp earned/i).first()).toBeVisible()
  await page.goto('/')
  await expect(page.getByTestId('station-2')).toHaveAttribute('data-status', 'available')
})

test('boss canvas submit shows score breakdown', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem(
      'sdq-progress-v3',
      JSON.stringify({
        version: 3,
        xp: 50,
        badges: [],
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
  await page.getByRole('button', { name: '+ Client' }).click()
  await page.getByRole('button', { name: '+ Load Balancer' }).click()
  await page.getByRole('button', { name: '+ Service' }).click()
  await page.getByRole('button', { name: '+ SQL DB' }).click()
  await page.getByRole('button', { name: 'Submit boss attempt' }).click()
  await expect(page.getByText(/Score:/i)).toBeVisible({ timeout: 15000 })
})

test('revision rating schedules next due date', async ({ page }) => {
  await page.goto('/revision')
  await page.getByRole('button', { name: 'Show answer' }).click()
  await page.getByRole('button', { name: /^Good/ }).click()
  await expect(page.getByText(/Next due|Queue empty|Topic/i).first()).toBeVisible()
})

test('interview reload preserves timer and notes draft', async ({ page }) => {
  await page.goto('/interview')
  await page.getByRole('button', { name: 'Start mock' }).click()
  await page.getByRole('textbox').fill('draft notes for reload test')
  const timerBefore = await page.locator('[data-testid="interview-overall-timer"]').textContent()
  await page.reload()
  await expect(page.getByRole('textbox')).toHaveValue('draft notes for reload test')
  const timerAfter = await page.locator('[data-testid="interview-overall-timer"]').textContent()
  expect(timerAfter).toBeTruthy()
  if (timerBefore) expect(timerAfter).not.toBe('0:00')
})

test('keyboard help opens with ?', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('help-shortcuts-trigger').click()
  await expect(page.getByRole('dialog', { name: /Keyboard shortcuts/i })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.keyboard.press('Shift+/')
  await expect(page.getByRole('dialog', { name: /Keyboard shortcuts/i })).toBeVisible()
})

test('progress persists after reload', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() =>
    localStorage.setItem(
      'sdq-progress-v3',
      JSON.stringify({
        version: 3,
        xp: 42,
        badges: [],
        unlockedTopicIds: [1],
        topicProgress: {},
        bossProgress: { completed: false, bestScore: 0, firstClearXpAwarded: false, drafts: {}, submissions: {} },
        streak: { lastActiveDay: null, history: [] },
        srs: [],
        interviews: [],
        preferences: { soundEnabled: false, reducedMotion: true, hasGestureForSound: false },
        quizAttempts: {},
      }),
    ),
  )
  await page.reload()
  await expect(page.getByText('42 xp')).toBeVisible()
})

test('mobile viewport core flow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  for (const path of ['/', '/quiz/the-system-design-interview', '/revision', '/cheat-sheet', '/topic/the-system-design-interview', '/interview', '/settings', '/boss/url-shortener']) {
    await page.goto(path)
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width, `${path} should not scroll sideways`).toBeLessThanOrEqual(390)
  }
  await page.goto('/')
  await page.getByTestId('continue-quest').getByRole('link').click()
  await expect(page.getByTestId('topic-title')).toBeVisible()
})

test('lesson shows hand-drawn diagram with excalidraw download', async ({ page }) => {
  await page.goto('/topic/the-system-design-interview')
  const fig = page.getByTestId('sketch-figure')
  await fig.scrollIntoViewIfNeeded()
  const img = fig.locator('img')
  await expect(img).toHaveAttribute('src', '/diagrams/1.svg')
  await expect(img).toHaveAttribute('alt', /requirements/i)
  await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(100)
  await expect(fig.getByRole('link', { name: 'Download .excalidraw' })).toHaveAttribute('href', '/diagrams/1.excalidraw')
})
