import { z } from 'zod'
import { createTRPCContext, publicProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'

export async function getMatchWithRound(
  ctx: Awaited<ReturnType<typeof createTRPCContext>>,
  matchId: string,
) {
  const match = await ctx.db.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
          format: true,
        },
      },
      bracket: {
        select: {
          type: true,
          round: true,
        },
      },
      homeTeam: {
        select: {
          id: true,
          name: true,
          tag: true,
          logo: true,
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          tag: true,
          logo: true,
        },
      },
      resultSubmitter: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!match) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Match not found',
    })
  }

  // Transform to include round field for frontend compatibility
  return {
    ...match,
    round: match.bracket.round,
  }
}

export const matchQueries = {
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return getMatchWithRound(ctx, input.id)
  }),
}
