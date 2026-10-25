import { chromium } from 'playwright-core'

const URL = process.argv[2]
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } })
const failed = []
page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().slice(-60)) })
page.on('pageerror', e => failed.push('PAGEERROR: ' + e.message))

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(6000)

// 逐个标签页检查（每次先关掉可能存在的弹窗）
const tabs = ['字表', '造字', '对决', '猜字', '生词本']
for (const t of tabs) {
  await page.evaluate(() => {
    document.querySelectorAll('.pz-close, .modal-mask .act').forEach(b => b.click())
  })
  await page.waitForTimeout(400)
  await page.evaluate((label) => {
    const b = [...document.querySelectorAll('.tools .tool')].find(x => x.textContent.trim() === label)
    if (b) b.click()
  }, t)
  await page.waitForTimeout(1400)
}

// 造字工坊里选一个可拆的字并拆解
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.tools .tool')].find(x => x.textContent.trim() === '造字')
  if (b) b.click()
})
await page.waitForTimeout(1400)
const fps = await page.$$('.fp')
for (const f of fps) {
  const t = await f.textContent()
  if (t.trim() === '明') { await f.click(); break }
}
await page.waitForTimeout(1600)
const btn = await page.$('.fa')
if (btn) { await btn.click(); await page.waitForTimeout(1400) }

const state = await page.evaluate(() => ({
  字形图: document.querySelectorAll('.glyph-img').length,
  部件图: document.querySelectorAll('.part-img').length,
  字题: document.querySelectorAll('.poem-text').length,
  表格行: document.querySelectorAll('.tr').length,
}))

console.log('功能自检:', JSON.stringify(state))
console.log('失败请求:', failed.length ? failed.slice(0, 5) : 'none')
await browser.close()
