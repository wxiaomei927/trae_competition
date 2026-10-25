import { chromium } from 'playwright-core'

const URL = process.argv[2] || 'http://127.0.0.1:5191/'
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 })
const errors = []
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()) })
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(6500)

const click = async (label) => {
  await page.evaluate((l) => {
    const b = [...document.querySelectorAll('.tools .tool')].find(x => x.textContent.trim() === l)
    if (b) b.click()
  }, label)
  await page.waitForTimeout(1600)
}

// 1 首页
await page.screenshot({ path: 'docs/01-封面.png' })

// 2 义·故事 tab
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.pt')].find(x => x.textContent.includes('义'))
  if (b) b.click()
})
await page.waitForTimeout(1200)
await page.screenshot({ path: 'docs/03-义项与读音.png' })

// 3 字表
await click('字表')
await page.screenshot({ path: 'docs/05-字表总览.png' })

// 4 拆字（合体检）
await click('拆字')
const fps = await page.$$('.fp')
for (const f of fps) {
  const t = await f.textContent()
  if (t.trim() === '明') { await f.click(); break }
}
await page.waitForTimeout(1800)
await page.screenshot({ path: 'docs/09-造字工坊.png' })

// 5 拆字（拆解态）
const btn = await page.$('.fa')
if (btn) { await btn.click(); await page.waitForTimeout(1600) }
await page.screenshot({ path: 'docs/10-部件拆解.png' })

// 6 字族
await click('字族')
await page.waitForTimeout(1600)
await page.screenshot({ path: 'docs/14-字族.png' })

// 7 对照
await click('对照')
await page.waitForTimeout(2200)
await page.screenshot({ path: 'docs/11-双字对决.png' })

// 8 猜字
await click('猜字')
await page.waitForTimeout(1600)
await page.screenshot({ path: 'docs/06-猜字.png' })

console.log('errors:', errors.length ? errors.slice(0, 5) : 'none')
await browser.close()
