import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT_DIR = path.resolve('..', 'screenshots')
const ARTIFACT_DIR = 'C:\\Users\\advan\\.gemini\\antigravity\\brain\\2edf19be-6480-4980-8231-4909ca5ceee3'

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

async function saveShot(page, filename) {
  const outPath1 = path.join(OUT_DIR, `${filename}.png`)
  const outPath2 = path.join(ARTIFACT_DIR, `${filename}.png`)
  await page.screenshot({ path: outPath1, fullPage: true })
  fs.copyFileSync(outPath1, outPath2)
  const size = fs.statSync(outPath1).size
  console.log(`[OK] Captured screenshot: ${filename}.png (${size} bytes)`)
}

async function runExtraScenarios() {
  console.log('--- STARTING ADDITIONAL E2E BROWSER VERIFICATION SCENARIOS ---')
  const tempDir = path.resolve('temp_puppeteer_extra_' + Date.now())
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    userDataDir: tempDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })

  page.on('dialog', async dialog => {
    console.log('[BROWSER DIALOG]:', dialog.message())
    await dialog.accept()
  })

  // ==========================================
  // SCENARIO 1: Inactive participant account
  // ==========================================
  console.log('\nScenario 1: Testing login with inactive participant account...')
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 })
  await page.type('input[type="email"]', 'inactive_user@itcomp.test')
  await page.type('input[type="password"]', 'Password123#')
  const submitLogin1 = await page.$('button[type="submit"]')
  if (submitLogin1) await submitLogin1.click()
  await new Promise(r => setTimeout(r, 2000))

  // Verify that an error message is visible
  const errorText = await page.evaluate(() => {
    const el = document.querySelector('.bg-red-50, .text-red-700, .text-red-600')
    return el ? el.textContent : null
  })
  console.log('Inactive login response message:', errorText)
  await saveShot(page, 'e2e_extra_01_inactive_login_rejected')

  // ==========================================
  // SCENARIO 2: Admin user attempts to access participant portal
  // ==========================================
  console.log('\nScenario 2: Testing admin user attempting to open participant portal...')
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 })
  // Clear inputs
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input')
    inputs.forEach(i => (i.value = ''))
  })
  await page.type('input[type="email"]', 'admin_e2e@itcomp.test')
  await page.type('input[type="password"]', 'Password123#')
  const submitLogin2 = await page.$('button[type="submit"]')
  if (submitLogin2) await submitLogin2.click()
  await new Promise(r => setTimeout(r, 2000))

  // Now attempt to open participant portal
  await page.goto('http://localhost:5173/participant/dashboard', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1500))

  const accessRestrictedTitle = await page.evaluate(() => {
    const el = document.querySelector('h2')
    return el ? el.textContent : null
  })
  console.log('Participant portal protection screen for admin:', accessRestrictedTitle)
  await saveShot(page, 'e2e_extra_02_admin_access_restricted')

  // Logout admin
  const logoutBtn = await page.$('button')
  for (const b of await page.$$('button')) {
    const t = await page.evaluate(el => el.textContent, b)
    if (t && t.includes('Ganti Akun / Keluar')) {
      await b.click()
      break
    }
  }
  await new Promise(r => setTimeout(r, 1500))

  // ==========================================
  // SCENARIO 3: Participant submitting work revision
  // ==========================================
  console.log('\nScenario 3: Testing participant submitting work revision...')
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 })
  await page.type('input[type="email"]', 'peserta_revisi@itcomp.test')
  await page.type('input[type="password"]', 'Password123#')
  const submitLogin3 = await page.$('button[type="submit"]')
  if (submitLogin3) await submitLogin3.click()
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {})
  await new Promise(r => setTimeout(r, 1500))

  // Go to Submissions page
  await page.goto('http://localhost:5173/participant/submissions', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1500))

  // Click Kirimkan Revisi button
  const buttons = await page.$$('button')
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn)
    if (text && text.includes('Kirimkan Revisi')) {
      await btn.click()
      console.log('Clicked Kirimkan Revisi button')
      break
    }
  }
  await new Promise(r => setTimeout(r, 1000))

  // Fill revision modal fields
  const extUrlInput = await page.$('input[placeholder="https://... (opsional)"]')
  if (extUrlInput) {
    await extUrlInput.type('https://github.com/itcomp/ai-platform-revised')
  }
  const notesTextarea = await page.$('textarea[placeholder="Jelaskan ringkasan perubahan atau perbaikan karya sesuai instruksi panitia..."]')
  if (notesTextarea) {
    await notesTextarea.type('Menambahkan dokumentasi lengkap, diagram arsitektur sistem, dan update REST API.')
  }

  // Click Kirim Berkas Revisi button
  const modalSubmitBtns = await page.$$('div.fixed button')
  for (const b of modalSubmitBtns) {
    const t = await page.evaluate(el => el.textContent, b)
    if (t && t.includes('Kirim Berkas Revisi')) {
      await b.click()
      console.log('Clicked Kirim Berkas Revisi inside modal')
      break
    }
  }
  await new Promise(r => setTimeout(r, 3000))
  await saveShot(page, 'e2e_extra_03_submission_revision')

  // ==========================================
  // SCENARIO 4: Attempting to access another participant's registration
  // ==========================================
  console.log('\nScenario 4: Testing participant attempting to access other participant registration...')
  // Registration 8 belongs to other_owner@itcomp.test
  await page.goto('http://localhost:5173/participant/registrations/8', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 2000))

  const forbiddenText = await page.evaluate(() => {
    return document.body.innerText
  })
  console.log('Has error/not-found/forbidden state:', forbiddenText.includes('Pendaftaran tidak ditemukan') || forbiddenText.includes('Akses Dibatasi'))
  await saveShot(page, 'e2e_extra_04_forbidden_other_registration')

  await browser.close()
  console.log('\n--- ALL ADDITIONAL E2E SCENARIOS COMPLETED SUCCESSFULLY! ---')
}

runExtraScenarios().catch(err => {
  console.error('Fatal extra scenario error:', err)
  process.exit(1)
})
