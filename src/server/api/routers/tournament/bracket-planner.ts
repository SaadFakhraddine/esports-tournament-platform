import { z } from 'zod'
import { TournamentFormat } from '@prisma/client'
import { organizerProcedure } from '@/server/api/trpc'
import { recommendFormat } from '@/lib/bracket-planner/recommend-format'
import { buildPreviewMatches } from '@/lib/bracket-planner/preview-bracket'
import { getPlannerCoachInsight } from '@/lib/ai/planner-coach'

const plannerConstraintsSchema = z.object({
  schedule: z.enum(['single_day', 'multi_day', 'weekly']).optional(),
  playStyle: z.enum(['fast', 'balanced', 'everyone_plays']).optional(),
})

const tournamentFormatSchema = z.nativeEnum(TournamentFormat)

export const tournamentBracketPlanner = {
  recommend: organizerProcedure
    .input(
      z.object({
        teamCount: z.number().int().min(2).max(128),
        constraints: plannerConstraintsSchema.optional(),
      }),
    )
    .query(({ input }) => {
      return recommendFormat(input.teamCount, input.constraints ?? {})
    }),

  explainPlanner: organizerProcedure
    .input(
      z.object({
        teamCount: z.number().int().min(2).max(128),
        constraints: plannerConstraintsSchema.optional(),
      }),
    )
    .query(async ({ input }) => {
      const constraints = input.constraints ?? {}
      const recommendation = recommendFormat(input.teamCount, constraints)
      const coach = await getPlannerCoachInsight(recommendation, constraints)

      return {
        insight: coach.insight,
        source: coach.source,
        primaryFormat: recommendation.primary.format,
        alternativeFormat: recommendation.alternative.format,
      }
    }),

  preview: organizerProcedure
    .input(
      z.object({
        teamCount: z.number().int().min(2).max(128),
        format: tournamentFormatSchema,
      }),
    )
    .query(({ input }) => {
      const matches = buildPreviewMatches(input.teamCount, input.format)
      return {
        teamCount: input.teamCount,
        format: input.format,
        matches,
        isPlanningPreview: true as const,
      }
    }),
}
