import axios from 'axios'

const resolveApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (typeof window !== 'undefined' && window.location) {
    const currentHost = window.location.hostname
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      let port = '8000'
      try {
        if (envUrl) {
          port = new URL(envUrl).port || '8000'
        }
      } catch {
        port = '8000'
      }
      return `http://${currentHost}:${port}`
    }
  }
  return envUrl || 'http://localhost:8000'
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
})

/**
 * Perform CSRF handshake with Laravel Sanctum
 */
export async function initCsrf(): Promise<void> {
  await api.get('/sanctum/csrf-cookie')
}

export default api
