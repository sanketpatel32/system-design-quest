import { chromium } from '@playwright/test'
import fs from 'node:fs'
const U = 'https://system-design-quest-phi.vercel.app'
const { EMAIL, PW } = JSON.parse(fs.readFileSync('/tmp/lg/cred.json', 'utf8'))
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage()
await p.goto(U + '/s/system-design'); await p.getByTestId('sign-in').click()
await p.locator('input[name="identifier"]').fill(EMAIL); await p.getByRole('button', { name: /^continue/i }).first().click()
await p.locator('input[name="password"]').fill(PW); await p.getByRole('button', { name: /^continue/i }).first().click()
await p.waitForTimeout(3000)
const otp = p.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]').first()
if (await otp.count()) { await otp.click(); await p.keyboard.type('424242') }
await p.getByText('Saved', { exact: true }).waitFor({ timeout: 30000 })
console.log('header:', await p.getByTestId('display-name').innerText())
const r = await p.evaluate(async () => { const t = await window.Clerk.session.getToken(); return (await (await fetch('/api/progress', { headers: { authorization: 'Bearer ' + t } })).json()).displayName })
console.log('api displayName:', r)
await p.locator('.cl-userButtonTrigger').click(); await p.waitForTimeout(1500)
console.log('menu:', (await p.locator('.cl-userButtonPopoverCard').innerText()).replace(/\s+/g, ' ').slice(0, 200))
await p.screenshot({ path: '/workspace/sdq-push-shots/login-display-name.png' })
await b.close()
