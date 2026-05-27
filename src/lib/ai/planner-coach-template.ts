import { FORMAT_LABELS } from '@/lib/bracket-planner/recommend-format'
import type { PlannerConstraints, RecommendFormatResult } from '@/lib/bracket-planner/types'

const SCHEDULE_LABELS: Record<NonNullable<PlannerConstraints['schedule']>, string> = {
  single_day: 'single day / LAN',
  multi_day: 'multi-day event',
  weekly: 'weekly league',
}

const PLAY_STYLE_LABELS: Record<NonNullable<PlannerConstraints['playStyle']>, string> = {
  fast: 'fast — crown a winner quickly',
  balanced: 'balanced',
  everyone_plays: 'everyone plays multiple games',
}

export function buildTemplateCoachInsight(
  result: RecommendFormatResult,
  constraints: PlannerConstraints,
): string {
  const schedule = SCHEDULE_LABELS[constraints.schedule ?? 'multi_day']
  const playStyle = PLAY_STYLE_LABELS[constraints.playStyle ?? 'balanced']
  const primary = result.primary
  const alternative = result.alternative
  const primaryName = FORMAT_LABELS[primary.format]
  const altName = FORMAT_LABELS[alternative.format]
  const primaryDetail = primary.pros[0] ?? primary.summary
  const altDetail = (alternative.pros[0] ?? alternative.summary).replace(/^\+\s*/, '')

  return (
    `For ${result.teamCount} teams on a ${schedule} with ${playStyle} play, ` +
    `${primaryName} is the best fit (${primary.summary}). ${primaryDetail} ` +
    `If you need a different tradeoff, ${altName} (${alternative.summary}) is a strong alternative — ${altDetail}.`
  )
}
