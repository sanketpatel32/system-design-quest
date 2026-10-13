import { expect, test, type Page } from '@playwright/test'
import { seed } from './helpers'

type T = { id: number; slug: string; region: string; order: number; title: string; kind: string }
async function areas(page: Page) {
  const topics = (await (await page.request.get('/src/content/generated/topics.json')).json()) as T[]
  const by = new Map<string, T[]>()
  for (const t of topics.filter((x) => x.id >= 200)) by.set(t.region, [...(by.get(t.region) ?? []), t].sort((a, b) => a.order - b.order))
  return by
}

const SECTION_OF: Record<string, string> = { 'f1-frontend': 'frontend', 'f2-backend': 'backend', 'f3-networking': 'networking', 'f4-databases': 'databases', 'f5-os': 'os-concurrency', 'f6-security': 'security', 'f7-cloud': 'cloud-devops' }

test('sections: overview rings, a map per section, and System Design unchanged', async ({ page }) => {
  await seed(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Choose a section', level: 1 })).toBeVisible()
  await expect(page.getByTestId('ring-system-design')).toHaveAttribute('data-done', '0')
  const by = await areas(page)
  for (const [region, list] of by) {
    const sec = SECTION_OF[region]!
    await expect(page.getByTestId(`section-card-${sec}`)).toBeVisible()
    await page.goto(`/s/${sec}`)
    await expect(page.getByTestId(`section-tab-${sec}`)).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId(`area-${region}`)).toBeVisible()
    await expect(page.getByTestId(`station-${list[0]!.id}`)).toHaveAttribute('data-status', 'available')
    await expect(page.getByTestId(`station-${list[1]!.id}`)).toHaveAttribute('data-status', 'locked')
    await page.goto('/')
  }
  await page.getByTestId('section-card-system-design').click()
  await expect(page).toHaveURL(/\/s\/system-design$/)
  await expect(page.getByTestId('unit-1')).toBeVisible()
  await expect(page.getByTestId('boss-sidebar')).toBeVisible()
})

test('sections: legacy ?track=fundamentals links land on a section, unknown sections 404', async ({ page }) => {
  await seed(page)
  await page.goto('/?track=fundamentals')
  await expect(page).toHaveURL(/\/s\/frontend$/)
  await page.goto('/s/not-a-section')
  await expect(page.getByText(/not found|no such/i).first()).toBeVisible()
})

test('sections: Review and Cheat Sheet filter by section', async ({ page }) => {
  await seed(page)
  await page.goto('/revision?s=networking')
  await expect(page.getByTestId('section-tab-networking')).toHaveAttribute('aria-current', 'page')
  await page.goto('/cheat-sheet?s=databases')
  await expect(page.getByTestId('cheat-databases')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Databases cheat sheet' })).toBeVisible()
})

test('every Fundamentals area: first topic has cards, Go deeper, and a Try it, and its quiz loads', async ({ page }) => {
  await seed(page)
  const by = await areas(page)
  expect(by.size).toBeGreaterThan(0)
  for (const [, list] of by) {
    const t = list[0]!
    await page.goto(`/topic/${t.slug}`)
    await expect(page.getByText(/^Fundamentals · /).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Go deeper' })).toBeVisible()
    await page.getByRole('button', { name: 'Go to card 1', exact: true }).waitFor()
    const n = await page.getByRole('button', { name: /^Go to card/ }).count()
    await page.getByRole('button', { name: `Go to card ${n}`, exact: true }).click()
    await expect(page.getByTestId('interactive'), t.slug).toBeVisible()
    await page.goto(`/quiz/${t.slug}`)
    await expect(page.getByRole('button', { name: /^Question 1/ }), t.slug).toBeVisible()
  }
})

test('a locked Fundamentals topic explains which topic opens it', async ({ page }) => {
  await seed(page)
  const by = await areas(page)
  const [, list] = [...by][0]!
  await page.goto(`/s/${SECTION_OF[[...by][0]![0]]}`)
  await page.getByTestId(`station-${list[1]!.id}`).click()
  await expect(page.getByRole('dialog', { name: list[1]!.title })).toContainText(`Clear `)
  await expect(page.getByRole('dialog', { name: list[1]!.title })).toContainText(list[0]!.title)
})

test('Networking: the subnet slider reports whether a prefix fits 500 hosts', async ({ page }) => {
  await seed(page, { extra: { unlockedTopicIds: [1, 241, 242, 243] } })
  await page.goto('/topic/subnets-and-cidr')
  await page.getByRole('button', { name: 'Go to card 1', exact: true }).waitFor()
  const n = await page.getByRole('button', { name: /^Go to card/ }).count()
  await page.getByRole('button', { name: `Go to card ${n}`, exact: true }).click()
  const box = page.getByTestId('interactive')
  await box.getByRole('slider').fill('24')
  await expect(page.getByTestId('interactive-verdict')).toHaveAttribute('data-ok', 'false')
  await box.getByRole('slider').fill('23')
  await expect(page.getByTestId('interactive-verdict')).toHaveAttribute('data-ok', 'true')
  await expect(box).toContainText('510')
})

test('Databases: the pool slider shows requests queueing once queries slow down', async ({ page }) => {
  await seed(page, { extra: { unlockedTopicIds: [1, 261, 274] } })
  await page.goto('/topic/connection-pooling')
  await page.getByRole('button', { name: 'Go to card 1', exact: true }).waitFor()
  const n = await page.getByRole('button', { name: /^Go to card/ }).count()
  await page.getByRole('button', { name: `Go to card ${n}`, exact: true }).click()
  const box = page.getByTestId('interactive')
  await expect(page.getByTestId('interactive-verdict')).toHaveAttribute('data-ok', 'true')
  await box.getByRole('slider').fill('60')
  await expect(page.getByTestId('interactive-verdict')).toHaveAttribute('data-ok', 'false')
})
