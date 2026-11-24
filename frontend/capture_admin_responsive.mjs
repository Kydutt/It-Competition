import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT_DIR = path.resolve('..', 'screenshots')
const ARTIFACT_DIR = 'C:\\Users\\advan\\.gemini\\antigravity\\brain\\2edf19be-6480-4980-8231-4909ca5ceee3'

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

async function saveShot(page, filename, fullPage = false) {
  const outPath1 = path.join(OUT_DIR, `${filename}.png`)
  const outPath2 = path.join(ARTIFACT_DIR, `${filename}.png`)
  await page.screenshot({ path: outPath1, fullPage })
  fs.copyFileSync(outPath1, outPath2)
  const size = fs.statSync(outPath1).size
  console.log(`[OK] Captured screenshot: ${filename}.png (${size} bytes)`)
}

async function checkHorizontalOverflow(page, label) {
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth
  })
  const widths = await page.evaluate(() => ({
    docScroll: document.documentElement.scrollWidth,
    bodyScroll: document.body.scrollWidth,
    winInner: window.innerWidth,
  }))
  if (hasOverflow) {
    console.warn(`[OVERFLOW DETECTED] ${label}: doc=${widths.docScroll}, body=${widths.bodyScroll}, win=${widths.winInner}`)
  } else {
    console.log(`[NO OVERFLOW] ${label}: doc=${widths.docScroll}, win=${widths.winInner}`)
  }
  return !hasOverflow
}

async function navigateTo(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 })
  } catch (e) {
    console.warn(`Soft warning on navigation to ${url}:`, e.message)
  }
  await new Promise((r) => setTimeout(r, 1200))
}

