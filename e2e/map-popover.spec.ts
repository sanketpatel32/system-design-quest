import { expect, test, type Page } from '@playwright/test'
import { seed } from './helpers'

const SECTIONS = ['system-design', 'frontend', 'backend', 'networking', 'databases', 'os-concurrency', 'security', 'cloud-devops']
const WIDTHS = [[390, 844], [1280, 900], [1920, 1080]] as const

/** Every sampled point of the popover must hit the popover itself (nothing paints over it) and it must sit inside the viewport. */
async function expectOnTop(page: Page) {
  const pop = page.getByTestId('node-popover')
  await expect(pop).toBeVisible()
  const res = await pop.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const misses: string[] = []
    for (const fx of [0.08, 0.3, 0.5, 0.7, 0.92]) for (const fy of [0.12, 0.5, 0.88]) {
      const x = r.left + r.width * fx, y = r.top + r.height * fy
      const hit = document.elementFromPoint(x, y)
      if (!hit || !el.contains(hit)) misses.push(`${Math.round(x)},${Math.round(y)} → ${hit?.tagName}.${hit?.className}`)
    }
    const bg = getComputedStyle(el).backgroundColor
    return { misses, r: { l: r.left, t: r.top, rr: r.right, b: r.bottom }, vw: document.documentElement.clientWidth, vh: innerHeight, bg, op: getComputedStyle(el).opacity }
  })
  expect(res.misses).toEqual([])
  expect(res.op).toBe('1')
  expect(res.bg).not.toMatch(/rgba\(.*,\s*0(\.\d+)?\)$/)
  expect(res.r.l).toBeGreaterThanOrEqual(0)
  expect(res.r.rr).toBeLessThanOrEqual(res.vw)
  expect(res.r.t).toBeGreaterThanOrEqual(0)
  expect(res.r.b).toBeLessThanOrEqual(res.vh)
}

for (const [w, h] of WIDTHS) {
  test(`map popovers stay on top and inside the viewport at ${w}px`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: w, height: h })
    await seed(page)
    for (const s of SECTIONS) {
      await page.goto(`/s/${s}`)
      const nodes = page.locator('[data-testid^="station-"]')
      await expect(nodes.nth(1)).toBeVisible()
      // A node near the top of the screen: opens below, over the following nodes and labels
      await nodes.nth(1).evaluate((el) => el.scrollIntoView({ block: 'center' }))
      await nodes.nth(1).click()
      await expectOnTop(page)
      await page.keyboard.press('Escape')
      await expect(page.getByTestId('node-popover')).toHaveCount(0)
      // A node at the bottom edge: flips above
      const count = await nodes.count()
      const n = nodes.nth(Math.min(3, count - 1))
      await n.evaluate((el) => { const r = el.getBoundingClientRect(); window.scrollBy(0, r.bottom - innerHeight + 24) })
      await n.click()
      await expectOnTop(page)
      // If the page could scroll the node to the bottom edge, there is no room below: it must flip
      const nearBottom = await n.evaluate((el) => el.getBoundingClientRect().bottom > innerHeight - 120)
      if (nearBottom) await expect(page.getByTestId('node-popover')).toHaveAttribute('data-placement', 'above')
      await page.keyboard.press('Escape')
    }
  })
}
