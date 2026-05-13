import { Resend } from 'resend'

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

let resendSingleton: Resend | null | undefined

/**
 * Returns a Resend client when RESEND_API_KEY is set; otherwise null.
 * Safe to import at build time (does not throw).
 */
export function getResend(): Resend | null {
  if (resendSingleton !== undefined) {
    return resendSingleton
  }
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) {
    resendSingleton = null
    return null
  }
  resendSingleton = new Resend(key)
  return resendSingleton
}
