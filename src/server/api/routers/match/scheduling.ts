import { z } from 'zod'
import { protectedProcedure, organizerProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { MatchStatus } from '@prisma/client'

export const matchScheduling = {
  /** Set or clear `scheduledAt` (organizer / admin). Does not change match result. */
  setSchedule: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        scheduledAt: z.union([z.date(), z.null()]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db.match.findUnique({
        where: { id: input.matchId },
        include: { tournament: true },
      })

      if (!match) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Match not found',
        })
      }

      const isOrganizer = match.tournament.organizerId === ctx.session.user.id
      const isAdmin = ctx.session.user.role === 'ADMIN'

      if (!isOrganizer && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to schedule this match',
        })
      }

      if (match.status !== MatchStatus.SCHEDULED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only matches in SCHEDULED state can be scheduled',
        })
      }

      return ctx.db.match.update({
        where: { id: input.matchId },
        data: { scheduledAt: input.scheduledAt },
      })
    }),

  updateStatus: organizerProcedure
    .input(
      z.object({
        matchId: z.string(),
        status: z.nativeEnum(MatchStatus),
        scheduledAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db.match.findUnique({
        where: { id: input.matchId },
        include: {
          tournament: true,
        },
      })

      if (!match) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Match not found',
        })
      }

      const isOrganizer = match.tournament.organizerId === ctx.session.user.id
      const isAdmin = ctx.session.user.role === 'ADMIN'

      if (!isOrganizer && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this match',
        })
      }

      const updated = await ctx.db.match.update({
        where: { id: input.matchId },
        data: {
          status: input.status,
          ...(input.scheduledAt && { scheduledAt: input.scheduledAt }),
          ...(input.status === MatchStatus.IN_PROGRESS && { startedAt: new Date() }),
        },
      })

      return updated
    }),
}
