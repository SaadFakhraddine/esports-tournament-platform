interface Team {
  id: string
  name: string
  seed?: number
}

interface Match {
  round: number
  position: number
  homeTeamId: string | null
  awayTeamId: string | null
  nextMatchPosition: number | null
  nextMatchSlot: 'home' | 'away' | null
}

export function generateSingleEliminationBracket(teams: Team[]): Match[] {
  const sortedTeams = [...teams].sort((a, b) => (a.seed || 0) - (b.seed || 0))
  const teamCount = sortedTeams.length

  // Calculate number of rounds needed
  const totalRounds = Math.ceil(Math.log2(teamCount))

  const matches: Match[] = []

  // Generate all rounds
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = Math.pow(2, totalRounds - round)

    for (let position = 0; position < matchesInRound; position++) {
      const match: Match = {
        round,
        position,
        homeTeamId: null,
        awayTeamId: null,
        nextMatchPosition: null,
        nextMatchSlot: null,
      }

      // For first round, assign teams
      if (round === 1) {
        const homeTeamIndex = position * 2
        const awayTeamIndex = position * 2 + 1

        if (homeTeamIndex < sortedTeams.length) {
          match.homeTeamId = sortedTeams[homeTeamIndex]?.id || null
        }

        if (awayTeamIndex < sortedTeams.length) {
          match.awayTeamId = sortedTeams[awayTeamIndex]?.id || null
        }
      }

      // Set progression to next round
      if (round < totalRounds) {
        const nextPosition = Math.floor(position / 2)
        match.nextMatchPosition = nextPosition
        match.nextMatchSlot = position % 2 === 0 ? 'home' : 'away'
      }

      matches.push(match)
    }
  }

  return matches
}

export function calculateTotalRounds(teamCount: number): number {
  return Math.ceil(Math.log2(teamCount))
}

export function calculateTotalMatches(teamCount: number): number {
  const rounds = calculateTotalRounds(teamCount)
  return Math.pow(2, rounds) - 1
}
