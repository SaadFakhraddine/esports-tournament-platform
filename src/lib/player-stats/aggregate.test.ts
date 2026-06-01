import { describe, expect, test } from 'vitest'
import {
  buildCurrentStreak,
  buildForm,
  buildMatchesOverTime,
  buildWinRateOverTime,
  filterMatchesByRange,
  findBestHighlight,
  matchResultForUser,
  type PlayerMatchRecord,
} from './aggregate'

function match(
  id: string,
  completedAt: Date,
  winnerTeamId: string,
  homeTeamId = 'team-a',
  awayTeamId = 'team-b',
  gameId = 'g1',
  gameName = 'Valorant',
): PlayerMatchRecord {
  return {
    id,
    completedAt,
    homeTeamId,
    awayTeamId,
    winnerTeamId,
    gameId,
    gameName,
  }
}

const teamIds = new Set(['team-a'])

describe('player stats aggregate', () => {
  test('matchResultForUser resolves win and loss', () => {
    expect(matchResultForUser('team-a', 'team-a')).toBe('win')
    expect(matchResultForUser('team-b', 'team-a')).toBe('loss')
    expect(matchResultForUser(null, 'team-a')).toBe('unknown')
  })

  test('filterMatchesByRange keeps recent months only', () => {
    const now = new Date('2026-06-01')
    const matches = [
      match('1', new Date('2026-05-15'), 'team-a'),
      match('2', new Date('2026-01-01'), 'team-a'),
    ]
    const filtered = filterMatchesByRange(matches, '3m', now)
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe('1')
  })

  test('buildCurrentStreak counts consecutive results from newest', () => {
    const matches = [
      match('1', new Date('2026-06-03'), 'team-a'),
      match('2', new Date('2026-06-02'), 'team-a'),
      match('3', new Date('2026-06-01'), 'team-b'),
    ]
    expect(buildCurrentStreak(matches, teamIds)).toEqual({ type: 'win', count: 2 })
  })

  test('buildForm returns newest results first', () => {
    const matches = [
      match('1', new Date('2026-06-03'), 'team-a'),
      match('2', new Date('2026-06-02'), 'team-b'),
    ]
    const form = buildForm(matches, teamIds, 5)
    expect(form).toHaveLength(2)
    expect(form[0]?.result).toBe('win')
    expect(form[1]?.result).toBe('loss')
  })

  test('buildMatchesOverTime buckets by month', () => {
    const matches = [
      match('1', new Date('2026-05-10'), 'team-a'),
      match('2', new Date('2026-05-20'), 'team-b'),
      match('3', new Date('2026-06-01'), 'team-a'),
    ]
    const buckets = buildMatchesOverTime(matches, teamIds)
    expect(buckets).toHaveLength(2)
    expect(buckets[0]?.wins).toBe(1)
    expect(buckets[0]?.losses).toBe(1)
    expect(buckets[1]?.wins).toBe(1)
  })

  test('buildWinRateOverTime is cumulative', () => {
    const matches = [
      match('1', new Date('2026-05-10'), 'team-a'),
      match('2', new Date('2026-05-20'), 'team-b'),
      match('3', new Date('2026-06-01'), 'team-a'),
    ]
    const series = buildWinRateOverTime(matches, teamIds)
    expect(series[0]?.winRate).toBe(50)
    expect(series[1]?.winRate).toBe(67)
  })

  test('findBestHighlight requires minimum played', () => {
    expect(
      findBestHighlight([
        { id: '1', name: 'A', played: 2, wins: 2 },
        { id: '2', name: 'B', played: 5, wins: 3 },
      ]),
    ).toMatchObject({ id: '2', winRate: 60 })
  })
})
