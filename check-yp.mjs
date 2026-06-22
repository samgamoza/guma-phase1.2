import { chromium } from 'playwright'

const b = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const page = await b.newPage()
await page.goto('https://www.yellowpages.com/search?search_terms=Coffee+Shops&geo_location_terms=Austin,+TX', { waitUntil: 'domcontentloaded', timeout: 30000 })
const title = await page.title()
// Check current selectors
const debug = await page.evaluate(() => {
  const old1 = document.querySelectorAll('a.business-name').length
  const old2 = document.querySelectorAll('h2.n a').length
  const old3 = document.querySelectorAll('.result a.business-name').length

  // Try to find what the business links look like now
  const allLinks = Array.from(document.querySelectorAll('a[href*="yellowpages.com"]'))
    .filter(a => !a.href.includes('/search'))
    .slice(0, 5)
    .map(a => ({ href: a.href.slice(0, 60), class: a.className, text: a.textContent.trim().slice(0, 30) }))

  // Look for business name elements
  const h2s = Array.from(document.querySelectorAll('h2, h3')).slice(0, 10).map(h => ({
    tag: h.tagName, class: h.className, text: h.textContent.trim().slice(0, 40)
  }))

  return { old1, old2, old3, allLinks, h2s, bodyText: document.body.innerText.slice(0, 400) }
})

console.log('TITLE:', title)
console.log('OLD selector a.business-name:', debug.old1, 'results')
console.log('OLD selector h2.n a:', debug.old2, 'results')
console.log('OLD selector .result a.business-name:', debug.old3, 'results')
console.log('Sample YP links:', JSON.stringify(debug.allLinks, null, 2))
console.log('H2/H3 elements:', JSON.stringify(debug.h2s, null, 2))
console.log('BODY:', debug.bodyText)
await b.close()
