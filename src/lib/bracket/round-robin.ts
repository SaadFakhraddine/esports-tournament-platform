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

  // Generate all possible matchups
  let round = 1
  let position = 0

  for (let i = 0; i < teamCount; i++) {
    for (let j = i + 1; j < teamCount; j++) {
      matches.push({
        round,
        position,
        homeTeamId: teams[i]!.id,
        awayTeamId: teams[j]!.id,
      })
      position++

      // Distribute matches across rounds (optional, for better scheduling)
      if (position % Math.floor(teamCount / 2) === 0) {
        round++
        position = 0
      }
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
