import { z } from 'zod'
import { protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { RegistrationStatus, TournamentStatus } from '@prisma/client'

export const registrationPlayer = {
  register: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        teamId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          _count: {
            select: {
              registrations: {
                where: { status: RegistrationStatus.APPROVED },
              },
            },
          },
        },
      })

      if (!tournament) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found',
        })
      }

      if (tournament.status !== TournamentStatus.REGISTRATION) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tournament is not open for registration',
        })
      }

      if (tournament._count.registrations >= tournament.maxTeams) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tournament is full',
        })
      }

      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
      })

      if (!team) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        })
      }

      const isTeamOwner = team.ownerId === ctx.session.user.id
      const isAdmin = ctx.session.user.role === 'ADMIN'
      const isTournamentOrganizer = tournament.organizerId === ctx.session.user.id

      if (!isTeamOwner && !isAdmin && !isTournamentOrganizer) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to register this team',
        })
      }

      if (isTournamentOrganizer && isTeamOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'You cannot participate in tournaments you organize. Please use a different account to compete.',
        })
      }

      const existing = await ctx.db.tournamentRegistration.findUnique({
        where: {
          tournamentId_teamId: {
            tournamentId: input.tournamentId,
            teamId: input.teamId,
          },
        },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Team already registered',
        })
      }

      const status = isAdmin ? RegistrationStatus.APPROVED : RegistrationStatus.PENDING

      const registration = await ctx.db.tournamentRegistration.create({
        data: {
          tournamentId: input.tournamentId,
          teamId: input.teamId,
          status,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              tag: true,
              logo: true,
            },
          },
        },
      })

      return registration
    }),

  withdraw: protectedProcedure
    .input(z.object({ registrationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const registration = await ctx.db.tournamentRegistration.findUnique({
        where: { id: input.registrationId },
        include: {
          team: true,
          tournament: true,
        },
      })

      if (!registration) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Registration not found',
        })
      }

      if (registration.team.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to withdraw this registration',
        })
      }

      if (registration.tournament.status !== TournamentStatus.REGISTRATION) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot withdraw after registration period',
        })
      }

      const updated = await ctx.db.tournamentRegistration.update({
        where: { id: input.registrationId },
        data: {
          status: RegistrationStatus.WITHDRAWN,
        },
      })

      return updated
    }),
}
