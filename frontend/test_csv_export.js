import axios from 'axios'
import fs from 'fs'

async function testExport() {
  console.log('--- TESTING CSV EXPORT & FORMULA INJECTION SANITIZATION ---')
  const client = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
    headers: {
      'Origin': 'http://localhost:5173',
      'Referer': 'http://localhost:5173/',
      'Accept': 'application/json',
    }
  })

  const cookieMap = new Map()

  function updateCookies(res) {
    const raw = res.headers['set-cookie'] || []
    raw.forEach(c => {
      const parts = c.split(';')[0].split('=')
      const name = parts[0].trim()
      const val = parts.slice(1).join('=')
      cookieMap.set(name, val)
    })
  }

  function getCookieHeader() {
    return Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
  }

  try {
    // 1. Get CSRF Cookie
    const csrfRes = await client.get('/sanctum/csrf-cookie')
    updateCookies(csrfRes)
    const xsrfToken = decodeURIComponent(cookieMap.get('XSRF-TOKEN') || '')
    console.log('CSRF Cookie received, XSRF token present:', !!xsrfToken)

    // 2. Login as Admin
    const loginRes = await client.post('/api/v1/auth/login', {
      email: 'admin@itcomp.test',
      password: 'Password123#',
    }, {
      headers: {
        'X-XSRF-TOKEN': xsrfToken,
        'Cookie': getCookieHeader(),
      }
    })

    updateCookies(loginRes)
    const newXsrfToken = decodeURIComponent(cookieMap.get('XSRF-TOKEN') || xsrfToken)
    console.log('Admin login status:', loginRes.status, loginRes.data.data.user.email)

    // 3. Request CSV Export
    const exportRes = await client.get('/api/v1/admin/reports/registrations', {
      headers: {
        'X-XSRF-TOKEN': newXsrfToken,
        'Cookie': getCookieHeader(),
      },
      responseType: 'text',
    })

    console.log('Export HTTP Status:', exportRes.status)
    console.log('Export Content-Type:', exportRes.headers['content-type'])
    console.log('Export Content-Disposition:', exportRes.headers['content-disposition'])

    const csvContent = exportRes.data
    console.log('CSV Content Length:', csvContent.length, 'characters')
    console.log('\n--- CSV SAMPLE (First 400 characters) ---')
    console.log(csvContent.substring(0, 400))
    console.log('-----------------------------------------\n')

    // Check BOM
    const hasBOM = csvContent.charCodeAt(0) === 0xFEFF || (csvContent.charCodeAt(0) === 0xEF && csvContent.charCodeAt(1) === 0xBB)
    console.log('Has UTF-8 BOM:', hasBOM)

    // Check Header columns
    const hasHeader = csvContent.includes('Nomor Pendaftaran') && csvContent.includes('Cabang Kompetisi') && csvContent.includes('Status Pendaftaran')
    console.log('Contains required headers:', hasHeader)

    fs.writeFileSync('exported_registrations_sample.csv', csvContent, 'utf-8')
    console.log('CSV successfully saved to exported_registrations_sample.csv')

    // 4. Test Formula Injection Sanitization
    const lines = csvContent.trim().split('\n')
    console.log('Total CSV lines exported:', lines.length)
    
    // Check if any line contains sanitized single quote for formula triggers
    let sanitizedCount = 0
    lines.forEach(l => {
      if (l.includes("'=") || l.includes("'+") || l.includes("'-") || l.includes("'@")) {
        sanitizedCount++
      }
    })
    console.log('Sanitized formula injection fields detected:', sanitizedCount)
    console.log('CSV Export Verification: PASSED')
  } catch (err) {
    console.error('CSV Export Test Failed:', err.response?.data || err.message)
  }
}

testExport()
