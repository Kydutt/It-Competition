import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT_DIR = path.resolve('..', 'screenshots')
const ARTIFACT_DIR = 'C:\\Users\\advan\\.gemini\\antigravity\\brain\\2edf19be-6480-4980-8231-4909ca5ceee3'

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

const scenarioResults = {
  scenarioA: null,
  scenarioB: null,
  scenarioC: null,
  scenarioD: null,
  scenarioE: null,
  scenarioF: null,
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

async function runVerification() {
  console.log('====================================================')
  console.log('STARTING BUG FIX VERIFICATION: ROLE AUTHORIZATION & REDIRECT')
  console.log('====================================================\n')

  const tempDir = path.resolve('temp_puppeteer_fix_' + Date.now())
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

  try {
    // ====================================================
    // SKENARIO F: Akses Tanpa Autentikasi
    // ====================================================
    console.log('--- SKENARIO F: Akses Tanpa Autentikasi ---')
    // 1. Visit /admin/dashboard unauth
    await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    const unauthAdminUrl = page.url()
    console.log('  Visiting /admin/dashboard unauth redirected to:', unauthAdminUrl)
    await saveShot(page, 'fix_scenario_f_unauth_admin_redirect')

    // 2. Visit /participant/dashboard unauth
    await page.goto('http://localhost:5173/participant/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1500))
    const unauthPartUrl = page.url()
    console.log('  Visiting /participant/dashboard unauth redirected to:', unauthPartUrl)
    await saveShot(page, 'fix_scenario_f_unauth_participant_redirect')

    scenarioResults.scenarioF = {
      status: unauthAdminUrl.includes('/login') && unauthPartUrl.includes('/login') ? 'PASSED' : 'FAILED',
      adminRedirect: unauthAdminUrl,
      participantRedirect: unauthPartUrl,
    }

    // ====================================================
    // SKENARIO A: Login Admin
    // ====================================================
    console.log('\n--- SKENARIO A: Login Admin ---')
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.type('input[type="email"]', 'admin@itcomp.test')
    await page.type('input[type="password"]', 'Password123#')
    await page.click('button[type="submit"]')

    await page.waitForFunction(() => window.location.pathname.startsWith('/admin'), { timeout: 15000 })
    await new Promise((r) => setTimeout(r, 2000))
    const adminUrlAfterLogin = page.url()
    console.log('  Admin landed at:', adminUrlAfterLogin)
    await saveShot(page, 'fix_scenario_a_admin_dashboard')

    // Refresh browser & verify session persists
    console.log('  Refreshing browser for admin...')
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 2000))
    const adminUrlAfterReload = page.url()
    console.log('  Admin URL after reload:', adminUrlAfterReload)
    await saveShot(page, 'fix_scenario_a_admin_reloaded')

    // Open /admin/activity-logs
    console.log('  Navigating to /admin/activity-logs...')
    await page.goto('http://localhost:5173/admin/activity-logs', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 2000))
    const activityLogsUrl = page.url()
    console.log('  Activity logs URL:', activityLogsUrl)
    await saveShot(page, 'fix_scenario_a_admin_activity_logs')

    scenarioResults.scenarioA = {
      status:
        adminUrlAfterLogin.includes('/admin/dashboard') &&
        adminUrlAfterReload.includes('/admin/dashboard') &&
        activityLogsUrl.includes('/admin/activity-logs')
          ? 'PASSED'
          : 'FAILED',
      initialUrl: adminUrlAfterLogin,
      reloadedUrl: adminUrlAfterReload,
      activityLogsUrl,
    }

    // ====================================================
    // SKENARIO D: Pergantian Akun (Admin Logout -> Participant Login)
    // ====================================================
    console.log('\n--- SKENARIO D: Pergantian Akun (Admin Logout -> Participant Login) ---')
    // Logout admin
    const logoutBtn = await page.$('button[title="Keluar"], button:has(svg.lucide-log-out)')
    if (logoutBtn) {
      await logoutBtn.click()
      await new Promise((r) => setTimeout(r, 2000))
    }
    console.log('  Admin logged out, current URL:', page.url())
    await saveShot(page, 'fix_scenario_d_admin_logged_out')

    // Login as Participant
    console.log('  Logging in as participant...')
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.type('input[type="email"]', 'peserta@itcomp.test')
    await page.type('input[type="password"]', 'Password123#')
    await page.click('button[type="submit"]')

    await page.waitForFunction(() => window.location.pathname.startsWith('/participant'), { timeout: 15000 })
    await new Promise((r) => setTimeout(r, 2000))
    const partUrlAfterSwitch = page.url()
    console.log('  Participant landed at after switch:', partUrlAfterSwitch)
    await saveShot(page, 'fix_scenario_d_participant_landed_clean')

    scenarioResults.scenarioD = {
      status: partUrlAfterSwitch.includes('/participant/dashboard') ? 'PASSED' : 'FAILED',
      destination: partUrlAfterSwitch,
    }

    // ====================================================
    // SKENARIO B: Login Participant (Session persistence & sub-pages)
    // ====================================================
    console.log('\n--- SKENARIO B: Login Participant (Session persistence & sub-pages) ---')
    // Refresh participant dashboard
    console.log('  Refreshing browser for participant...')
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 2000))
    const partUrlAfterReload = page.url()
    console.log('  Participant URL after reload:', partUrlAfterReload)
    await saveShot(page, 'fix_scenario_b_participant_reloaded')

    // Open another participant page (e.g. /participant/profile)
    console.log('  Navigating to /participant/profile...')
    await page.goto('http://localhost:5173/participant/profile', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 2000))
    const partProfileUrl = page.url()
    console.log('  Participant profile URL:', partProfileUrl)
    await saveShot(page, 'fix_scenario_b_participant_profile')

    scenarioResults.scenarioB = {
      status:
        partUrlAfterReload.includes('/participant/dashboard') && partProfileUrl.includes('/participant/profile')
          ? 'PASSED'
          : 'FAILED',
      reloadedUrl: partUrlAfterReload,
      profileUrl: partProfileUrl,
    }

    // ====================================================
    // SKENARIO C: Participant Mengakses URL Admin
    // ====================================================
    console.log('\n--- SKENARIO C: Participant Mengakses URL Admin (/admin/activity-logs) ---')
    await page.goto('http://localhost:5173/admin/activity-logs', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 2000))
    const partAdminAttemptUrl = page.url()
    console.log('  Participant attempted URL:', partAdminAttemptUrl)

    const restrictedHeading = await page.$eval('h2', (el) => el.textContent).catch(() => '')
    console.log('  Restricted Heading displayed:', restrictedHeading)
    await saveShot(page, 'fix_scenario_c_participant_forbidden_activity_logs')

    // Verify button "Kembali ke Dashboard Saya" returns participant to /participant/dashboard
    const returnDashboardBtn = await page.$('button ::-p-text(Kembali ke Dashboard Saya)')
    let returnedOk = false
    if (returnDashboardBtn) {
      await returnDashboardBtn.click()
      await new Promise((r) => setTimeout(r, 2000))
      console.log('  Clicked Kembali ke Dashboard Saya, new URL:', page.url())
      await saveShot(page, 'fix_scenario_c_returned_to_participant_dashboard')
      returnedOk = page.url().includes('/participant/dashboard')
    }

    scenarioResults.scenarioC = {
      status: restrictedHeading.includes('Akses Dibatasi') && returnedOk ? 'PASSED' : 'FAILED',
      heading: restrictedHeading,
      returnedToDashboard: returnedOk,
    }

    // ====================================================
    // SKENARIO E: Redirect Tidak Valid / Cross-Role Redirect
    // ====================================================
    console.log('\n--- SKENARIO E: Redirect Tidak Valid / Cross-Role Redirect ---')
    // Logout first
    await page.goto('http://localhost:5173/participant/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1000))
    const partLogout = await page.$('button ::-p-text(Keluar Sesi)')
    if (partLogout) {
      await partLogout.click()
      await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 10000 }).catch(() => {})
      await new Promise((r) => setTimeout(r, 1000))
    }

    // Test 1: Participant logs in with ?redirect=/admin/activity-logs (THE EXACT REPORTED BUG)
    console.log('  Test E1: Participant login with ?redirect=/admin/activity-logs...')
    await page.goto('http://localhost:5173/login?redirect=%2Fadmin%2Factivity-logs', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.type('input[type="email"]', 'peserta@itcomp.test')
    await page.type('input[type="password"]', 'Password123#')
    await page.click('button[type="submit"]')

    // Must be redirected to /participant/dashboard, NOT /admin/activity-logs!
    await page.waitForFunction(() => window.location.pathname.startsWith('/participant'), { timeout: 15000 })
    await new Promise((r) => setTimeout(r, 2000))
    const e1ResultUrl = page.url()
    console.log('  Test E1 Resulting URL:', e1ResultUrl)
    await saveShot(page, 'fix_scenario_e1_cross_role_redirect_prevented')
    const e1Passed = e1ResultUrl.includes('/participant/dashboard')

    // Logout
    await page.goto('http://localhost:5173/participant/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 1000))
    const partLogout2 = await page.$('button ::-p-text(Keluar Sesi)')
    if (partLogout2) {
      await partLogout2.click()
      await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 10000 }).catch(() => {})
      await new Promise((r) => setTimeout(r, 1000))
    }

    // Test 2: Unknown / Malicious External Redirect
    console.log('  Test E2: Login with ?redirect=https://evil.com...')
    await page.goto('http://localhost:5173/login?redirect=https%3A%2F%2Fevil.com', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.type('input[type="email"]', 'peserta@itcomp.test')
    await page.type('input[type="password"]', 'Password123#')
    await page.click('button[type="submit"]')

    await page.waitForFunction(() => window.location.pathname.startsWith('/participant'), { timeout: 15000 })
    await new Promise((r) => setTimeout(r, 2000))
    const e2ResultUrl = page.url()
    console.log('  Test E2 Resulting URL:', e2ResultUrl)
    await saveShot(page, 'fix_scenario_e2_open_redirect_neutralized')
    const e2Passed = e2ResultUrl.includes('/participant/dashboard')

    scenarioResults.scenarioE = {
      status: e1Passed && e2Passed ? 'PASSED' : 'FAILED',
      crossRoleResult: e1ResultUrl,
      openRedirectResult: e2ResultUrl,
    }

    console.log('\n====================================================')
    console.log('ALL SCENARIOS COMPLETED SUCCESSFULLY!')
    console.log('====================================================\n')
  } catch (err) {
    console.error('Verification failed:', err)
  } finally {
    await browser.close()
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {}
  }

  fs.writeFileSync('scenario_verification_summary.json', JSON.stringify(scenarioResults, null, 2))
  console.log('Summary saved to scenario_verification_summary.json')
}

runVerification()
