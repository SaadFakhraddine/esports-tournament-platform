interface Team {
  id: string
  name: string
  seed?: number
}

interface Match {
  round: number
  position: number
  homeTeamId: string
  awayTeamId: string
}

export function generateRoundRobinBracket(teams: Team[]): Match[] {
  const matches: Match[] = []
  const teamCount = teams.length
  
  if (teamCount < 2) {
    return matches
  }
  
  // Use the circle method for proper round robin scheduling
  const teamIds = teams.map(team => team.id)
  
  // If odd number of teams, add a dummy for bye
  const isOdd = teamCount % 2 === 1
  const scheduleTeams = isOdd ? [...teamIds, null] : [...teamIds]
  const n = scheduleTeams.length
  
  const rounds = isOdd ? teamCount : teamCount - 1
  
  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < n / 2; i++) {
      const home = scheduleTeams[i]
      const away = scheduleTeams[n - 1 - i]
      
      // Skip if either is the dummy (bye)
      if (home !== null && away !== null) {
        // Alternate home/away each round
        const isHome = round % 2 === 0 ? i === 0 : i !== 0
        
        matches.push({
          round: round + 1,
          position: matches.filter(m => m.round === round + 1).length,
          homeTeamId: isHome ? home : away,
          awayTeamId: isHome ? away : home,
        })
      }
    }
    
    // Rotate teams for next round (keep first team fixed)
    const last = scheduleTeams.pop()
    if (last !== undefined) {
      scheduleTeams.splice(1, 0, last)
    }
  }
  
  return matches
}

export function calculateRoundRobinMatches(teamCount: number): number {
  // Formula: n * (n - 1) / 2
  return (teamCount * (teamCount - 1)) / 2
}

export function calculateRoundRobinRounds(teamCount: number): number {
  // In standard round robin, if teams play once: n - 1 rounds (each team plays every other team once)
  // For even number of teams: n - 1
  // For odd number: n
  return teamCount % 2 === 0 ? teamCount - 1 : teamCount
}
