import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/** Cheap guards for the small stuff: accessibility, console noise, overflow, titles, focus and scroll. */
const ROUTES = ['/', '/s/system-design', '/s/frontend', '/s/os-concurrency', '/topic/where-to-cache', '/quiz/the-system-design-interview', '/revision', '/cheat-sheet', '/interview', '/settings', '/play?seed=polish', '/nope-not-here']

// Clerk's development-instance banner is expected until production keys are set
const ignored = (t: string) => /Clerk has been loaded with development keys|\[vite\]|Download the React DevTools/i.test(t)

test('key pages pass axe (no serious or critical issues) on phone and desktop', async ({ page }) => {
  for (const w of [390, 1280]) {
    await page.setViewportSize({ width: w, height: 900 })
    for (const r of ['/', '/s/system-design', '/s/frontend', '/topic/where-to-cache', '/quiz/the-system-design-interview', '/revision', '/settings', '/nope-not-here']) {
      await page.goto(r)
      await page.locator('main').first().waitFor()
      await page.waitForTimeout(250)
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('.react-flow__attribution').analyze()
      const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(bad.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`), `${r} at ${w}`).toEqual([])
    }
  }
})

test('no console errors or warnings and no sideways scroll at 360px', async ({ page }) => {
  const msgs: string[] = []
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !ignored(m.text())) msgs.push(`${page.url()}: ${m.text()}`) })
  page.on('pageerror', (e) => msgs.push(`${page.url()}: ${e.message}`))
  await page.setViewportSize({ width: 360, height: 780 })
  for (const r of ROUTES) {
    await page.goto(r)
    await page.locator('main').first().waitFor()
    await page.waitForTimeout(200)
    const sw = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(sw, `${r} scrolls sideways`).toBeLessThanOrEqual(360)
  }
  expect(msgs).toEqual([])
})

test('every page has its own tab title', async ({ page }) => {
  const cases: [string, RegExp][] = [
    ['/', /^System Design Quest$/],
    ['/s/frontend', /^Frontend Quest$/],
    ['/topic/where-to-cache', /^Where to Cache · System Design Quest$/i],
    ['/quiz/where-to-cache', /^Quiz: Where to Cache · System Design Quest$/i],
    ['/settings', /^Settings · /],
    ['/interview', /^Interview practice · /],
    ['/nope-not-here', /^Page not found · /],
  ]
  for (const [r, t] of cases) {
    await page.goto(r)
    await expect(page, r).toHaveTitle(t)
  }
})

test('a new page starts at the top', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/cheat-sheet')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect.poll(async () => { await page.evaluate(() => window.scrollTo(0, 3000)); return page.evaluate(() => window.scrollY) }).toBeGreaterThan(500)
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Settings' }).click()
  await expect(page).toHaveURL(/\/settings/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})

test('shortcuts dialog takes focus, traps Tab, closes on Escape and hands focus back', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/s/system-design')
  const trigger = page.getByTestId('help-shortcuts-trigger')
  await trigger.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab')
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('XP popover closes on Escape and on an outside click', async ({ page }) => {
  await page.goto('/s/system-design')
  const hud = page.getByRole('button', { name: /Show details/ })
  await hud.click()
  await expect(page.locator('#hud-explainer')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('#hud-explainer')).toBeHidden()
  await hud.click()
  await page.locator('main').click({ position: { x: 5, y: 5 } })
  await expect(page.locator('#hud-explainer')).toBeHidden()
})

test('the streak shows in the phone header at 360 and 390px', async ({ page }) => {
  for (const w of [360, 390]) {
    await page.setViewportSize({ width: w, height: 800 })
    for (const s of ['system-design', 'databases', 'networking']) {
      await page.goto(`/s/${s}`)
      await expect(page.getByTestId('hud-streak'), `${s} at ${w}`).toBeVisible()
      const over = await page.getByTestId('app-header').evaluate((h) => { const g = h.firstElementChild!.children[1] as HTMLElement; return g.scrollWidth - g.clientWidth })
      expect(over, `${s} at ${w}`).toBeLessThanOrEqual(0)
    }
  }
})
