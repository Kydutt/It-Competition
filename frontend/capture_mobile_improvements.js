import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT_DIR = path.resolve('..', 'screenshots')
const ARTIFACT_DIR = 'C:\\Users\\advan\\.gemini\\antigravity\\brain\\2edf19be-6480-4980-8231-4909ca5ceee3'

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

async function saveShot(page, filename, fullPage = true) {
  const outPath1 = path.join(OUT_DIR, `${filename}.png`)
  const outPath2 = path.join(ARTIFACT_DIR, `${filename}.png`)
  await page.screenshot({ path: outPath1, fullPage })
  fs.copyFileSync(outPath1, outPath2)
  const size = fs.statSync(outPath1).size
  console.log(`[OK] Captured mobile screenshot: ${filename}.png (${size} bytes)`)
}

async function main() {
  console.log('--- STARTING MOBILE UI SCREENSHOT VERIFICATION ---')
  const tempDir = path.resolve('temp_puppeteer_mobile_' + Date.now())
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    userDataDir: tempDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const page = await browser.newPage()
  // Set Mobile Viewport (iPhone 14 / standard modern mobile screen: 390 x 844)
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })

  // 1. Home Page Mobile View (Badges & Compact Footer)
  console.log('Navigating to Mobile Home Page...')
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, 'mobile_01_home_badges_and_footer')

  // 2. Competitions Page Mobile View (Category Filter Badges per-slide)
  console.log('Navigating to Mobile Competitions Page...')
  await page.goto('http://localhost:5173/competitions', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, 'mobile_02_competitions_badges_slider')

  // 3. FAQ Page Mobile View (Category Badges per-slide)
  console.log('Navigating to Mobile FAQ Page...')
  await page.goto('http://localhost:5173/faq', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, 'mobile_03_faq_badges_slider')

  // 4. Compact Footer Focus on Mobile
  console.log('Focusing on Mobile Footer...')
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight)
  })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, 'mobile_04_footer_compact', false)

  await browser.close()
  console.log('--- MOBILE UI SCREENSHOT VERIFICATION COMPLETE ---')
}

main().catch(err => {
  console.error('Fatal mobile screenshot error:', err)
  process.exit(1)
})
