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

test.describe('phone diagrams', () => {
  test.use({ hasTouch: true, viewport: { width: 360, height: 740 } })
  test('wide diagrams fit the card on a phone and open full screen with pan and close', async ({ page }) => {
    await page.goto('/topic/capacity-planning-for-a-service?unlockAll=1')
    const fig = page.getByTestId('sketch-figure').first()
    await fig.scrollIntoViewIfNeeded()
    const frame = fig.locator('.sketch-frame')
    // No sideways scrolling inside the card: the diagram fits its frame
    expect(await frame.evaluate((e) => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
    await fig.getByTestId('diagram-zoom').click()
    const viewer = page.getByTestId('diagram-viewer')
    await expect(viewer).toBeVisible()
    // Opens at actual size so a wide diagram pans sideways; Fit screen shows the whole thing
    const body = page.getByTestId('diagram-viewer-body')
    await expect.poll(() => body.evaluate((e) => e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth)).toBe(true)
    await page.getByRole('button', { name: 'Fit screen' }).click()
    await expect.poll(() => body.evaluate((e) => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
    await page.keyboard.press('Escape')
    await expect(viewer).toBeHidden()
    await page.getByTestId('diagram-zoom').first().click()
    await page.getByRole('button', { name: 'Close the diagram' }).click()
    await expect(viewer).toBeHidden()
  })
})

test('phone shell respects notches and the dynamic viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/s/system-design')
  // viewport-fit=cover turns on env(safe-area-inset-*), which the header, tab bar, quiz bar and feedback sheet pad by
  await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content', /viewport-fit=cover/)
  const tabbar = page.locator('nav.tabbar')
  const box = await tabbar.boundingBox()
  expect(Math.round(box!.y + box!.height)).toBe(844)
  // Last bit of page content can scroll clear of the tab bar
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  const mainBottom = await page.locator('main').evaluate((m) => m.getBoundingClientRect().bottom - parseFloat(getComputedStyle(m).paddingBottom))
  expect(mainBottom).toBeLessThanOrEqual(box!.y)
})

/** Interactive elements on screen that are smaller than 44px in either direction (the hit area is what counts). */
async function smallTargets(page: import('@playwright/test').Page, scope = 'body') {
  return page.evaluate((sel) => {
    const out: string[] = []
    for (const el of document.querySelector(sel)!.querySelectorAll<HTMLElement>('a[href], button, select, input:not([type=hidden]), summary, [role=button]')) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') continue
      if (el.closest('.react-flow__attribution, .sketch-caption, p, li')) continue // inline text links are exempt
      if (r.height < 44 || r.width < 24) out.push(`${el.tagName}:${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)} ${Math.round(r.width)}x${Math.round(r.height)}`)
    }
    return out
  }, scope)
}

test('lesson card dots and quiz question dots are 44px tall tap targets', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/topic/where-to-cache?unlockAll=1')
  for (const b of await page.getByRole('button', { name: /^Go to card/ }).all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await page.getByRole('button', { name: 'Go to card 3', exact: true }).click()
  await expect(page.getByText('Card 3 of')).toBeVisible()
  await page.goto('/quiz/where-to-cache?unlockAll=1')
  for (const b of await page.getByRole('button', { name: /^Question \d/ }).all()) {
    const r = (await b.boundingBox())!
    expect(r.height).toBeGreaterThanOrEqual(44)
    expect(r.width).toBeGreaterThanOrEqual(24)
  }
})

test('map unit toggles, map view switch and lesson section chips are 44px tap targets', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/s/system-design?unlockAll=1')
  await expect(page.getByTestId('jump-current')).toBeVisible()
  for (const b of await page.locator('[data-testid^="unit-toggle-"]').all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  for (const b of await page.getByRole('group', { name: 'Map view' }).getByRole('button').all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await page.goto('/topic/where-to-cache?unlockAll=1')
  const chips = page.locator('.section-chip')
  await chips.first().scrollIntoViewIfNeeded()
  for (const b of await chips.all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44)
})

test('cheat sheet links are 44px tap targets on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  for (const s of ['system-design', 'frontend']) {
    await page.goto(`/cheat-sheet?s=${s}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main a[href]')].filter((a) => a.getBoundingClientRect().height < 44).map((a) => `${a.textContent?.slice(0, 30)} ${Math.round(a.getBoundingClientRect().height)}`),
    )
    expect(small, s).toEqual([])
  }
})

test('text inputs, selects and textareas are at least 16px on a phone (no iOS focus zoom)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ['/s/system-design', '/settings', '/boss/url-shortener?unlockAll=1', '/quiz/back-of-envelope-estimation?unlockAll=1']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => ((d as HTMLDetailsElement).open = true)))
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('input, select, textarea')]
        .filter((e) => !['checkbox', 'radio', 'range', 'file', 'hidden'].includes((e as HTMLInputElement).type))
        .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 16)
        .map((e) => `${e.tagName}#${e.id} ${getComputedStyle(e).fontSize}`),
    )
    expect(small, path).toEqual([])
  }
})

test('phone header controls are full-size tap targets', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/s/system-design')
  expect(await smallTargets(page, '[data-testid=app-header]')).toEqual([])
})
