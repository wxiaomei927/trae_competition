import { chromium } from 'playwright-core'

const URL = process.argv[2]
const OUT = process.argv[3] || 'online.png'

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } })
const failed = []
page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().slice(-70)) })
page.on('pageerror', e => failed.push('PAGEERROR: ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(4000)

// 检查字形图是否真的渲染出来了
const imgState = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('.glyph-img')]
  return imgs.map(i => ({
    src: i.getAttribute('src').slice(0, 40),
    w: i.naturalWidth,
    h: i.naturalHeight,
  }))
})

await page.screenshot({ path: OUT })
console.log('字形图渲染状态:', JSON.stringify(imgState))
console.log('失败请求:', failed.length ? failed.slice(0, 6) : 'none')
await browser.close()
