import { PrismaClient, TournamentFormat, BracketType } from '@prisma/client'

interface Team {
  id: string
  seed: number | null
}

interface BracketMatch {
  round: number
  homeTeamId: string
  awayTeamId: string
  nextMatchSlot?: 'home' | 'away'
}

interface BracketStructure {
  brackets: Array<{
    type: BracketType
    round: number
    matches: BracketMatch[]
  }>
}

/**
 * Generates a single elimination bracket
 * Teams are paired based on seeds: 1 vs lowest, 2 vs 2nd lowest, etc.
 */
function generateSingleElimination(teams: Team[]): BracketStructure {
  const sortedTeams = [...teams].sort((a, b) => {
    const seedA = a.seed || 999
    const seedB = b.seed || 999
    return seedA - seedB
  })

  const totalTeams = sortedTeams.length
  const totalRounds = Math.ceil(Math.log2(totalTeams))
  const firstRoundMatches = totalTeams / 2

  const brackets: BracketStructure['brackets'] = []

  // Generate first round
  const firstRoundBracket = {
    type: BracketType.MAIN,
    round: 1,
    matches: [] as BracketMatch[],
  }

  for (let i = 0; i < firstRoundMatches; i++) {
    const topSeed = sortedTeams[i]
    const bottomSeed = sortedTeams[totalTeams - 1 - i]

    firstRoundBracket.matches.push({
      round: 1,
      homeTeamId: topSeed.id,
      awayTeamId: bottomSeed.id,
      nextMatchSlot: i % 2 === 0 ? 'home' : 'away',
    })
  }

  brackets.push(firstRoundBracket)

  // Generate subsequent rounds (empty matches to be filled as tournament progresses)
  let previousRoundMatches = firstRoundMatches
  for (let round = 2; round <= totalRounds; round++) {
    const currentRoundMatches = previousRoundMatches / 2
    const roundBracket = {
      type: BracketType.MAIN,
      round,
      matches: [] as BracketMatch[],
    }

    // We'll create placeholder matches that will be filled when previous round completes
    // For now, we won't create matches without teams

    brackets.push(roundBracket)
    previousRoundMatches = currentRoundMatches
  }

  return { brackets }
}

/**
 * Generates a round robin bracket
 * Every team plays every other team once
 */
function generateRoundRobin(teams: Team[]): BracketStructure {
  const sortedTeams = [...teams].sort((a, b) => {
    const seedA = a.seed || 999
    const seedB = b.seed || 999
    return seedA - seedB
  })

  const brackets: BracketStructure['brackets'] = []
  const totalTeams = sortedTeams.length

  // Generate all possible matchups
  const allMatches: BracketMatch[] = []
  for (let i = 0; i < totalTeams; i++) {
    for (let j = i + 1; j < totalTeams; j++) {
      allMatches.push({
        round: 1, // All round robin matches are in "round 1"
        homeTeamId: sortedTeams[i].id,
        awayTeamId: sortedTeams[j].id,
      })
    }
  }

  brackets.push({
    type: BracketType.MAIN,
    round: 1,
    matches: allMatches,
  })

  return { brackets }
}

/**
 * Generates a double elimination bracket
 * Winners bracket + losers bracket + grand final
 */
function generateDoubleElimination(teams: Team[]): BracketStructure {
  const sortedTeams = [...teams].sort((a, b) => {
    const seedA = a.seed || 999
    const seedB = b.seed || 999
    return seedA - seedB
  })

  const totalTeams = sortedTeams.length
  const firstRoundMatches = totalTeams / 2

  const brackets: BracketStructure['brackets'] = []

  // Generate winners bracket first round
  const winnersFirstRound = {
    type: BracketType.WINNERS,
    round: 1,
    matches: [] as BracketMatch[],
  }

  for (let i = 0; i < firstRoundMatches; i++) {
    const topSeed = sortedTeams[i]
    const bottomSeed = sortedTeams[totalTeams - 1 - i]

    winnersFirstRound.matches.push({
      round: 1,
      homeTeamId: topSeed.id,
      awayTeamId: bottomSeed.id,
      nextMatchSlot: i % 2 === 0 ? 'home' : 'away',
    })
  }

  brackets.push(winnersFirstRound)

  // For now, we'll create the structure for subsequent rounds
  // Losers bracket and grand final matches will be created as the tournament progresses

  return { brackets }
}

