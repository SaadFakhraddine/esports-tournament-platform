import { describe, expect, test } from 'vitest'
import { computeFormatStats } from './format-stats'
import { recommendFormat } from './recommend-format'

describe('computeFormatStats', () => {
  test('single elimination for 8 teams has no byes', () => {
    const stats = computeFormatStats(8, 'SINGLE_ELIMINATION')
    expect(stats.matchCount).toBe(7)
    expect(stats.byeCount).toBe(0)
    expect(stats.bracketSlots).toBe(8)
  })

  test('single elimination for 13 teams pads to 16', () => {
    const stats = computeFormatStats(13, 'SINGLE_ELIMINATION')
    expect(stats.byeCount).toBe(3)
    expect(stats.bracketSlots).toBe(16)
    expect(stats.matchCount).toBe(12)
  })

  test('round robin match count scales with n', () => {
    expect(computeFormatStats(4, 'ROUND_ROBIN').matchCount).toBe(6)
    expect(computeFormatStats(13, 'ROUND_ROBIN').matchCount).toBe(78)
  })
})

describe('recommendFormat', () => {
  test('favors single elimination for single-day fast events', () => {
    const result = recommendFormat(13, {
      schedule: 'single_day',
      playStyle: 'fast',
    })
    expect(result.primary.format).toBe('SINGLE_ELIMINATION')
    expect(result.alternative.format).not.toBe('ROUND_ROBIN')
  })

  test('penalizes round robin for large n on single day', () => {
    const result = recommendFormat(16, {
      schedule: 'single_day',
      playStyle: 'balanced',
    })
    const rr = result.recommendations.find((r) => r.format === 'ROUND_ROBIN')
    expect(rr!.rank).toBeGreaterThan(2)
  })

  test('favors swiss when everyone must play multiple games', () => {
    const result = recommendFormat(13, {
      schedule: 'weekly',
      playStyle: 'everyone_plays',
    })
    expect(['SWISS', 'ROUND_ROBIN']).toContain(result.primary.format)
  })

  test('returns four ranked recommendations', () => {
    const result = recommendFormat(8)
    expect(result.recommendations).toHaveLength(4)
    expect(result.recommendations[0]!.rank).toBe(1)
  })
})