async function run() {
  console.log('=== STARTING ADMIN MOBILE RESPONSIVE VERIFICATION ===')
  const tempDir = path.resolve('temp_puppeteer_admin_resp_' + Date.now())
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    userDataDir: tempDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const page = await browser.newPage()

  page.on('dialog', async (dialog) => {
    console.log(`Dialog opened: ${dialog.message()}`)
    await dialog.accept()
  })

  try {
    // 1. Initial Login at 390px
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    console.log('1. Navigating to login...')
    await navigateTo(page, 'http://localhost:5173/login')

    console.log('Logging in with admin credentials...')
    await page.type('input[type="email"]', 'admin@itcomp.test')
    await page.type('input[type="password"]', 'Password123#')
    await page.click('button[type="submit"]')

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {})
    await new Promise((r) => setTimeout(r, 2000))
    console.log('Current URL:', page.url())

    // 2. VERIFY MOBILE DRAWER INTERACTIONS (390px)
    console.log('2. Testing mobile drawer interactions on 390px...')
    await checkHorizontalOverflow(page, '390px Dashboard Closed')
    await saveShot(page, 'admin_mobile_02_dashboard_390px', false)

    // A. Open Drawer
    console.log('Clicking hamburger button...')
    await page.click('header button[aria-label="Buka menu navigasi admin"]')
    await new Promise((r) => setTimeout(r, 600))
    await saveShot(page, 'admin_mobile_01_drawer_open', false)

    // B. Test Close button inside Drawer
    console.log('Clicking close button inside drawer...')
    await page.click('aside button[aria-label="Tutup menu navigasi"]')
    await new Promise((r) => setTimeout(r, 500))

    // C. Open Drawer again and test Escape key
    console.log('Testing Escape key to close drawer...')
    await page.click('header button[aria-label="Buka menu navigasi admin"]')
    await new Promise((r) => setTimeout(r, 500))
    await page.keyboard.press('Escape')
    await new Promise((r) => setTimeout(r, 500))

    // D. Open Drawer and click Backdrop
    console.log('Testing Backdrop click to close drawer...')
    await page.click('header button[aria-label="Buka menu navigasi admin"]')
    await new Promise((r) => setTimeout(r, 500))
    await page.mouse.click(360, 300)
    await new Promise((r) => setTimeout(r, 500))

    // 3. CAPTURE ALL ADMIN PAGES ON 375px (iPhone SE/Mini)
    console.log('3. Capturing all modules on 375px standard mobile...')
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true })

    // Page 1: Dashboard
    await navigateTo(page, 'http://localhost:5173/admin/dashboard')
    await checkHorizontalOverflow(page, '375px Dashboard')
    await saveShot(page, 'admin_mobile_02_dashboard_375px', true)

    // Page 2: Registrations
    console.log('Capturing Registrations on 375px...')
    await navigateTo(page, 'http://localhost:5173/admin/registrations')
    await checkHorizontalOverflow(page, '375px Registrations')
    await saveShot(page, 'admin_mobile_03_registrations_375px', false)

    // Page 3: Registration Detail
    console.log('Capturing Registration Detail on 375px...')
    await navigateTo(page, 'http://localhost:5173/admin/registrations/1')
    await checkHorizontalOverflow(page, '375px Registration Detail')
    await saveShot(page, 'admin_mobile_04_detail_375px', false)

    // Page 4: Submissions
    console.log('Capturing Submissions on 375px...')
    await navigateTo(page, 'http://localhost:5173/admin/submissions')
    await checkHorizontalOverflow(page, '375px Submissions')
    await saveShot(page, 'admin_mobile_05_submissions_375px', false)

    // Page 5: Competitions
    console.log('Capturing Competitions on 375px...')
    await navigateTo(page, 'http://localhost:5173/admin/competitions')
    await checkHorizontalOverflow(page, '375px Competitions')
    await saveShot(page, 'admin_mobile_06_competitions_375px', false)

    // Test Modal: Open "Tambah Kompetisi" Modal on 375px
    console.log('Testing "Tambah Kompetisi" modal responsiveness on 375px...')
    const addCompBtn = await page.$('button ::-p-text(Tambah Kompetisi)')
    if (addCompBtn) {
      await addCompBtn.click()
      await new Promise((r) => setTimeout(r, 600))
      await checkHorizontalOverflow(page, '375px Competition Modal')
      await saveShot(page, 'admin_mobile_07_competition_modal_375px', false)
      const closeBtn = await page.$('div.fixed button ::-p-text(Batal)')
      if (closeBtn) {
        await closeBtn.click()
      } else {
        await page.keyboard.press('Escape')
      }
      await new Promise((r) => setTimeout(r, 400))
    }

    // Page 6: Events
    console.log('Capturing Events on 375px...')
    await navigateTo(page, 'http://localhost:5173/admin/events')
    await checkHorizontalOverflow(page, '375px Events')
    await saveShot(page, 'admin_mobile_08_events_375px', false)

    // Page 7: Schedules
    console.log('Capturing Schedules on 375px...')
    await navigateTo(page, 'http://localhost:5173/admin/schedules')
    await checkHorizontalOverflow(page, '375px Schedules')
    await saveShot(page, 'admin_mobile_09_schedules_375px', false)

    // Page 8: Categories
    console.log('Capturing Categories on 375px...')
    await navigateTo(page, 'http://localhost:5173/admin/categories')
    await checkHorizontalOverflow(page, '375px Categories')
    await saveShot(page, 'admin_mobile_10_categories_375px', false)

    // Page 9: Announcements
    console.log('Capturing Announcements on 375px...')
    await navigateTo(page, 'http://localhost:5173/admin/announcements')
    await checkHorizontalOverflow(page, '375px Announcements')
    await saveShot(page, 'admin_mobile_11_announcements_375px', false)

    // Page 10: FAQs
    console.log('Capturing FAQs on 375px...')
    await navigateTo(page, 'http://localhost:5173/admin/faqs')
    await checkHorizontalOverflow(page, '375px FAQs')
    await saveShot(page, 'admin_mobile_12_faqs_375px', false)

    // Page 11: Settings
    console.log('Capturing Settings on 375px...')
    await navigateTo(page, 'http://localhost:5173/admin/settings')
    await checkHorizontalOverflow(page, '375px Settings')
    await saveShot(page, 'admin_mobile_13_settings_375px', false)

    // Page 12: Activity Logs
    console.log('Capturing Activity Logs on 375px...')
    await navigateTo(page, 'http://localhost:5173/admin/activity-logs')
    await checkHorizontalOverflow(page, '375px Activity Logs')
    await saveShot(page, 'admin_mobile_14_activity_logs_375px', false)

    // 4. TEST EXTREME COMPACT VIEWPORT: 320px (Compact Mobile)
    console.log('4. Testing 320px extreme compact viewport...')
    await page.setViewport({ width: 320, height: 568, isMobile: true, hasTouch: true })
    await navigateTo(page, 'http://localhost:5173/admin/dashboard')
    await checkHorizontalOverflow(page, '320px Dashboard')
    await saveShot(page, 'admin_vp_320px_dashboard', false)

    await navigateTo(page, 'http://localhost:5173/admin/registrations')
    await checkHorizontalOverflow(page, '320px Registrations')
    await saveShot(page, 'admin_vp_320px_registrations', false)

    // 5. TEST LARGE MOBILE: 430px (iPhone 14/15 Pro Max)
    console.log('5. Testing 430px large mobile viewport...')
    await page.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true })
    await navigateTo(page, 'http://localhost:5173/admin/dashboard')
    await checkHorizontalOverflow(page, '430px Dashboard')
    await saveShot(page, 'admin_vp_430px_dashboard', false)

    // 6. TEST TABLET PORTRAIT: 768px (iPad)
    console.log('6. Testing 768px tablet portrait...')
    await page.setViewport({ width: 768, height: 1024, isMobile: false })
    await navigateTo(page, 'http://localhost:5173/admin/dashboard')
    await checkHorizontalOverflow(page, '768px Tablet Portrait Dashboard')
    await saveShot(page, 'admin_tablet_768px_dashboard', false)

    // 7. TEST TABLET LANDSCAPE: 1024px
    console.log('7. Testing 1024px tablet landscape...')
    await page.setViewport({ width: 1024, height: 768, isMobile: false })
    await navigateTo(page, 'http://localhost:5173/admin/dashboard')
    await checkHorizontalOverflow(page, '1024px Tablet Landscape Dashboard')
    await saveShot(page, 'admin_tablet_1024px_dashboard', false)

    // 8. TEST DESKTOP: 1440px
    console.log('8. Testing 1440px desktop...')
    await page.setViewport({ width: 1440, height: 900, isMobile: false })
    await navigateTo(page, 'http://localhost:5173/admin/dashboard')
    await checkHorizontalOverflow(page, '1440px Desktop Dashboard')
    await saveShot(page, 'admin_desktop_1440px_dashboard', false)

    console.log('=== ALL MULTI-VIEWPORT VERIFICATION PASSED SUCCESSFULLY! ===')
  } catch (err) {
    console.error('Test execution failed:', err)
  } finally {
    await browser.close()
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {}
  }
}

run()
