import { chromium } from 'playwright-core'

const URL = process.argv[2] || 'http://127.0.0.1:5185/'
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 })
const errors = []
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()) })
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(3000)

// 字表
await page.click('.tools .tool:nth-child(1)')
await page.waitForTimeout(1400)
await page.screenshot({ path: 'docs/05-字表总览.png' })

// 猜字
await page.click('.tools .tool:nth-child(2)')
await page.waitForTimeout(1600)
await page.screenshot({ path: 'docs/06-猜字.png' })

// 关闭猜字，选一个字看详情
await page.click('.pz-close')
await page.waitForTimeout(600)
// 搜索"水"
await page.fill('.search-input', '水')
await page.waitForTimeout(900)
const opt = await page.$('.drop-item')
if (opt) await opt.click()
await page.waitForTimeout(2200)
await page.screenshot({ path: 'docs/07-水字详情.png' })

// 滚到口播区
await page.evaluate(() => {
  const p = document.querySelector('.panel-scroll')
  if (p) p.scrollTop = p.scrollHeight
})
await page.waitForTimeout(1000)
await page.screenshot({ path: 'docs/08-六十秒故事.png' })

console.log('errors:', errors.length ? errors.slice(0, 5) : 'none')
await browser.close()
