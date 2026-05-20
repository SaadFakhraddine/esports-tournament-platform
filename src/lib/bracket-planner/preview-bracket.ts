import { swissRoundCount, nextPowerOf2 } from './format-stats'
import type { TournamentFormatId } from './types'

export interface PreviewTeam {
  id: string
  name: string
}

export interface PreviewMatch {
  id: string
  round: number
  matchNumber: number
  status: string
  team1: PreviewTeam | null
  team2: PreviewTeam | null
  team1Score: number
  team2Score: number
}

function makeTeams(teamCount: number): PreviewTeam[] {
  return Array.from({ length: teamCount }, (_, i) => ({
    id: `preview-team-${i + 1}`,
    name: `Team ${i + 1}`,
  }))
}

function buildSingleEliminationPreview(teams: PreviewTeam[]): PreviewMatch[] {
  const bracketSize = nextPowerOf2(teams.length)
  const totalRounds = Math.log2(bracketSize)
  const matches: PreviewMatch[] = []
  let matchNumber = 1

  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round)
    for (let position = 0; position < matchesInRound; position++) {
      let team1: PreviewTeam | null = null
      let team2: PreviewTeam | null = null

      if (round === 1) {
        const slot1 = position * 2
        const slot2 = position * 2 + 1
        team1 = teams[slot1] ?? null
        team2 = teams[slot2] ?? null
      }

      matches.push({
        id: `preview-${round}-${position}`,
        round,
        matchNumber: matchNumber++,
        status: 'SCHEDULED',
        team1,
        team2,
        team1Score: 0,
        team2Score: 0,
      })
    }
  }

  return matches
}

function buildRoundRobinPreview(teams: PreviewTeam[]): PreviewMatch[] {
  const matches: PreviewMatch[] = []
  let matchNumber = 1
  const teamIds = teams.map((t) => t.id)
  const isOdd = teamIds.length % 2 === 1
  const scheduleTeams = isOdd ? [...teamIds, '__bye__'] : [...teamIds]
  const n = scheduleTeams.length
  const rounds = isOdd ? teamIds.length : teamIds.length - 1
  const teamById = new Map(teams.map((t) => [t.id, t]))

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < n / 2; i++) {
      const homeId = scheduleTeams[i]
      const awayId = scheduleTeams[n - 1 - i]
      if (!homeId || !awayId || homeId === '__bye__' || awayId === '__bye__') continue

      const isHome = round % 2 === 0 ? i === 0 : i !== 0
      const home = teamById.get(isHome ? homeId : awayId)!
      const away = teamById.get(isHome ? awayId : homeId)!

      matches.push({
        id: `preview-rr-${round + 1}-${i}`,
        round: round + 1,
        matchNumber: matchNumber++,
        status: 'SCHEDULED',
        team1: home,
        team2: away,
        team1Score: 0,
        team2Score: 0,
      })
    }

    const last = scheduleTeams.pop()
    if (last !== undefined) {
      scheduleTeams.splice(1, 0, last)
    }
  }

  return matches
}

function buildSwissPreview(teams: PreviewTeam[]): PreviewMatch[] {
  const rounds = swissRoundCount(teams.length)
  const matches: PreviewMatch[] = []
  let matchNumber = 1
  const midpoint = Math.floor(teams.length / 2)

  for (let round = 1; round <= rounds; round++) {
    for (let i = 0; i < midpoint; i++) {
      matches.push({
        id: `preview-swiss-${round}-${i}`,
        round,
        matchNumber: matchNumber++,
        status: 'SCHEDULED',
        team1: teams[i] ?? null,
        team2: teams[midpoint + i] ?? null,
        team1Score: 0,
        team2Score: 0,
      })
    }
  }

  return matches
}

/** Double elim preview: winners bracket round 1 only (full DE tree is very large). */
function buildDoubleEliminationPreview(teams: PreviewTeam[]): PreviewMatch[] {
  const bracketSize = nextPowerOf2(teams.length)
  const matchesInRound1 = bracketSize / 2
  const matches: PreviewMatch[] = []

  for (let position = 0; position < matchesInRound1; position++) {
    const slot1 = position * 2
    const slot2 = position * 2 + 1
    matches.push({
      id: `preview-de-w1-${position}`,
      round: 1,
      matchNumber: position + 1,
      status: 'SCHEDULED',
      team1: teams[slot1] ?? null,
      team2: teams[slot2] ?? null,
      team1Score: 0,
      team2Score: 0,
    })
  }

  return matches
}

export function buildPreviewMatches(
  teamCount: number,
  format: TournamentFormatId,
): PreviewMatch[] {
  if (teamCount < 2) {
    throw new Error('At least 2 teams are required for preview')
  }

  const teams = makeTeams(teamCount)

  switch (format) {
    case 'SINGLE_ELIMINATION':
      return buildSingleEliminationPreview(teams)
    case 'DOUBLE_ELIMINATION':
      return buildDoubleEliminationPreview(teams)
    case 'ROUND_ROBIN':
      return buildRoundRobinPreview(teams)
    case 'SWISS':
      return buildSwissPreview(teams)
    default:
      return []
  }
}
