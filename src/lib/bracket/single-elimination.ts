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
  
  // For single elimination, we need to handle byes when team count is not a power of 2
  const totalRounds = Math.ceil(Math.log2(teamCount))
  // Byes are handled implicitly by leaving teams as null in early slots.
  
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
      
      // For first round, assign teams with proper seeding
      if (round === 1) {
        // Calculate team indices using standard tournament seeding
        const slot1 = position * 2
        const slot2 = position * 2 + 1
          
        // Handle byes: teams in the first slots get byes
        if (slot1 < teamCount) {
          match.homeTeamId = sortedTeams[slot1]?.id || null
        }
        if (slot2 < teamCount) {
          match.awayTeamId = sortedTeams[slot2]?.id || null
        }
          
        // If one team has a bye, they automatically advance
        // We need to handle this by marking the match appropriately
        if ((slot1 < teamCount && slot2 >= teamCount) || (slot2 < teamCount && slot1 >= teamCount)) {
          // Mark that this match has a bye
          // We'll handle this when creating the actual match in the database
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
  
  // Handle byes: if a match has only one team, it should advance automatically
  // We can mark these matches for special handling
  
  return matches
}

export function calculateTotalRounds(teamCount: number): number {
  return Math.ceil(Math.log2(teamCount))
}

export function calculateTotalMatches(teamCount: number): number {
  const rounds = calculateTotalRounds(teamCount)
  return Math.pow(2, rounds) - 1
}
