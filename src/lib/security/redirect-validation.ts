/**
 * Security utility for validating redirect URLs to prevent open redirect vulnerabilities
 */

// Allowlist of safe internal redirect paths
const ALLOWED_REDIRECT_PREFIXES = [
  '/dashboard',
  '/tournaments',
  '/teams',
  '/settings',
] as const

/**
 * Validates a redirect URL against an allowlist to prevent open redirect attacks
 *
 * @param url - The URL to validate (typically from query params or form input)
 * @param defaultPath - The default safe path to return if validation fails
 * @returns A validated safe redirect path
 *
 * @example
 * ```ts
 * // Safe internal path
 * validateRedirectUrl('/tournaments/123') // '/tournaments/123'
 *
 * // Malicious external URL
 * validateRedirectUrl('https://evil.com') // '/dashboard'
 *
 * // Protocol-relative URL attack
 * validateRedirectUrl('//evil.com') // '/dashboard'
 * ```
 */
export function validateRedirectUrl(
  url: string | null | undefined,
  defaultPath: string = '/dashboard'
): string {
  // Handle null/undefined
  if (!url) return defaultPath

  // Must be a relative path starting with /
  if (!url.startsWith('/')) return defaultPath

  // Prevent protocol-relative URLs (//evil.com)
  if (url.startsWith('//')) return defaultPath

  try {
    // Decode to catch encoded attacks (%2F%2F -> //)
    const decoded = decodeURIComponent(url)

    // Re-check after decoding
    if (decoded.startsWith('//') || decoded.includes('://')) {
      return defaultPath
    }

    // Additional safety: prevent backslash tricks on Windows
    if (decoded.includes('\\')) return defaultPath

    // Check against allowlist using prefix matching
    const isAllowed = ALLOWED_REDIRECT_PREFIXES.some(prefix =>
      decoded.startsWith(prefix)
    )

    return isAllowed ? decoded : defaultPath
  } catch {
    // If decoding fails, return safe default
    return defaultPath
  }
}

/**
 * Add a custom allowed redirect prefix (useful for dynamic routes)
 * Note: Use with caution and only add trusted internal paths
 */
export function isPathAllowed(path: string): boolean {
  try {
    const decoded = decodeURIComponent(path)
    return ALLOWED_REDIRECT_PREFIXES.some(prefix => decoded.startsWith(prefix))
  } catch {
    return false
  }
}

/**
 * Get the list of allowed redirect prefixes (for debugging/testing)
 */
export function getAllowedPrefixes(): readonly string[] {
  return ALLOWED_REDIRECT_PREFIXES
}
