import { describe, expect, test } from 'vitest'
import { buildPreviewMatches } from './preview-bracket'

describe('buildPreviewMatches', () => {
  test('single elimination preview has n-1 matches worth of rounds structure', () => {
    const matches = buildPreviewMatches(8, 'SINGLE_ELIMINATION')
    expect(matches.length).toBe(7)
    expect(matches[0]?.team1?.name).toBe('Team 1')
    expect(matches[0]?.team2?.name).toBe('Team 2')
  })

  test('single elimination with 13 teams includes bye slots in round 1', () => {
    const matches = buildPreviewMatches(13, 'SINGLE_ELIMINATION')
    const round1 = matches.filter((m) => m.round === 1)
    expect(round1.length).toBe(8)
    const withOneTeam = round1.filter((m) => !m.team1 || !m.team2)
    expect(withOneTeam.length).toBeGreaterThan(0)
  })

  test('round robin preview generates pairings', () => {
    const matches = buildPreviewMatches(4, 'ROUND_ROBIN')
    expect(matches.length).toBe(6)
  })

  test('swiss preview has multiple rounds', () => {
    const matches = buildPreviewMatches(10, 'SWISS')
    const rounds = new Set(matches.map((m) => m.round))
    expect(rounds.size).toBeGreaterThan(1)
  })
})
