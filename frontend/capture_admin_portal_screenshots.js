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
  console.log(`[OK] Captured screenshot: ${filename}.png (${size} bytes)`)
}

async function run() {
  console.log('--- STARTING ADMIN PORTAL SCREENSHOT CAPTURE ---')
  const tempDir = path.resolve('temp_puppeteer_admin_' + Date.now())
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    userDataDir: tempDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  page.on('dialog', async (dialog) => {
    console.log(`Dialog opened: ${dialog.message()}`)
    await dialog.accept()
  })

  try {
    // 1. Login as Admin
    console.log('1. Navigating to login page...')
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1000))

    console.log('Filling admin credentials...')
    await page.type('input[type="email"]', 'admin@itcomp.test')
    await page.type('input[type="password"]', 'Password123#')
    await page.click('button[type="submit"]')

    console.log('Waiting for admin dashboard navigation...')
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {})
    await new Promise((r) => setTimeout(r, 2000))

    // Capture 1: Dashboard
    console.log('Capturing admin dashboard...')
    await saveShot(page, 'admin_01_dashboard')

    // Capture 2: Registrations list
    console.log('2. Navigating to /admin/registrations...')
    await page.goto('http://localhost:5173/admin/registrations', { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    await saveShot(page, 'admin_02_registrations')

    // Capture 3: Registration Detail
    console.log('3. Navigating to /admin/registrations/1...')
    await page.goto('http://localhost:5173/admin/registrations/1', { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    await saveShot(page, 'admin_03_registration_detail')

    // Capture 4: Competitions list
    console.log('4. Navigating to /admin/competitions...')
    await page.goto('http://localhost:5173/admin/competitions', { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    await saveShot(page, 'admin_04_competitions')

    // Capture 5: Submissions list
    console.log('5. Navigating to /admin/submissions...')
    await page.goto('http://localhost:5173/admin/submissions', { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    await saveShot(page, 'admin_05_submissions')

    // Capture 6: Events
    console.log('6. Navigating to /admin/events...')
    await page.goto('http://localhost:5173/admin/events', { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    await saveShot(page, 'admin_06_events')

    // Capture 7: Categories
    console.log('7. Navigating to /admin/categories...')
    await page.goto('http://localhost:5173/admin/categories', { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    await saveShot(page, 'admin_07_categories')

    // Capture 8: Announcements
    console.log('8. Navigating to /admin/announcements...')
    await page.goto('http://localhost:5173/admin/announcements', { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    await saveShot(page, 'admin_08_announcements')

    // Capture 9: FAQs
    console.log('9. Navigating to /admin/faqs...')
    await page.goto('http://localhost:5173/admin/faqs', { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    await saveShot(page, 'admin_09_faqs')

    // Capture 10: Activity Logs
    console.log('10. Navigating to /admin/activity-logs...')
    await page.goto('http://localhost:5173/admin/activity-logs', { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    await saveShot(page, 'admin_10_activity_logs')

    // Capture 11: Schedules
    console.log('11. Navigating to /admin/schedules...')
    await page.goto('http://localhost:5173/admin/schedules', { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    await saveShot(page, 'admin_11_schedules')

    // Capture 12: Settings
    console.log('12. Navigating to /admin/settings...')
    await page.goto('http://localhost:5173/admin/settings', { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    await saveShot(page, 'admin_12_settings')

    console.log('ALL 12 ADMIN PORTAL SCREENSHOTS CAPTURED SUCCESSFULLY!')
  } catch (err) {
    console.error('Screenshot capture failed:', err)
  } finally {
    await browser.close()
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {}
  }
}

run()
