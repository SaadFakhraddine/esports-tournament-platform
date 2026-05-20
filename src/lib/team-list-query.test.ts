import { describe, expect, test } from 'vitest'
import { buildTeamListWhere } from './team-list-query'

describe('buildTeamListWhere', () => {
  test('filters by game id, slug, or name via relation', () => {
    const where = buildTeamListWhere({ game: 'valorant' })
    expect(where.AND).toBeDefined()
    const gameClause = (where.AND as object[])[0] as {
      game: { OR: unknown[]; active: boolean }
    }
    expect(gameClause.game.active).toBe(true)
    expect(gameClause.game.OR).toHaveLength(3)
  })

  test('search matches name or non-null tag', () => {
    const where = buildTeamListWhere({ search: 'phx' })
    const searchClause = (where.AND as object[])[0] as { OR: unknown[] }
    expect(searchClause.OR).toHaveLength(2)
  })

  test('ignores blank search', () => {
    expect(buildTeamListWhere({ search: '   ' })).toEqual({})
  })
})
