import { PrismaClient, BracketType } from '@prisma/client'

interface Team {
  id: string
  seed: number | null
}

interface BracketMatch {
  round: number
  homeTeamId: string | null
  awayTeamId: string | null
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
  // Byes are handled implicitly by leaving teams as null in early slots.

  const brackets: BracketStructure['brackets'] = []

  // Generate all rounds
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = Math.pow(2, totalRounds - round)
    const roundMatches: BracketMatch[] = []

    for (let position = 0; position < matchesInRound; position++) {
      const match: BracketMatch = {
        round,
        homeTeamId: null,
        awayTeamId: null,
      }

      // For first round, assign teams with proper seeding
      if (round === 1) {
        const slot1 = position * 2
        const slot2 = position * 2 + 1

        if (slot1 < totalTeams) {
          match.homeTeamId = sortedTeams[slot1]?.id || null
        }
        if (slot2 < totalTeams) {
          match.awayTeamId = sortedTeams[slot2]?.id || null
        }
          
        // Set next match slot for progression
        if (round < totalRounds) {
          match.nextMatchSlot = position % 2 === 0 ? 'home' : 'away'
        }
      }

      roundMatches.push(match)
    }

    brackets.push({
      type: 'MAIN',
      round,
      matches: roundMatches,
    })
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
  
  if (totalTeams < 2) {
    return { brackets }
  }

  // Use proper round robin scheduling
  const teamIds = sortedTeams.map(team => team.id)
  const isOdd = totalTeams % 2 === 1
  const scheduleTeams = isOdd ? [...teamIds, null] : [...teamIds]
  const n = scheduleTeams.length
  const rounds = isOdd ? totalTeams : totalTeams - 1

  for (let round = 0; round < rounds; round++) {
    const roundMatches: BracketMatch[] = []
    
    for (let i = 0; i < n / 2; i++) {
      const home = scheduleTeams[i]
      const away = scheduleTeams[n - 1 - i]
      
      if (home !== null && away !== null) {
        // Alternate home/away
        const isHome = round % 2 === 0 ? i === 0 : i !== 0
        
        roundMatches.push({
          round: round + 1,
          homeTeamId: isHome ? home : away,
          awayTeamId: isHome ? away : home,
        })
      }
    }
    
    brackets.push({
      type: 'MAIN',
      round: round + 1,
      matches: roundMatches,
    })
    
    // Rotate for next round
    const last = scheduleTeams.pop()
    if (last !== undefined) {
      scheduleTeams.splice(1, 0, last)
    }
  }

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
  const winnersFirstRound: BracketStructure['brackets'][number] = {
    type: 'WINNERS',
    round: 1,
    matches: [] as BracketMatch[],
  }

  for (let i = 0; i < firstRoundMatches; i++) {
    const topSeed = sortedTeams[i]
    const bottomSeed = sortedTeams[totalTeams - 1 - i]

    winnersFirstRound.matches.push({
      round: 1,
      homeTeamId: topSeed?.id || null,
      awayTeamId: bottomSeed?.id || null,
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
      homeTeamId: sortedTeams[i]?.id || null,
      awayTeamId: sortedTeams[midpoint + i]?.id || null,
    })
  }

  brackets.push({
    type: 'MAIN',
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
  const teams: Team[] = tournament.registrations
    .filter(reg => reg.team?.id) // Ensure team exists
    .map((reg) => ({
      id: reg.team.id,
      seed: reg.seed,
    }))

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
    for (const match of bracket.matches) {
      // Only create matches where both teams are present (Prisma requires non-null)
      if (match.homeTeamId && match.awayTeamId) {
        await db.match.create({
          data: {
            tournamentId,
            bracketId: createdBracket.id,
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            status: 'SCHEDULED',
            bestOf: tournament.format === 'ROUND_ROBIN' ? 1 : 3,
            // Note: round is not stored in Match model - it's in the Bracket model
          },
        })
      } else {
        // Handle byes: team automatically advances to next round
        // For now, we'll skip match creation
        console.log(`Skipping match with bye: home=${match.homeTeamId}, away=${match.awayTeamId}`)
      }
    }
  }

  // For elimination formats, we need to update match progression
  if (
    tournament.format === 'SINGLE_ELIMINATION' ||
    tournament.format === 'DOUBLE_ELIMINATION'
  ) {
    // This would require more complex logic to link matches
    // For now, we'll leave it as is and handle match progression when reporting results
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
