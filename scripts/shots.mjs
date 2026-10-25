import { chromium } from 'playwright-core'

const URL = process.argv[2] || 'http://127.0.0.1:5183/'

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 })
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(3500)

// 1. 封面：默认视图
await page.screenshot({ path: 'docs/01-封面.png' })

// 2. 三维纵深：切到中间朝代
const ticks = await page.$$('.tick')
if (ticks.length > 2) {
  await ticks[Math.floor(ticks.length / 2)].click()
  await page.waitForTimeout(1800)
  await page.screenshot({ path: 'docs/02-三维字形演变链.png' })
}

// 3. 义项时间轴：滚到右侧面板的义项区
await page.evaluate(() => {
  const p = document.querySelector('.panel-scroll')
  if (p) p.scrollTop = p.scrollHeight * 0.42
})
await page.waitForTimeout(1200)
await page.screenshot({ path: 'docs/03-义项与读音.png' })

// 4. 字源卡导出面板
const cardBtn = await page.$('.tools .tool:nth-child(2)')
if (cardBtn) {
  await cardBtn.click()
  await page.waitForTimeout(2200)
  await page.screenshot({ path: 'docs/04-字源卡.png' })
}

console.log('shots saved')
await browser.close()
