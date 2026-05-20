import { z } from 'zod'
import { TournamentFormat } from '@prisma/client'
import { organizerProcedure } from '@/server/api/trpc'
import { recommendFormat } from '@/lib/bracket-planner/recommend-format'
import { buildPreviewMatches } from '@/lib/bracket-planner/preview-bracket'

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
