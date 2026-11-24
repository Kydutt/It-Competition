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
  try {
    fs.copyFileSync(outPath1, outPath2)
  } catch (e) {
    console.warn(`Could not copy to artifact dir: ${e.message}`)
  }
  const size = fs.statSync(outPath1).size
  console.log(`  [SCREENSHOT] ${filename}.png (${size} bytes)`)
  return `${filename}.png`
}

async function run() {
  console.log('====================================================')
  console.log('STARTING BROWSER REGISTRATION CREATION VERIFICATION')
  console.log('====================================================\n')

  const tempDir = path.resolve('temp_puppeteer_reg_' + Date.now())
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    userDataDir: tempDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  page.on('dialog', async (dialog) => {
    console.log(`  [DIALOG]: ${dialog.message()}`)
    await dialog.accept()
  })

  const createdRegistrations = []

  try {
    // -----------------------------------------------------------------
    // REGISTRATION 1: Participant 1 (peserta_reg1@itcomp.test)
    // -----------------------------------------------------------------
    console.log('--- 1. Login Participant 1 ---')
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.type('input[type="email"]', 'peserta_reg1@itcomp.test')
    await page.type('input[type="password"]', 'Password123#')
    await page.click('button[type="submit"]')

    await page.waitForFunction(() => window.location.pathname.startsWith('/participant'), { timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    console.log('  Participant 1 logged in, URL:', page.url())

    // Navigate to Create Registration (Competitive Programming Contest - Individual)
    console.log('  Navigating to /participant/registrations/create?competition=competitive-programming-contest-2026...')
    await page.goto(
      'http://localhost:5173/participant/registrations/create?competition=competitive-programming-contest-2026',
      {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      }
    )
    await page.waitForSelector('h1', { timeout: 10000 })
    await new Promise((r) => setTimeout(r, 1500))
    await saveShot(page, 'reg_01_create_page_part1')

    // Fill notes
    const notesArea = await page.$('textarea')
    if (notesArea) {
      await notesArea.type('Catatan pendaftaran verifikasi bugfix pendaftar 1')
    }

    // Submit form
    console.log('  Submitting registration form for Participant 1...')
    await page.click('button[type="submit"]')

    // Wait for redirect to registration detail: /participant/registrations/:id
    await page.waitForFunction(
      () =>
        window.location.pathname.startsWith('/participant/registrations/') &&
        !window.location.pathname.endsWith('/create'),
      { timeout: 15000 }
    )
    await new Promise((r) => setTimeout(r, 2000))
    const reg1DetailUrl = page.url()
    console.log('  Registration 1 created! Redirected to:', reg1DetailUrl)

    // Read registration number from page
    const reg1Number = await page.$eval('span.font-mono, h1, div', (el) => el.textContent).catch(() => '')
    console.log('  Registration 1 number detected on page:', reg1Number)
    await saveShot(page, 'reg_02_detail_part1_success')
    createdRegistrations.push({ participant: 'peserta_reg1@itcomp.test', url: reg1DetailUrl })

    // Logout Participant 1
    console.log('  Logging out Participant 1...')
    await page.goto('http://localhost:5173/participant/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1000))
    const logout1 = await page.$('button ::-p-text(Keluar Sesi)')
    if (logout1) {
      await logout1.click()
      await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 10000 }).catch(() => {})
      await new Promise((r) => setTimeout(r, 1500))
    }

    // -----------------------------------------------------------------
    // REGISTRATION 2: Participant 2 (peserta_reg2@itcomp.test)
    // -----------------------------------------------------------------
    console.log('\n--- 2. Login Participant 2 ---')
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.type('input[type="email"]', 'peserta_reg2@itcomp.test')
    await page.type('input[type="password"]', 'Password123#')
    await page.click('button[type="submit"]')

    await page.waitForFunction(() => window.location.pathname.startsWith('/participant'), { timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    console.log('  Participant 2 logged in, URL:', page.url())

    // Navigate to Create Registration (Competitive Programming Contest - Individual)
    console.log('  Navigating to /participant/registrations/create?competition=competitive-programming-contest-2026...')
    await page.goto(
      'http://localhost:5173/participant/registrations/create?competition=competitive-programming-contest-2026',
      {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      }
    )
    await page.waitForSelector('h1', { timeout: 10000 })
    await new Promise((r) => setTimeout(r, 1500))
    await saveShot(page, 'reg_03_create_page_part2')

    // Fill notes
    const notesArea2 = await page.$('textarea')
    if (notesArea2) {
      await notesArea2.type('Catatan pendaftaran verifikasi bugfix pendaftar 2')
    }

    // Submit form
    console.log('  Submitting registration form for Participant 2...')
    await page.click('button[type="submit"]')

    // Wait for redirect to registration detail
    await page.waitForFunction(
      () =>
        window.location.pathname.startsWith('/participant/registrations/') &&
        !window.location.pathname.endsWith('/create'),
      { timeout: 15000 }
    )
    await new Promise((r) => setTimeout(r, 2000))
    const reg2DetailUrl = page.url()
    console.log('  Registration 2 created! Redirected to:', reg2DetailUrl)

    await saveShot(page, 'reg_04_detail_part2_success')
    createdRegistrations.push({ participant: 'peserta_reg2@itcomp.test', url: reg2DetailUrl })

    console.log('\n====================================================')
    console.log('BOTH REGISTRATIONS CREATED VIA BROWSER SUCCESSFULLY!')
    console.log('====================================================\n')
  } catch (err) {
    console.error('Browser registration test encountered error:', err)
  } finally {
    await browser.close()
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {}
  }
}

run()
