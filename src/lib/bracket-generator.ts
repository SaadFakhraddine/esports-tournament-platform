import { PrismaClient, BracketType } from '@prisma/client'

interface Team {
  id: string
  seed: number | null
}

type Slot = 'home' | 'away'

interface BracketTransition {
  bracketType: BracketType
  round: number
  position: number
  slot: Slot
}

interface BracketMatch {
  position: number
  homeTeamId: string | null
  awayTeamId: string | null
  nextMatchWinner?: BracketTransition
  nextMatchLoser?: BracketTransition
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
  const totalRounds = Math.round(Math.log2(totalTeams))

  const brackets: BracketStructure['brackets'] = []

  // Generate all rounds
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = totalTeams / Math.pow(2, round)
    const roundMatches: BracketMatch[] = []

    for (let position = 0; position < matchesInRound; position++) {
      const match: BracketMatch = {
        position,
        homeTeamId: null,
        awayTeamId: null,
      }

      // For first round, assign teams with proper seeding
      if (round === 1) {
        const slot1 = position * 2
        const slot2 = position * 2 + 1

        match.homeTeamId = sortedTeams[slot1]?.id ?? null
        match.awayTeamId = sortedTeams[slot2]?.id ?? null
      }

      // Winners bracket progression
      if (round < totalRounds) {
        match.nextMatchWinner = {
          bracketType: 'MAIN',
          round: round + 1,
          position: Math.floor(position / 2),
          slot: position % 2 === 0 ? 'home' : 'away',
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
            position: i,
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
  const k = Math.round(Math.log2(totalTeams))

  const brackets: BracketStructure['brackets'] = []

  // UI round offsets: winners use 1..k, losers use (k+1).., grand final after that.
  const losersRoundOffset = k
  const internalLosersRounds = 2 * k - 2
  const grandFinalRound = k + internalLosersRounds + 1 // = 3k - 1

  const makeGrandFinalTransition = (position: number, slot: Slot): BracketTransition => ({
    bracketType: 'GRAND_FINAL',
    round: grandFinalRound,
    position,
    slot,
  })

  // k=1 is special: there are no internal losers matches; loser of the winners match goes straight to grand final.
  if (k === 1) {
    brackets.push({
      type: 'WINNERS',
      round: 1,
      matches: [
        {
          position: 0,
          homeTeamId: sortedTeams[0]?.id ?? null,
          awayTeamId: sortedTeams[1]?.id ?? null,
          nextMatchWinner: makeGrandFinalTransition(0, 'home'),
          nextMatchLoser: makeGrandFinalTransition(0, 'away'),
        },
      ],
    })

    brackets.push({
      type: 'GRAND_FINAL',
      round: grandFinalRound,
      matches: [
        {
          position: 0,
          homeTeamId: null,
          awayTeamId: null,
        },
      ],
    })

    return { brackets }
  }

  // Winners bracket rounds
  for (let r = 1; r <= k; r++) {
    const matchesInRound = totalTeams / Math.pow(2, r)
    const roundMatches: BracketMatch[] = []

    for (let position = 0; position < matchesInRound; position++) {
      const match: BracketMatch = {
        position,
        homeTeamId: null,
        awayTeamId: null,
      }

      if (r === 1) {
        const slot1 = position * 2
        const slot2 = position * 2 + 1
        match.homeTeamId = sortedTeams[slot1]?.id ?? null
        match.awayTeamId = sortedTeams[slot2]?.id ?? null
      }

      // Winner advancement inside winners bracket, or into grand final
      if (r < k) {
        match.nextMatchWinner = {
          bracketType: 'WINNERS',
          round: r + 1,
          position: Math.floor(position / 2),
          slot: position % 2 === 0 ? 'home' : 'away',
        }
      } else {
        match.nextMatchWinner = makeGrandFinalTransition(0, 'home')
      }

      // Loser drop to losers bracket (or directly to grand final for k=1 which is handled above)
      if (r === 1) {
        // Losers from winners round 1 fill losers internal round 1
        match.nextMatchLoser = {
          bracketType: 'LOSERS',
          round: losersRoundOffset + 1,
          position: Math.floor(position / 2),
          slot: position % 2 === 0 ? 'home' : 'away',
        }
      } else {
        // Losers from winners round r drop into internal losers round l = 2r - 2
        const loserLogicalRound = 2 * r - 2
        match.nextMatchLoser = {
          bracketType: 'LOSERS',
          round: losersRoundOffset + loserLogicalRound,
          position,
          slot: 'away',
        }
      }

      roundMatches.push(match)
    }

    brackets.push({
      type: 'WINNERS',
      round: r,
      matches: roundMatches,
    })
  }

  // Internal losers bracket rounds
  for (let l = 1; l <= internalLosersRounds; l++) {
    // internalMatchesCount(l) = 2^(k - ceil(l/2) - 1)
    const matchesInRound = Math.pow(2, k - Math.ceil(l / 2) - 1)
    const roundMatches: BracketMatch[] = []

    for (let position = 0; position < matchesInRound; position++) {
      const match: BracketMatch = {
        position,
        homeTeamId: null,
        awayTeamId: null,
      }

      // Winner advancement: odd l -> next even l+1 (same position, winner goes to home)
      // even l -> next odd l+1 (paired positions, winner goes to home/away based on position parity)
      if (l < internalLosersRounds) {
        if (l % 2 === 1) {
          match.nextMatchWinner = {
            bracketType: 'LOSERS',
            round: losersRoundOffset + (l + 1),
            position,
            slot: 'home',
          }
        } else {
          match.nextMatchWinner = {
            bracketType: 'LOSERS',
            round: losersRoundOffset + (l + 1),
            position: Math.floor(position / 2),
            slot: position % 2 === 0 ? 'home' : 'away',
          }
        }
      } else {
        // Last internal losers match -> grand final (losers bracket champion) in away slot
        match.nextMatchWinner = makeGrandFinalTransition(0, 'away')
      }

      roundMatches.push(match)
    }

    brackets.push({
      type: 'LOSERS',
      round: losersRoundOffset + l,
      matches: roundMatches,
    })
  }

  // Grand final
  brackets.push({
    type: 'GRAND_FINAL',
    round: grandFinalRound,
    matches: [
      {
        position: 0,
        homeTeamId: null,
        awayTeamId: null,
      },
    ],
  })

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
      position: i,
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

  const matchIdByKey = new Map<string, string>()
  const keyFor = (bracketType: BracketType, round: number, position: number) =>
    `${bracketType}:${round}:${position}`

  // Create brackets and matches in database
  for (const bracket of bracketStructure.brackets) {
    const createdBracket = await db.bracket.create({
      data: {
        tournamentId,
        type: bracket.type,
        round: bracket.round,
      },
    })

    // Create matches for this bracket (teams can be null until advanced)
    for (const match of bracket.matches) {
      const createdMatch = await db.match.create({
        data: {
          tournamentId,
          bracketId: createdBracket.id,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          status: 'SCHEDULED',
          bestOf: tournament.format === 'ROUND_ROBIN' ? 1 : 3,
          nextMatchId: null,
          nextMatchSlot: null,
          nextMatchLoserId: null,
          nextMatchLoserSlot: null,
        },
      })

      matchIdByKey.set(keyFor(bracket.type, bracket.round, match.position), createdMatch.id)
    }
  }

  // Wire winners/losers progression pointers
  for (const bracket of bracketStructure.brackets) {
    for (const match of bracket.matches) {
      const currentId = matchIdByKey.get(keyFor(bracket.type, bracket.round, match.position))
      if (!currentId) continue

      const data: {
        nextMatchId?: string | null
        nextMatchSlot?: string | null
        nextMatchLoserId?: string | null
        nextMatchLoserSlot?: string | null
      } = {}

      if (match.nextMatchWinner) {
        const nextId = matchIdByKey.get(
          keyFor(match.nextMatchWinner.bracketType, match.nextMatchWinner.round, match.nextMatchWinner.position)
        )
        if (nextId) {
          data.nextMatchId = nextId
          data.nextMatchSlot = match.nextMatchWinner.slot
        }
      }

      if (match.nextMatchLoser) {
        const nextLoserId = matchIdByKey.get(
          keyFor(match.nextMatchLoser.bracketType, match.nextMatchLoser.round, match.nextMatchLoser.position)
        )
        if (nextLoserId) {
          data.nextMatchLoserId = nextLoserId
          data.nextMatchLoserSlot = match.nextMatchLoser.slot
        }
      }

      if (Object.keys(data).length > 0) {
        await db.match.update({
          where: { id: currentId },
          data,
        })
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
