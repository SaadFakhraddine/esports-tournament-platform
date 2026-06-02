import { PrismaClient, BracketType } from '@prisma/client'
import type { BracketStructure, BracketTransition, Team } from './types'
import {
  generateDoubleElimination,
  generateRoundRobin,
  generateSingleElimination,
  generateSwiss,
} from './structure'

/**
 * Main bracket generation function
 * Generates brackets based on tournament format and approved teams
 */
export async function generateBracket(
  db: PrismaClient,
  tournamentId: string,
): Promise<void> {
  // Get tournament details
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      registrations: {
        where: { status: 'APPROVED' },
        include: {
          team: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  })

  if (!tournament) {
    throw new Error('Tournament not found')
  }

  if (tournament.registrations.length < 2) {
    throw new Error('At least 2 teams are required to generate a bracket')
  }

  // Prepare team data with seeds
  const teams: Team[] = tournament.registrations
    .filter((reg) => reg.team?.id) // Ensure team exists
    .map((reg) => ({
      id: reg.team.id,
      seed: reg.seed,
    }))

  const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0
  const isEliminationFormat =
    tournament.format === 'SINGLE_ELIMINATION' || tournament.format === 'DOUBLE_ELIMINATION'

  if (isEliminationFormat && !isPowerOfTwo(teams.length)) {
    throw new Error('For elimination formats, the number of teams must be a power of two')
  }

  // Generate bracket structure based on format
  let bracketStructure: BracketStructure
  switch (tournament.format) {
    case 'SINGLE_ELIMINATION':
      bracketStructure = generateSingleElimination(teams)
      break
    case 'DOUBLE_ELIMINATION':
      bracketStructure = generateDoubleElimination(teams)
      break
    case 'ROUND_ROBIN':
      bracketStructure = generateRoundRobin(teams)
      break
    case 'SWISS':
      bracketStructure = generateSwiss(teams)
      break
    default:
      throw new Error(`Unsupported tournament format: ${tournament.format}`)
  }

  const keyFor = (bracketType: BracketType, round: number, position: number) =>
    `${bracketType}:${round}:${position}`

  const bestOf = tournament.format === 'ROUND_ROBIN' ? 1 : 3

  await db.$transaction(async (tx) => {
    await tx.bracket.deleteMany({
      where: { tournamentId },
    })

    type PendingMatch = {
      bracketType: BracketType
      round: number
      position: number
      bracketId: string
      homeTeamId: string | null
      awayTeamId: string | null
      nextMatchWinner?: BracketTransition
      nextMatchLoser?: BracketTransition
    }

    const pendingMatches: PendingMatch[] = []

    for (const bracket of bracketStructure.brackets) {
      const createdBracket = await tx.bracket.create({
        data: {
          tournamentId,
          type: bracket.type,
          round: bracket.round,
        },
      })

      for (const match of bracket.matches) {
        pendingMatches.push({
          bracketType: bracket.type,
          round: bracket.round,
          position: match.position,
          bracketId: createdBracket.id,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          nextMatchWinner: match.nextMatchWinner,
          nextMatchLoser: match.nextMatchLoser,
        })
      }
    }

    const createdMatches = await tx.match.createManyAndReturn({
      data: pendingMatches.map((m) => ({
        tournamentId,
        bracketId: m.bracketId,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        status: 'SCHEDULED' as const,
        bestOf,
        nextMatchId: null,
        nextMatchSlot: null,
        nextMatchLoserId: null,
        nextMatchLoserSlot: null,
      })),
    })

    const matchIdByKey = new Map<string, string>()
    pendingMatches.forEach((pending, index) => {
      const created = createdMatches[index]
      if (created) {
        matchIdByKey.set(keyFor(pending.bracketType, pending.round, pending.position), created.id)
      }
    })

    const progressionUpdates = pendingMatches.flatMap((pending) => {
      const currentId = matchIdByKey.get(keyFor(pending.bracketType, pending.round, pending.position))
      if (!currentId) return []

      const data: {
        nextMatchId?: string | null
        nextMatchSlot?: string | null
        nextMatchLoserId?: string | null
        nextMatchLoserSlot?: string | null
      } = {}

      if (pending.nextMatchWinner) {
        const nextId = matchIdByKey.get(
          keyFor(
            pending.nextMatchWinner.bracketType,
            pending.nextMatchWinner.round,
            pending.nextMatchWinner.position,
          ),
        )
        if (nextId) {
          data.nextMatchId = nextId
          data.nextMatchSlot = pending.nextMatchWinner.slot
        }
      }

      if (pending.nextMatchLoser) {
        const nextLoserId = matchIdByKey.get(
          keyFor(
            pending.nextMatchLoser.bracketType,
            pending.nextMatchLoser.round,
            pending.nextMatchLoser.position,
          ),
        )
        if (nextLoserId) {
          data.nextMatchLoserId = nextLoserId
          data.nextMatchLoserSlot = pending.nextMatchLoser.slot
        }
      }

      if (Object.keys(data).length === 0) return []

      return [
        tx.match.update({
          where: { id: currentId },
          data,
        }),
      ]
    })

    if (progressionUpdates.length > 0) {
      await Promise.all(progressionUpdates)
    }
  })
}

/**
 * Auto-assigns seeds to teams if they don't have any
 * Based on registration order
 */
export async function autoSeedTeams(
  db: PrismaClient,
  tournamentId: string,
): Promise<void> {
  const registrations = await db.tournamentRegistration.findMany({
    where: {
      tournamentId,
      status: 'APPROVED',
      seed: null,
    },
    orderBy: {
      registeredAt: 'asc',
    },
  })

  // Get the highest existing seed
  const highestSeed = await db.tournamentRegistration.findFirst({
    where: {
      tournamentId,
      status: 'APPROVED',
      seed: { not: null },
    },
    orderBy: {
      seed: 'desc',
    },
  })

  const nextSeed = (highestSeed?.seed || 0) + 1

  if (registrations.length === 0) return

  await db.$transaction(
    registrations.map((registration, index) =>
      db.tournamentRegistration.update({
        where: { id: registration.id },
        data: { seed: nextSeed + index },
      }),
    ),
  )
}
