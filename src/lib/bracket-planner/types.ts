export type TournamentFormatId =
  | 'SINGLE_ELIMINATION'
  | 'DOUBLE_ELIMINATION'
  | 'ROUND_ROBIN'
  | 'SWISS'

export type ScheduleConstraint = 'single_day' | 'multi_day' | 'weekly'

export type PlayStyleConstraint = 'fast' | 'balanced' | 'everyone_plays'

export interface PlannerConstraints {
  schedule?: ScheduleConstraint
  playStyle?: PlayStyleConstraint
}

export interface FormatStats {
  format: TournamentFormatId
  matchCount: number
  roundCount: number
  byeCount: number
  bracketSlots: number | null
  estimatedHours: number
  swissRounds: number | null
}

export interface FormatRecommendation {
  format: TournamentFormatId
  rank: number
  score: number
  stats: FormatStats
  summary: string
  pros: string[]
  cons: string[]
}

export interface RecommendFormatResult {
  teamCount: number
  recommendations: FormatRecommendation[]
  primary: FormatRecommendation
  alternative: FormatRecommendation
}
