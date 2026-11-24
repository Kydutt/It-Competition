import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT_DIR = path.resolve('..', 'screenshots')
const ARTIFACT_DIR = 'C:\\Users\\advan\\.gemini\\antigravity\\brain\\2edf19be-6480-4980-8231-4909ca5ceee3'

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

const PAGES = [
  { name: '01_homepage', url: 'http://localhost:5173/' },
  { name: '02_competitions', url: 'http://localhost:5173/competitions' },
  { name: '03_competition_detail', url: 'http://localhost:5173/competitions/web-development-competition-2026' },
  { name: '04_schedule', url: 'http://localhost:5173/schedule' },
  { name: '05_announcements', url: 'http://localhost:5173/announcements' },
  { name: '06_faq', url: 'http://localhost:5173/faq' },
]

async function main() {
  console.log('Launching Chrome from:', CHROME_PATH)
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })

  for (const p of PAGES) {
    console.log(`Navigating to ${p.url}...`)
    try {
      await page.goto(p.url, { waitUntil: 'networkidle0', timeout: 15000 })
      await new Promise(r => setTimeout(r, 1000)) // ensure fonts and animations settle

      const outPath1 = path.join(OUT_DIR, `${p.name}.png`)
      const outPath2 = path.join(ARTIFACT_DIR, `${p.name}.png`)

      await page.screenshot({ path: outPath1, fullPage: true })
      fs.copyFileSync(outPath1, outPath2)

      console.log(`Saved screenshot: ${outPath1} (${fs.statSync(outPath1).size} bytes)`)
    } catch (err) {
      console.error(`Error capturing ${p.name}:`, err.message)
    }
  }

  await browser.close()
  console.log('Screenshot capture complete!')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
