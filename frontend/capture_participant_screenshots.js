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
  console.log(`Saved screenshot: ${filename}.png (${fs.statSync(outPath1).size} bytes)`)
}

async function main() {
  console.log('Launching Chrome from:', CHROME_PATH)
  const tempDir = path.resolve('temp_puppeteer_user_data_' + Date.now())
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    userDataDir: tempDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })

  // 1. Capture Login Page
  console.log('Navigating to /login...')
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, '07_login')

  // 2. Capture Register Page
  console.log('Navigating to /register...')
  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, '08_register')

  // 3. Perform Participant Registration to Log In End-to-End
  const testEmail = `peserta_${Date.now()}@itcomp.test`
  console.log(`Registering test participant with email: ${testEmail}...`)

  await page.type('input[type="text"]', 'Ahmad Rizky Pratama')
  await page.type('input[type="email"]', testEmail)
  const passInputs = await page.$$('input[type="password"]')
  if (passInputs.length >= 2) {
    await passInputs[0].type('Password123#')
    await passInputs[1].type('Password123#')
  }
  const checkbox = await page.$('input[type="checkbox"]')
  if (checkbox) {
    await checkbox.click()
  }

  // Click Submit
  const submitBtn = await page.$('button[type="submit"]')
  if (submitBtn) {
    await submitBtn.click()
  }

  // Wait for redirect to /participant/dashboard
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {})
  await new Promise(r => setTimeout(r, 2000))
  console.log('Current URL after registration:', page.url())

  // 4. Capture Participant Dashboard
  await saveShot(page, '09_participant_dashboard')

  // 5. Capture Participant Registrations List
  console.log('Navigating to /participant/registrations...')
  await page.goto('http://localhost:5173/participant/registrations', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, '10_participant_registrations')

  // 6. Capture Participant Registration Create Wizard
  console.log('Navigating to /participant/registrations/create...')
  await page.goto('http://localhost:5173/participant/registrations/create', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, '11_participant_registration_create')

  // 7. Capture Participant Teams Page
  console.log('Navigating to /participant/teams...')
  await page.goto('http://localhost:5173/participant/teams', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, '12_participant_teams')

  // 8. Capture Participant Submissions Page
  console.log('Navigating to /participant/submissions...')
  await page.goto('http://localhost:5173/participant/submissions', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, '13_participant_submissions')

  // 9. Capture Participant Notifications Page
  console.log('Navigating to /participant/notifications...')
  await page.goto('http://localhost:5173/participant/notifications', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, '14_participant_notifications')

  // 10. Capture Participant Profile Page
  console.log('Navigating to /participant/profile...')
  await page.goto('http://localhost:5173/participant/profile', { waitUntil: 'networkidle0', timeout: 15000 })
  await new Promise(r => setTimeout(r, 1000))
  await saveShot(page, '15_participant_profile')

  await browser.close()
  console.log('Participant portal screenshot capture complete!')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
