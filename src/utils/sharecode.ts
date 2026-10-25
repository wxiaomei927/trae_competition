/**
 * 静态资源访问修正：部分托管环境要求 URL 带 sharecode 参数，
 * 否则子资源返回 403。此处统一拦截并补全参数。
 */
export function installShareCode() {
  const key = 'sharecode'
  const current = new URLSearchParams(window.location.search).get(key)
  if (!current) return

  const patch = (url: string) => {
    if (!url) return url
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('#')) return url
    if (url.includes(`${key}=`)) return url
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}${key}=${encodeURIComponent(current)}`
  }

  // 同步改写 img / script / link 等属性
  const observer = new MutationObserver(() => {
    document.querySelectorAll('img[src]').forEach(el => {
      const s = el.getAttribute('src')
      if (s) el.setAttribute('src', patch(s))
    })
    document.querySelectorAll('link[href]').forEach(el => {
      const h = el.getAttribute('href')
      if (h) el.setAttribute('href', patch(h))
    })
  })
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true })

  // fetch / XHR
  const origFetch = window.fetch.bind(window)
  window.fetch = (input, init) => {
    if (typeof input === 'string') return origFetch(patch(input), init)
    return origFetch(input, init)
  }
}
