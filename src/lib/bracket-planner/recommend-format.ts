import { computeFormatStats } from './format-stats'
import type {
  FormatRecommendation,
  PlannerConstraints,
  RecommendFormatResult,
  TournamentFormatId,
} from './types'

const ALL_FORMATS: TournamentFormatId[] = [
  'SINGLE_ELIMINATION',
  'DOUBLE_ELIMINATION',
  'ROUND_ROBIN',
  'SWISS',
]

const FORMAT_LABELS: Record<TournamentFormatId, string> = {
  SINGLE_ELIMINATION: 'Single elimination',
  DOUBLE_ELIMINATION: 'Double elimination',
  ROUND_ROBIN: 'Round robin',
  SWISS: 'Swiss',
}

function buildExplanation(
  stats: ReturnType<typeof computeFormatStats>,
  teamCount: number,
): Pick<FormatRecommendation, 'summary' | 'pros' | 'cons'> {
  const label = FORMAT_LABELS[stats.format]
  const pros: string[] = []
  const cons: string[] = []

  switch (stats.format) {
    case 'SINGLE_ELIMINATION':
      pros.push(`${stats.matchCount} total matches — fastest path to a champion`)
      if (stats.byeCount > 0) {
        pros.push(
          `Fits ${teamCount} teams in a ${stats.bracketSlots}-slot bracket (${stats.byeCount} bye${stats.byeCount === 1 ? '' : 's'} for top seeds)`,
        )
        cons.push('Some teams skip the first round')
      } else {
        pros.push('Clean bracket with no byes')
      }
      cons.push('One loss eliminates a team')
      break
    case 'DOUBLE_ELIMINATION':
      pros.push('Teams get a second chance through the losers bracket')
      cons.push(`~${stats.matchCount} matches and more complex scheduling`)
      if (stats.byeCount > 0) {
        cons.push(`${stats.byeCount} bye${stats.byeCount === 1 ? '' : 's'} needed in the winners bracket`)
      }
      break
    case 'ROUND_ROBIN':
      pros.push('Every team plays every other team — maximum fairness')
      cons.push(`${stats.matchCount} matches — heavy schedule for ${teamCount} teams`)
      if (teamCount > 8) {
        cons.push('Best for leagues spanning multiple weeks')
      }
      break
    case 'SWISS': {
      const rounds = stats.swissRounds ?? 0
      pros.push(`~${rounds} rounds; everyone plays multiple games without elimination`)
      pros.push('No byes required for odd team counts')
      cons.push('Standings-based pairing; less dramatic than a knockout finale')
      break
    }
  }

  const summary = `${label}: ~${stats.matchCount} matches, ~${stats.estimatedHours}h at 45 min/match`

  return { summary, pros, cons }
}

function scoreFormat(
  teamCount: number,
  format: TournamentFormatId,
  constraints: PlannerConstraints,
): number {
  const stats = computeFormatStats(teamCount, format)
  let score = 50

  const schedule = constraints.schedule ?? 'multi_day'
  const playStyle = constraints.playStyle ?? 'balanced'

  if (schedule === 'single_day') {
    if (format === 'SINGLE_ELIMINATION') score += 35
    if (format === 'ROUND_ROBIN') score -= 40
    if (format === 'DOUBLE_ELIMINATION') score -= 10
    if (stats.estimatedHours > 8) score -= 25
    if (stats.estimatedHours <= 6) score += 10
  }

  if (schedule === 'weekly') {
    if (format === 'SWISS' || format === 'ROUND_ROBIN') score += 20
    if (format === 'SINGLE_ELIMINATION') score += 5
  }

  if (playStyle === 'fast') {
    if (format === 'SINGLE_ELIMINATION') score += 25
    if (format === 'ROUND_ROBIN') score -= 30
  }

  if (playStyle === 'everyone_plays') {
    if (format === 'SWISS') score += 30
    if (format === 'ROUND_ROBIN' && teamCount <= 8) score += 15
    if (format === 'SINGLE_ELIMINATION') score -= 15
  }

  if (playStyle === 'balanced') {
    if (format === 'SWISS') score += 10
    if (format === 'SINGLE_ELIMINATION' && teamCount <= 16) score += 10
  }

  if (teamCount > 16 && format === 'ROUND_ROBIN') score -= 35
  if (teamCount > 32 && format === 'DOUBLE_ELIMINATION') score -= 20
  if (teamCount >= 5 && teamCount <= 20 && format === 'SWISS') score += 8

  if (stats.byeCount > teamCount * 0.25 && format === 'SINGLE_ELIMINATION') {
    score -= 8
  }

  return score
}

export function recommendFormat(
  teamCount: number,
  constraints: PlannerConstraints = {},
): RecommendFormatResult {
  if (teamCount < 2) {
    throw new Error('At least 2 teams are required')
  }

  const scored = ALL_FORMATS.map((format) => {
    const stats = computeFormatStats(teamCount, format)
    const score = scoreFormat(teamCount, format, constraints)
    const explanation = buildExplanation(stats, teamCount)
    return {
      format,
      score,
      stats,
      ...explanation,
    }
  }).sort((a, b) => b.score - a.score)

  const recommendations: FormatRecommendation[] = scored.map((item, index) => ({
    format: item.format,
    rank: index + 1,
    score: item.score,
    stats: item.stats,
    summary: item.summary,
    pros: item.pros,
    cons: item.cons,
  }))

  return {
    teamCount,
    recommendations,
    primary: recommendations[0]!,
    alternative: recommendations[1]!,
  }
}

export { FORMAT_LABELS }
