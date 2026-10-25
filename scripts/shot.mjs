import { chromium } from 'playwright-core'
import fs from 'node:fs'

const URL = process.argv[2] || 'http://127.0.0.1:5183/'
const OUT = process.argv[3] || 'shot.png'
const W = Number(process.argv[4] || 1600)
const H = Number(process.argv[5] || 950)

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: W, height: H } })
const errors = []
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()) })
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(3500)
await page.screenshot({ path: OUT })

// 切到最后一个朝代，再截一张，验证纵深
const ticks = await page.$$('.tick')
if (ticks.length > 3) {
  await ticks[ticks.length - 1].click()
  await page.waitForTimeout(1600)
  await page.screenshot({ path: OUT.replace('.png', '-last.png') })
}

console.log('errors:', errors.length ? errors.slice(0, 5) : 'none')
console.log('saved:', OUT)
await browser.close()
