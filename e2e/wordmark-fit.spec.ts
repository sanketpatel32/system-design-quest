import { expect, test } from '@playwright/test'

const SECTIONS = ['system-design', 'frontend', 'backend', 'networking', 'databases', 'os-concurrency', 'security', 'cloud-devops']
const PAD = 8

// Every wordmark, logo and chevron sit inside the desktop sidebar with room to spare, never truncated
for (const w of [1024, 1280, 1920]) {
  test(`sidebar wordmark fits for every section at ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 })
    for (const s of SECTIONS) {
      await page.goto(`/s/${s}?unlockAll=1`)
      const btn = page.getByTestId('section-switcher-sidebar')
      await expect(btn).toBeVisible()
      // Measure in the real display font: the fallback font is wider, so a measurement taken mid-FOUT under load overflows by a few px
      await page.evaluate(() => document.fonts.ready)
      // Measure the settled wordmark, not mid-way through its springy swap animation
      await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || !(a as CSSAnimation).animationName?.startsWith('wordmark')))
      const m = await btn.evaluate((b) => {
        const side = b.closest('.sidebar')!.getBoundingClientRect()
        const r = b.getBoundingClientRect()
        const chev = b.querySelector('.switcher-chevron')!.getBoundingClientRect()
        const mark = b.querySelector<HTMLElement>('[data-testid=wordmark]')!
        const box = mark.parentElement!
        return {
          right: r.right, chevRight: chev.right, sideRight: side.right - 2, // 2px border
          sw: b.scrollWidth, cw: b.clientWidth,
          markRight: mark.getBoundingClientRect().right, boxRight: box.getBoundingClientRect().right,
          text: mark.textContent, font: parseFloat(getComputedStyle(mark).fontSize),
        }
      })
      const label = `${s} at ${w}px`
      expect(m.right, label).toBeLessThanOrEqual(m.sideRight - PAD)
      expect(m.chevRight, label).toBeLessThanOrEqual(m.right)
      expect(m.sw, label).toBeLessThanOrEqual(m.cw)
      expect(m.markRight, `${label}: word stays in its box`).toBeLessThanOrEqual(m.boxRight + 0.5)
      expect(m.text, label).toMatch(/quest$/)
      expect(m.font, `${label}: still readable`).toBeGreaterThanOrEqual(16)
    }
  })
}

test('phone header wordmark fits for every section at 360 and 390px', async ({ page }) => {
  for (const w of [360, 390]) {
    await page.setViewportSize({ width: w, height: 800 })
    for (const s of SECTIONS) {
      await page.goto(`/s/${s}?unlockAll=1`)
      const btn = page.getByTestId('section-switcher-header')
      await expect(btn).toBeVisible()
      const m = await btn.evaluate((b) => ({ right: b.getBoundingClientRect().right, sw: b.scrollWidth, cw: b.clientWidth, doc: document.documentElement.scrollWidth }))
      expect(m.sw, `${s} at ${w}`).toBeLessThanOrEqual(m.cw)
      expect(m.right, `${s} at ${w}`).toBeLessThanOrEqual(w - 8)
      expect(m.doc, `${s} at ${w}`).toBeLessThanOrEqual(w)
    }
  }
})
