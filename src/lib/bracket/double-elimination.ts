interface Team {
  id: string
  name: string
  seed?: number
}

interface Match {
  round: number
  position: number
  bracketType: 'WINNERS' | 'LOSERS' | 'GRAND_FINAL'
  homeTeamId: string | null
  awayTeamId: string | null
  nextMatchPosition: number | null
  nextMatchSlot: 'home' | 'away' | null
  loserToPosition: number | null // For winners bracket, where loser goes in losers bracket
}

export function generateDoubleEliminationBracket(teams: Team[]): Match[] {
  const sortedTeams = [...teams].sort((a, b) => (a.seed || 0) - (b.seed || 0))
  const teamCount = sortedTeams.length

  const rounds = Math.ceil(Math.log2(teamCount))
  const matches: Match[] = []

  // Generate Winners Bracket (same as single elimination)
  const winnersRounds = rounds
  for (let round = 1; round <= winnersRounds; round++) {
    const matchesInRound = Math.pow(2, winnersRounds - round)

    for (let position = 0; position < matchesInRound; position++) {
      const match: Match = {
        round,
        position,
        bracketType: 'WINNERS',
        homeTeamId: null,
        awayTeamId: null,
        nextMatchPosition: null,
        nextMatchSlot: null,
        loserToPosition: null,
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

      // Set progression to next round in winners bracket
      if (round < winnersRounds) {
        const nextPosition = Math.floor(position / 2)
        match.nextMatchPosition = nextPosition
        match.nextMatchSlot = position % 2 === 0 ? 'home' : 'away'
      }

      // Losers go to losers bracket
      match.loserToPosition = position

      matches.push(match)
    }
  }
  
  // Ensure we have at least one match
  if (matches.length === 0 && teamCount > 0) {
    // Create at least one match
    matches.push({
      round: 1,
      position: 0,
      bracketType: 'WINNERS',
      homeTeamId: sortedTeams[0]?.id || null,
      awayTeamId: sortedTeams[1]?.id || null,
      nextMatchPosition: null,
      nextMatchSlot: null,
      loserToPosition: null,
    })
  }

  // Generate Losers Bracket (more complex, alternates between dropdowns and advancement)
  const losersRounds = winnersRounds * 2 - 1
  for (let round = 1; round <= losersRounds; round++) {
    const matchesInRound = Math.ceil(teamCount / Math.pow(2, Math.ceil((round + 1) / 2)))

    for (let position = 0; position < matchesInRound; position++) {
      const match: Match = {
        round,
        position,
        bracketType: 'LOSERS',
        homeTeamId: null,
        awayTeamId: null,
        nextMatchPosition: null,
        nextMatchSlot: null,
        loserToPosition: null,
      }

      // Set progression
      if (round < losersRounds) {
        const nextPosition = Math.floor(position / 2)
        match.nextMatchPosition = nextPosition
        match.nextMatchSlot = position % 2 === 0 ? 'home' : 'away'
      }

      matches.push(match)
    }
  }

  // Grand Finals
  matches.push({
    round: 1,
    position: 0,
    bracketType: 'GRAND_FINAL',
    homeTeamId: null, // Winner of winners bracket
    awayTeamId: null, // Winner of losers bracket
    nextMatchPosition: null,
    nextMatchSlot: null,
    loserToPosition: null,
  })

  return matches
}
