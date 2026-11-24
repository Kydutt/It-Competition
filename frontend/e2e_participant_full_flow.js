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

async function runE2E() {
  console.log('--- STARTING COMPREHENSIVE E2E PARTICIPANT AUDIT ---')
  const tempDir = path.resolve('temp_puppeteer_e2e_' + Date.now())
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

  // 1. Direct access without login -> must redirect to login with redirect param
  console.log('Step 1: Testing unauthenticated access to /participant/dashboard...')
  await page.goto('http://localhost:5173/participant/dashboard', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  const currentUrl = page.url()
  console.log('Redirected to:', currentUrl)
  if (!currentUrl.includes('/login')) {
    throw new Error('Expected redirect to /login but was ' + currentUrl)
  }
  await saveShot(page, 'e2e_01_redirect_unauth')

  // 2. Register new participant
  console.log('Step 2: Registering a new participant...')
  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0', timeout: 15000 })
  const testEmail = `auditor_${Date.now()}@itcomp.test`
  await page.type('input[type="text"]', 'Auditor Peserta E2E')
  await page.type('input[type="email"]', testEmail)
  const pwdInputs = await page.$$('input[type="password"]')
  await pwdInputs[0].type('Password123#')
  await pwdInputs[1].type('Password123#')
  const checkbox = await page.$('input[type="checkbox"]')
  if (checkbox) await checkbox.click()

  const submitRegister = await page.$('button[type="submit"]')
  await submitRegister.click()

  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {})
  await new Promise(r => setTimeout(r, 2000))
  console.log('URL after register:', page.url())
  await saveShot(page, 'e2e_02_registered_dashboard')

  // 3. Edit profile
  console.log('Step 3: Updating participant profile...')
  await page.goto('http://localhost:5173/participant/profile', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))

  await page.type('input[type="tel"]', '081234567899')
  const instInput = await page.$('input[placeholder="Contoh: Universitas Indonesia"]')
  if (instInput) await instInput.type('Universitas Indonesia')
  await page.select('select', 'S1')
  const identInput = await page.$('input[placeholder="Nomor identitas resmi"]')
  if (identInput) await identInput.type('3171012345670001')
  const addrInput = await page.$('textarea')
  if (addrInput) await addrInput.type('Jl. Salemba Raya No. 4, Jakarta Pusat')

  const saveProfileBtn = await page.$('button[type="submit"]')
  if (saveProfileBtn) await saveProfileBtn.click()
  await new Promise(r => setTimeout(r, 2000))
  await saveShot(page, 'e2e_03_profile_saved')

  // 4. Create Team
  console.log('Step 4: Creating a new team...')
  await page.goto('http://localhost:5173/participant/teams', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))

  const openModalBtn = await page.$('button:has(svg.lucide-plus-circle)')
  if (openModalBtn) {
    await openModalBtn.click()
    await new Promise(r => setTimeout(r, 500))
    const teamNameInput = await page.$('input[placeholder="Contoh: Garuda Tech, Syntax Error"]')
    if (teamNameInput) {
      await teamNameInput.type('Tim Nusantara E2E')
      const modalBtns = await page.$$('div.fixed button')
      for (const btn of modalBtns) {
        const text = await page.evaluate(el => el.textContent, btn)
        if (text && text.includes('Buat Tim')) {
          await btn.click()
          break
        }
      }
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  await saveShot(page, 'e2e_04_team_created')

  // 5. Create Draft Registration (Select Individual Competition: Competitive Programming)
  console.log('Step 5: Creating draft registration for Competitive Programming (Individual)...')
  await page.goto('http://localhost:5173/participant/registrations/create', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1500))

  // Find the card containing Competitive Programming
  const compCards = await page.$$('div.cursor-pointer')
  for (const card of compCards) {
    const text = await page.evaluate(el => el.textContent, card)
    if (text && text.includes('Competitive Programming')) {
      await card.click()
      console.log('Selected competition: Competitive Programming')
      break
    }
  }
  await new Promise(r => setTimeout(r, 800))

  // Click Submit Draf Pendaftaran button
  const submitDraftBtn = await page.$('button[type="submit"]')
  if (submitDraftBtn) {
    await submitDraftBtn.click()
  }
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {})
  await new Promise(r => setTimeout(r, 2000))
  console.log('URL after creating draft:', page.url())
  await saveShot(page, 'e2e_05_draft_created')

  // 6. Upload Document to Private Storage
  console.log('Step 6: Uploading private document...')
  const dummyFilePath = path.resolve('test_identity_ktm.pdf')
  fs.writeFileSync(dummyFilePath, '%PDF-1.4 DUMMY PDF CONTENT FOR IDENTITY VERIFICATION IN PRIVATE STORAGE')

  const fileInput = await page.$('input[type="file"]')
  if (fileInput) {
    await fileInput.uploadFile(dummyFilePath)
    await page.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })), fileInput)
    await new Promise(r => setTimeout(r, 800))

    // Click Unggah Dokumen button inside the form
    const uploadFormBtn = await page.$('form button[type="submit"]')
    if (uploadFormBtn) {
      await uploadFormBtn.click()
    }
    await new Promise(r => setTimeout(r, 3000))
  }
  await saveShot(page, 'e2e_06_document_uploaded')

  // 7. Submit Registration Final
  console.log('Step 7: Submitting registration final...')
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const target = btns.find(b => b.textContent && b.textContent.includes('Kirim Pendaftaran Sekarang'))
    if (target) {
      target.click()
    }
  })
  await new Promise(r => setTimeout(r, 3000))
  await saveShot(page, 'e2e_07_registration_submitted')

  // 8. View Registrations List
  console.log('Step 8: Viewing registrations list...')
  await page.goto('http://localhost:5173/participant/registrations', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, 'e2e_08_registrations_list')

  // 9. View Notifications
  console.log('Step 9: Viewing notifications...')
  await page.goto('http://localhost:5173/participant/notifications', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, 'e2e_09_notifications')

  // 10. Refresh on Private Page
  console.log('Step 10: Refreshing private page to test session persistence...')
  await page.reload({ waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1000))
  if (page.url().includes('/login')) {
    throw new Error('Session lost after reload! Redirected to /login')
  }
  await saveShot(page, 'e2e_10_refreshed_session_intact')

  // 11. Logout
  console.log('Step 11: Testing logout...')
  const logoutBtns = await page.$$('button')
  for (const btn of logoutBtns) {
    const text = await page.evaluate(el => el.textContent, btn)
    if (text && text.includes('Keluar')) {
      await btn.click()
      break
    }
  }
  await new Promise(r => setTimeout(r, 2000))
  console.log('URL after logout:', page.url())
  await saveShot(page, 'e2e_11_logged_out')

  // Clean up dummy file
  if (fs.existsSync(dummyFilePath)) {
    fs.unlinkSync(dummyFilePath)
  }

  await browser.close()
  console.log('--- ALL E2E BROWSER TESTS SUCCEEDED! ---')
}

runE2E().catch(err => {
  console.error('Fatal E2E error:', err)
  process.exit(1)
})
