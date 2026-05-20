import type { Prisma } from '@prisma/client'

/**
 * Builds Prisma where clause for listing/searching teams.
 * Resolves game by id, slug, or name (same idea as tournament list filters).
 */
export function buildTeamListWhere(input: {
  game?: string
  search?: string
}): Prisma.TeamWhereInput {
  const andConditions: Prisma.TeamWhereInput[] = []

  const gameKey = input.game?.trim()
  if (gameKey) {
    andConditions.push({
      game: {
        OR: [
          { id: gameKey },
          { slug: gameKey },
          { name: { equals: gameKey, mode: 'insensitive' } },
        ],
        active: true,
      },
    })
  }

  const term = input.search?.trim()
  if (term) {
    andConditions.push({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        {
          AND: [
            { tag: { not: null } },
            { tag: { contains: term, mode: 'insensitive' } },
          ],
        },
      ],
    })
  }

  if (andConditions.length === 0) {
    return {}
  }

  return { AND: andConditions }
}
