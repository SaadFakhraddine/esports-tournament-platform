import { z } from 'zod'
import { organizerProcedure } from '@/server/api/trpc'
import { createTournamentSchema, updateTournamentSchema } from '@/lib/validators/tournament'
import { TRPCError } from '@trpc/server'
import { TournamentStatus } from '@prisma/client'

export const tournamentCrud = {
  create: organizerProcedure.input(createTournamentSchema).mutation(async ({ ctx, input }) => {
    const organizerExists = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { id: true },
    })
    if (!organizerExists) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message:
          'Your session does not match a user in the database. Sign out and sign in again (common after a database reset).',
      })
    }

    const tournament = await ctx.db.tournament.create({
      data: {
        ...input,
        organizerId: ctx.session.user.id,
      },
    })

    return tournament
  }),

  update: organizerProcedure.input(updateTournamentSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input

    const tournament = await ctx.db.tournament.findUnique({
      where: { id },
    })

    if (!tournament) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Tournament not found',
      })
    }

    if (tournament.organizerId !== ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this tournament',
      })
    }

    if (
      data.status === TournamentStatus.REGISTRATION &&
      tournament.status !== TournamentStatus.DRAFT &&
      tournament.status !== TournamentStatus.REGISTRATION
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'Registration cannot be reopened after the tournament has left the registration phase. Create a new tournament to add teams.',
      })
    }

    const updated = await ctx.db.tournament.update({
      where: { id },
      data,
    })

    return updated
  }),

  delete: organizerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
      })

      if (!tournament) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found',
        })
      }

      if (tournament.organizerId !== ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this tournament',
        })
      }

      await ctx.db.tournament.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
}
