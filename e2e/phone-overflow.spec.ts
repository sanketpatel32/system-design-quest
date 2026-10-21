import { expect, test } from '@playwright/test'

// Nothing on the key screens may scroll sideways on a 360px phone
const ROUTES = [
  '/',
  '/s/system-design',
  '/s/frontend',
  '/s/databases',
  '/topic/where-to-cache',
  '/topic/capacity-planning-for-a-service',
  '/quiz/where-to-cache',
  '/quiz/back-of-envelope-estimation',
  '/revision?s=system-design',
  '/cheat-sheet?s=system-design',
  '/cheat-sheet?s=frontend',
  '/interview',
  '/boss/url-shortener',
  '/settings',
]

test.use({ viewport: { width: 360, height: 740 }, hasTouch: true })

test('no horizontal overflow on key routes at 360px', async ({ page }) => {
  for (const r of ROUTES) {
    await page.goto(`${r}${r.includes('?') ? '&' : '?'}unlockAll=1`)
    await page.waitForLoadState('networkidle')
    // Open every disclosure (Go deeper, trade-off tables, text diagrams) so their content is measured too
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => ((d as HTMLDetailsElement).open = true)))
    await page.waitForTimeout(150)
    const m = await page.evaluate(() => {
      const de = document.documentElement
      // Elements poking past the right edge that are not inside a deliberate horizontal scroller
      const wide = [...document.querySelectorAll<HTMLElement>('main *')].filter((e) => {
        const r = e.getBoundingClientRect()
        if (r.right <= de.clientWidth + 1 || !r.width) return false
        for (let p = e.parentElement; p; p = p.parentElement) {
          const ox = getComputedStyle(p).overflowX
          if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return false
        }
        return true
      }).slice(0, 3).map((e) => `${e.tagName}.${e.className.toString().slice(0, 30)} r=${Math.round(e.getBoundingClientRect().right)}`)
      return { sw: de.scrollWidth, cw: de.clientWidth, body: document.body.scrollWidth, wide }
    })
    expect(m.sw, `${r} page width`).toBeLessThanOrEqual(m.cw)
    expect(m.body, `${r} body width`).toBeLessThanOrEqual(m.cw)
    expect(m.wide, `${r} elements past the right edge`).toEqual([])
  }
})

test('no horizontal overflow with the section switcher sheet open at 360px', async ({ page }) => {
  await page.goto('/s/system-design')
  await page.getByTestId('section-switcher-header').click()
  await expect(page.getByRole('menu', { name: 'Sections' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
  const menu = await page.getByRole('menu', { name: 'Sections' }).boundingBox()
  expect(menu!.x).toBeGreaterThanOrEqual(0)
  expect(menu!.x + menu!.width).toBeLessThanOrEqual(360)
})
