import type { PaymentConfig, SnapCallbacks } from '../types/payment'

interface MidtransSnapApi {
  pay: (snapToken: string, callbacks?: SnapCallbacks) => void
}

declare global {
  interface Window {
    snap?: MidtransSnapApi
  }
}

let snapScriptPromise: Promise<MidtransSnapApi> | null = null
let loadedScriptKey = ''

export function loadMidtransSnap(config: PaymentConfig): Promise<MidtransSnapApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Midtrans Snap hanya dapat dimuat di browser.'))
  }

  if (!config.payment_enabled) {
    return Promise.reject(new Error('Modul pembayaran saat ini sedang dinonaktifkan.'))
  }

  const clientKey = (config.client_key || '').trim()
  const scriptUrl = (config.snap_script_url || '').trim()

  if (!clientKey || !scriptUrl) {
    return Promise.reject(new Error('Konfigurasi Midtrans Client Key dari server belum lengkap.'))
  }

  const cacheKey = `${scriptUrl}|${clientKey}`

  if (window.snap && loadedScriptKey === cacheKey) {
    return Promise.resolve(window.snap)
  }

  if (snapScriptPromise && loadedScriptKey === cacheKey) {
    return snapScriptPromise
  }

  loadedScriptKey = cacheKey
  snapScriptPromise = new Promise<MidtransSnapApi>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-midtrans-snap="true"]`
    )

    if (
      existingScript &&
      existingScript.getAttribute('src') === scriptUrl &&
      existingScript.getAttribute('data-client-key') === clientKey &&
      window.snap
    ) {
      resolve(window.snap)
      return
    }

    if (existingScript) {
      existingScript.remove()
    }

    const script = document.createElement('script')
    script.src = scriptUrl
    script.type = 'text/javascript'
    script.async = true
    script.setAttribute('data-client-key', clientKey)
    script.setAttribute('data-midtrans-snap', 'true')

    script.onload = () => {
      if (window.snap) {
        resolve(window.snap)
      } else {
        snapScriptPromise = null
        reject(new Error('Skrip Midtrans Snap dimuat, tetapi objek window.snap tidak tersedia.'))
      }
    }

    script.onerror = () => {
      snapScriptPromise = null
      reject(new Error('Gagal memuat skrip pembayaran Midtrans Snap. Periksa koneksi internet Anda dan coba lagi.'))
    }

    document.head.appendChild(script)
  })

  return snapScriptPromise
}

export async function openSnapCheckout(
  snapToken: string,
  config: PaymentConfig,
  callbacks: SnapCallbacks
): Promise<void> {
  const snap = await loadMidtransSnap(config)
  snap.pay(snapToken, callbacks)
}
