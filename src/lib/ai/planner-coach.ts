import { FORMAT_LABELS } from '@/lib/bracket-planner/recommend-format'
import type { PlannerConstraints, RecommendFormatResult } from '@/lib/bracket-planner/types'
import { generateGeminiText, isGeminiConfigured } from './gemini'
import { buildTemplateCoachInsight } from './planner-coach-template'

export type PlannerCoachSource = 'ai' | 'template'

export interface PlannerCoachResult {
  insight: string
  source: PlannerCoachSource
}

const SCHEDULE_LABELS: Record<NonNullable<PlannerConstraints['schedule']>, string> = {
  single_day: 'Single day / LAN',
  multi_day: 'Multi-day event',
  weekly: 'Weekly league',
}

const PLAY_STYLE_LABELS: Record<NonNullable<PlannerConstraints['playStyle']>, string> = {
  fast: 'Fast — crown a winner quickly',
  balanced: 'Balanced',
  everyone_plays: 'Everyone plays multiple games',
}

const SYSTEM_PROMPT = `You are an esports tournament planning advisor.
The app has already ranked tournament formats using a deterministic engine.
Your job is to explain the recommendation in 2–4 clear sentences for an organizer.
Rules:
- Do not contradict the provided primary (rank 1) or alternative (rank 2) formats.
- Mention both primary and alternative and the tradeoff between them.
- Reference match counts and estimated hours from the data when helpful.
- Be concise and practical. No bullet lists. No markdown headings.`

function buildGeminiUserPrompt(
  result: RecommendFormatResult,
  constraints: PlannerConstraints,
): string {
  const payload = {
    teamCount: result.teamCount,
    schedule: SCHEDULE_LABELS[constraints.schedule ?? 'multi_day'],
    playStyle: PLAY_STYLE_LABELS[constraints.playStyle ?? 'balanced'],
    primary: {
      format: FORMAT_LABELS[result.primary.format],
      rank: result.primary.rank,
      summary: result.primary.summary,
      pros: result.primary.pros,
      cons: result.primary.cons,
      stats: result.primary.stats,
    },
    alternative: {
      format: FORMAT_LABELS[result.alternative.format],
      rank: result.alternative.rank,
      summary: result.alternative.summary,
      pros: result.alternative.pros,
      cons: result.alternative.cons,
      stats: result.alternative.stats,
    },
  }

  return `Explain this planner recommendation to the organizer:\n\n${JSON.stringify(payload, null, 2)}`
}

async function generateGeminiCoachInsight(
  result: RecommendFormatResult,
  constraints: PlannerConstraints,
): Promise<string> {
  return generateGeminiText(SYSTEM_PROMPT, buildGeminiUserPrompt(result, constraints))
}

export async function getPlannerCoachInsight(
  result: RecommendFormatResult,
  constraints: PlannerConstraints,
): Promise<PlannerCoachResult> {
  if (!isGeminiConfigured()) {
    return {
      insight: buildTemplateCoachInsight(result, constraints),
      source: 'template',
    }
  }

  try {
    const insight = await generateGeminiCoachInsight(result, constraints)
    return { insight, source: 'ai' }
  } catch (error) {
    console.warn('[planner-coach] Gemini failed, using template fallback:', error)
    return {
      insight: buildTemplateCoachInsight(result, constraints),
      source: 'template',
    }
  }
}