/**
 * Generates a Swiss system bracket
 * Teams are paired based on current standings each round
 */
function generateSwiss(teams: Team[]): BracketStructure {
  // Swiss system is dynamic - matchups are determined after each round
  // For the first round, we'll do a simple pairing
  const sortedTeams = [...teams].sort((a, b) => {
    const seedA = a.seed || 999
    const seedB = b.seed || 999
    return seedA - seedB
  })

  const brackets: BracketStructure['brackets'] = []
  const matches: BracketMatch[] = []

  // First round: pair teams sequentially (top half vs bottom half)
  const midpoint = Math.floor(sortedTeams.length / 2)
  for (let i = 0; i < midpoint; i++) {
    matches.push({
      round: 1,
      homeTeamId: sortedTeams[i].id,
      awayTeamId: sortedTeams[midpoint + i].id,
    })
  }

  brackets.push({
    type: BracketType.MAIN,
    round: 1,
    matches,
  })

  return { brackets }
}

/**
 * Main bracket generation function
 * Generates brackets based on tournament format and approved teams
 */
export async function generateBracket(
  db: PrismaClient,
  tournamentId: string
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

  // Clear existing brackets
  await db.bracket.deleteMany({
    where: { tournamentId },
  })

  // Prepare team data with seeds
  const teams: Team[] = tournament.registrations.map((reg) => ({
    id: reg.team.id,
    seed: reg.seed,
  }))

  // Generate bracket structure based on format
  let bracketStructure: BracketStructure
  switch (tournament.format) {
    case TournamentFormat.SINGLE_ELIMINATION:
      bracketStructure = generateSingleElimination(teams)
      break
    case TournamentFormat.DOUBLE_ELIMINATION:
      bracketStructure = generateDoubleElimination(teams)
      break
    case TournamentFormat.ROUND_ROBIN:
      bracketStructure = generateRoundRobin(teams)
      break
    case TournamentFormat.SWISS:
      bracketStructure = generateSwiss(teams)
      break
    default:
      throw new Error(`Unsupported tournament format: ${tournament.format}`)
  }

  // Create brackets and matches in database
  for (const bracket of bracketStructure.brackets) {
    const createdBracket = await db.bracket.create({
      data: {
        tournamentId,
        type: bracket.type,
        round: bracket.round,
      },
    })

    // Create matches for this bracket
    const matchPromises = bracket.matches.map(async (match) => {
      return db.match.create({
        data: {
          tournamentId,
          bracketId: createdBracket.id,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          status: 'SCHEDULED',
          bestOf: tournament.format === TournamentFormat.ROUND_ROBIN ? 1 : 3,
        },
      })
    })

    const createdMatches = await Promise.all(matchPromises)

    // Link matches for progression (for elimination formats)
    if (
      tournament.format === TournamentFormat.SINGLE_ELIMINATION ||
      tournament.format === TournamentFormat.DOUBLE_ELIMINATION
    ) {
      // For first round, link to second round matches
      for (let i = 0; i < createdMatches.length; i++) {
        const nextMatchSlot = bracket.matches[i].nextMatchSlot

        if (nextMatchSlot) {
          // We'll need to create the next round matches first
          // This is a simplified version - full implementation would handle all rounds
        }
      }
    }
  }
}

/**
 * Auto-assigns seeds to teams if they don't have any
 * Based on registration order
 */
export async function autoSeedTeams(
  db: PrismaClient,
  tournamentId: string
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

  let nextSeed = (highestSeed?.seed || 0) + 1

  // Assign seeds
  for (const registration of registrations) {
    await db.tournamentRegistration.update({
      where: { id: registration.id },
      data: { seed: nextSeed++ },
    })
  }
}
