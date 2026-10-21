import { expect, test } from '@playwright/test'
import { seed } from './helpers'

const NAMES = ['System Design Quest', 'Frontend Quest', 'Backend Quest', 'Networking', 'Databases', 'OS & Concurrency', 'Security', 'Cloud & DevOps']

test('logo opens the section switcher: every section, current highlighted, keyboard and outside click', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await seed(page)
  await page.goto('/s/backend')
  const btn = page.getByTestId('section-switcher-sidebar')
  await expect(btn).toHaveAttribute('aria-expanded', 'false')
  await btn.click()
  const menu = page.getByTestId('section-switcher-menu')
  await expect(menu).toBeVisible()
  for (const n of NAMES) await expect(menu.getByRole('menuitem', { name: new RegExp(`^${n.replace(/[&]/g, '\\$&')}`) })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'All sections' })).toBeVisible()
  await expect(page.getByTestId('switcher-item-backend')).toHaveAttribute('aria-current', 'page')
  await expect(page.getByTestId('switcher-item-backend')).toContainText('%')
  // Nothing paints over the menu: the centre of every item hits the menu
  const misses = await menu.evaluate((el) => Array.from(el.querySelectorAll('[role="menuitem"]')).filter((it) => {
    const r = it.getBoundingClientRect()
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return !hit || !el.contains(hit)
  }).length)
  expect(misses).toBe(0)
  // Outside click closes
  await page.mouse.click(900, 700)
  await expect(menu).toBeHidden()

  // Keyboard: Enter opens, arrows move, Escape closes and returns focus
  await btn.focus()
  await page.keyboard.press('Enter')
  await expect(menu).toBeVisible()
  await expect(page.getByTestId('switcher-item-backend')).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByTestId('switcher-item-networking')).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await expect(page.getByTestId('switcher-item-frontend')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(btn).toBeFocused()

  // Space opens too; Enter on an item navigates there
  await page.keyboard.press(' ')
  await expect(menu).toBeVisible()
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/s\/frontend$/)
  await expect(menu).toBeHidden()
})

test('section switcher is a full-width sheet under the header on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seed(page)
  await page.goto('/s/frontend')
  await page.getByTestId('section-switcher-header').click()
  const menu = page.getByTestId('section-switcher-menu')
  await expect(menu).toBeVisible()
  await expect(menu).toHaveAttribute('data-sheet', 'true')
  const box = (await menu.boundingBox())!
  const header = (await page.locator('.shell-header').boundingBox())!
  expect(box.x).toBeLessThanOrEqual(1)
  expect(box.width).toBeGreaterThanOrEqual(388)
  expect(Math.abs(box.y - (header.y + header.height))).toBeLessThanOrEqual(2)
  await expect(page.getByTestId('switcher-item-frontend')).toHaveAttribute('aria-current', 'page')
  await page.getByTestId('switcher-item-all').click()
  await expect(page).toHaveURL(/\/$/)
})
