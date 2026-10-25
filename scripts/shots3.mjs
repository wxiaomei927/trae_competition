import { chromium } from 'playwright-core'

const URL = process.argv[2] || 'http://127.0.0.1:5187/'
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 })
const errors = []
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()) })
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(6000)

// 造字工坊
await page.click('.tools .tool:nth-child(2)')
await page.waitForTimeout(1500)
await page.screenshot({ path: 'docs/09-造字工坊.png' })

// 点击拆解
const btn = await page.$('.fa')
if (btn) {
  await btn.click()
  await page.waitForTimeout(1600)
  await page.screenshot({ path: 'docs/10-部件拆解.png' })
}

// 双字对决
await page.click('.tools .tool:nth-child(3)')
await page.waitForTimeout(2200)
await page.screenshot({ path: 'docs/11-双字对决.png' })

console.log('errors:', errors.length ? errors.slice(0, 5) : 'none')
await browser.close()
