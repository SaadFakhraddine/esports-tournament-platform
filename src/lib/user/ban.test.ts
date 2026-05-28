import { describe, expect, test } from 'vitest'
import { isUserBanned, assertUserNotBanned } from './ban'

describe('user ban helpers', () => {
  test('isUserBanned is true when bannedAt is set', () => {
    expect(isUserBanned(new Date())).toBe(true)
    expect(isUserBanned(null)).toBe(false)
    expect(isUserBanned(undefined)).toBe(false)
  })

  test('assertUserNotBanned throws for banned users', () => {
    expect(() => assertUserNotBanned(new Date())).toThrow(/suspended/i)
    expect(() => assertUserNotBanned(null)).not.toThrow()
  })
})
