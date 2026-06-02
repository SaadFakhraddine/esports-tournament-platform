import { describe, expect, test } from 'vitest'
import { getSeasonLabel, suggestTournamentNames } from './suggest-names'

describe('getSeasonLabel', () => {
  test('maps months to seasons with year', () => {
    expect(getSeasonLabel(new Date('2026-03-15'))).toBe('Spring 2026')
    expect(getSeasonLabel(new Date('2026-07-01'))).toBe('Summer 2026')
    expect(getSeasonLabel(new Date('2026-10-20'))).toBe('Fall 2026')
    expect(getSeasonLabel(new Date('2026-01-05'))).toBe('Winter 2026')
  })
})

describe('suggestTournamentNames', () => {
  test('returns empty list without a game name', () => {
    expect(suggestTournamentNames({ gameName: '  ', format: 'SINGLE_ELIMINATION' })).toEqual([])
  })

  test('returns requested count of unique names including the game', () => {
    let i = 0
    const random = () => {
      const values = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
      return values[i++ % values.length]!
    }

    const names = suggestTournamentNames({
      gameName: 'Valorant',
      format: 'DOUBLE_ELIMINATION',
      startDate: new Date('2026-06-01'),
      count: 3,
      random,
    })

    expect(names).toHaveLength(3)
    expect(new Set(names).size).toBe(3)
    for (const name of names) {
      expect(name).toContain('Valorant')
    }
  })
})
