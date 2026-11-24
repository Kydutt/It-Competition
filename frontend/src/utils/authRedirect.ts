import type { UserRole } from '../types/api'

/**
 * Validates whether a target redirect URL is a safe, internal relative path.
 * Strictly neutralizes Open Redirect attacks (e.g. //evil.com, https://evil.com, javascript:).
 */
export function isSafeInternalPath(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()

  // Must begin with '/' and NOT with '//' (protocol-relative URL)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return false
  }

  // Must not contain backslashes or URL scheme separators (e.g. /\evil.com, /http:, javascript:)
  if (trimmed.includes('\\') || trimmed.includes(':')) {
    return false
  }

  return true
}

/**
 * Returns the canonical default dashboard URL for a given user role.
 */
export function getDefaultDashboardForRole(role: UserRole | string | undefined): string {
  if (role === 'admin') {
    return '/admin/dashboard'
  }
  return '/participant/dashboard'
}

/**
 * Resolves the authorized redirect destination for a user based on their authenticated role.
 *
 * Rules:
 * 1. Admin:
 *    - Allowed: /admin/* and allowed public routes (/competitions, /faq, etc.).
 *    - Incompatible: /participant/* routes are strictly blocked and fall back to /admin/dashboard.
 * 2. Participant:
 *    - Allowed: /participant/* and allowed public routes.
 *    - Incompatible: /admin/* routes are strictly blocked and fall back to /participant/dashboard.
 * 3. Any unsafe or invalid URL falls back to the role's canonical dashboard.
 */
export function resolveAuthRedirect(
  role: UserRole | string | undefined,
  requestedRedirect: string | null | undefined
): string {
  const fallback = getDefaultDashboardForRole(role)

  if (!isSafeInternalPath(requestedRedirect)) {
    return fallback
  }

  const targetPath = requestedRedirect!.trim()

  // Do not redirect back to auth pages (/login, /register)
  if (
    targetPath === '/login' ||
    targetPath.startsWith('/login?') ||
    targetPath === '/register' ||
    targetPath.startsWith('/register?')
  ) {
    return fallback
  }

  if (role === 'admin') {
    // Admin cannot be routed into the participant-exclusive portal
    if (targetPath.startsWith('/participant')) {
      return '/admin/dashboard'
    }
    return targetPath
  }

  if (role === 'participant') {
    // Participant CANNOT be routed to the admin-exclusive portal
    if (targetPath.startsWith('/admin')) {
      return '/participant/dashboard'
    }
    return targetPath
  }

  return fallback
}
