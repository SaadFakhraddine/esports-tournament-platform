import type { FormatStats, TournamentFormatId } from './types'

const MINUTES_PER_MATCH = 45

export function nextPowerOf2(n: number): number {
  if (n <= 1) return 2
  let p = 1
  while (p < n) p <<= 1
  return p
}

export function swissRoundCount(teamCount: number): number {
  return Math.max(3, Math.ceil(Math.log2(teamCount)))
}

export function computeFormatStats(
  teamCount: number,
  format: TournamentFormatId,
): FormatStats {
  const bracketSlots =
    format === 'SINGLE_ELIMINATION' || format === 'DOUBLE_ELIMINATION'
      ? nextPowerOf2(teamCount)
      : null

  const byeCount = bracketSlots !== null ? bracketSlots - teamCount : 0

  let matchCount: number
  let roundCount: number
  let swissRounds: number | null = null

  switch (format) {
    case 'SINGLE_ELIMINATION': {
      matchCount = teamCount - 1
      roundCount = Math.ceil(Math.log2(bracketSlots!))
      break
    }
    case 'DOUBLE_ELIMINATION': {
      const k = Math.log2(bracketSlots!)
      matchCount = 2 * teamCount - 2
      roundCount = Math.round(3 * k - 1)
      break
    }
    case 'ROUND_ROBIN': {
      matchCount = (teamCount * (teamCount - 1)) / 2
      roundCount = teamCount % 2 === 0 ? teamCount - 1 : teamCount
      break
    }
    case 'SWISS': {
      swissRounds = swissRoundCount(teamCount)
      matchCount = swissRounds * Math.floor(teamCount / 2)
      roundCount = swissRounds
      break
    }
  }

  const estimatedHours = Math.round(((matchCount * MINUTES_PER_MATCH) / 60) * 10) / 10

  return {
    format,
    matchCount,
    roundCount,
    byeCount,
    bracketSlots,
    estimatedHours,
    swissRounds,
  }
}
