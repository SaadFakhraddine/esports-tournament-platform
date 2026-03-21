import { z } from 'zod'
import { organizerProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { RegistrationStatus, TournamentStatus } from '@prisma/client'
import { assertTournamentOrganizerOrAdmin, throwTournamentNotFound } from './guards'

export const tournamentBracket = {
  generateBracket: organizerProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { generateBracket, autoSeedTeams } = await import('@/lib/bracket-generator')

      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
      })

      if (!tournament) throwTournamentNotFound()

      assertTournamentOrganizerOrAdmin(
        ctx.session.user,
        tournament.organizerId,
        'You do not have permission to generate brackets for this tournament',
      )

      await autoSeedTeams(ctx.db, input.tournamentId)

      await generateBracket(ctx.db, input.tournamentId)

      return { success: true }
    }),

  regenerateBracket: organizerProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { generateBracket, autoSeedTeams } = await import('@/lib/bracket-generator')

      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          matches: {
            where: {
              status: { in: ['IN_PROGRESS', 'COMPLETED'] },
            },
          },
        },
      })

      if (!tournament) throwTournamentNotFound()

      assertTournamentOrganizerOrAdmin(
        ctx.session.user,
        tournament.organizerId,
        'You do not have permission to regenerate brackets for this tournament',
      )

      if (tournament.status === 'IN_PROGRESS' || tournament.status === 'COMPLETED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot regenerate bracket for a tournament that has started or completed',
        })
      }

      if (tournament.matches.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot regenerate bracket - some matches have already been played',
        })
      }

      await autoSeedTeams(ctx.db, input.tournamentId)

      await generateBracket(ctx.db, input.tournamentId)

      return { success: true }
    }),

  autoSeedTeams: organizerProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { autoSeedTeams } = await import('@/lib/bracket-generator')

      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
      })

      if (!tournament) throwTournamentNotFound()

      assertTournamentOrganizerOrAdmin(
        ctx.session.user,
        tournament.organizerId,
        'You do not have permission to seed teams for this tournament',
      )

      await autoSeedTeams(ctx.db, input.tournamentId)

      return { success: true }
    }),

  startTournament: organizerProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          registrations: {
            where: { status: RegistrationStatus.APPROVED },
          },
          brackets: {
            include: {
              matches: true,
            },
          },
        },
      })

      if (!tournament) throwTournamentNotFound()

      assertTournamentOrganizerOrAdmin(
        ctx.session.user,
        tournament.organizerId,
        'You do not have permission to start this tournament',
      )

      if (tournament.status === TournamentStatus.IN_PROGRESS) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tournament has already started',
        })
      }

      if (tournament.status === TournamentStatus.COMPLETED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tournament is already completed',
        })
      }

      if (tournament.status === TournamentStatus.CANCELLED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot start a cancelled tournament',
        })
      }

      if (tournament.registrations.length < 2) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot start tournament with less than 2 teams (currently ${tournament.registrations.length})`,
        })
      }

      if (tournament.brackets.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot start tournament without a bracket. Please generate the bracket first.',
        })
      }

      const totalMatches = tournament.brackets.reduce(
        (sum, bracket) => sum + bracket.matches.length,
        0,
      )
      if (totalMatches === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot start tournament without any matches. Please regenerate the bracket.',
        })
      }

      const updated = await ctx.db.tournament.update({
        where: { id: input.tournamentId },
        data: {
          status: TournamentStatus.IN_PROGRESS,
        },
      })

      return { success: true, tournament: updated }
    }),
}
