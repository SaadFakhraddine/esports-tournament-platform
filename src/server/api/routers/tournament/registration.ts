import { z } from 'zod'
import { organizerProcedure, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { RegistrationStatus, TournamentStatus } from '@prisma/client'
import { assertTournamentOrganizerOrAdmin, throwTournamentNotFound } from './guards'

export const tournamentRegistration = {
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

  addTeamToTournament: organizerProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        teamId: z.string(),
        seed: z.number().int().min(1).optional(),
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

      if (!tournament) throwTournamentNotFound()

      assertTournamentOrganizerOrAdmin(
        ctx.session.user,
        tournament.organizerId,
        'You do not have permission to add teams to this tournament',
      )

      if (tournament.status !== TournamentStatus.REGISTRATION) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tournament is not open for adding teams',
        })
      }

      if (tournament._count.registrations >= tournament.maxTeams) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tournament is full',
        })
      }

      const team = await ctx.db.team.findUnique({ where: { id: input.teamId } })

      if (!team) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        })
      }

      if (team.gameId !== tournament.gameId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Team game does not match tournament game',
        })
      }

      if (team.ownerId === ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot add your own team to a tournament you organize',
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
        const updated = await ctx.db.tournamentRegistration.update({
          where: { id: existing.id },
          data: {
            status: RegistrationStatus.APPROVED,
            ...(input.seed !== undefined ? { seed: input.seed } : {}),
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

        return updated
      }

      const registration = await ctx.db.tournamentRegistration.create({
        data: {
          tournamentId: input.tournamentId,
          teamId: input.teamId,
          status: RegistrationStatus.APPROVED,
          seed: input.seed,
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

  addTeamsToTournament: organizerProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        teamIds: z.array(z.string()).min(1).max(100),
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

      if (!tournament) throwTournamentNotFound()

      assertTournamentOrganizerOrAdmin(
        ctx.session.user,
        tournament.organizerId,
        'You do not have permission to add teams to this tournament',
      )

      if (tournament.status !== TournamentStatus.REGISTRATION) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tournament is not open for adding teams',
        })
      }

      const uniqueTeamIds = Array.from(new Set(input.teamIds))

      const approvedCount = tournament._count.registrations
      const remaining = tournament.maxTeams - approvedCount

      if (remaining <= 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tournament is full',
        })
      }

      const teams = await ctx.db.team.findMany({
        where: { id: { in: uniqueTeamIds } },
        select: { id: true, gameId: true, ownerId: true },
      })

      if (teams.length !== uniqueTeamIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or more teams not found',
        })
      }

      for (const team of teams) {
        if (team.gameId !== tournament.gameId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'All teams must match the tournament game',
          })
        }

        if (team.ownerId === ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You cannot add your own team to a tournament you organize',
          })
        }
      }

      const existing = await ctx.db.tournamentRegistration.findMany({
        where: {
          tournamentId: input.tournamentId,
          teamId: { in: uniqueTeamIds },
        },
        select: { id: true, teamId: true, status: true },
      })

      const existingByTeamId = new Map(existing.map((r) => [r.teamId, r]))

      let approvalsNeeded = 0
      for (const teamId of uniqueTeamIds) {
        const r = existingByTeamId.get(teamId)
        if (!r) approvalsNeeded++
        else if (r.status !== RegistrationStatus.APPROVED) approvalsNeeded++
      }

      if (approvalsNeeded > remaining) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Not enough slots. You can add up to ${remaining} more team(s).`,
        })
      }

      const result = await ctx.db.$transaction(async (tx) => {
        const processed: Array<{ teamId: string; registrationId: string }> = []

        for (const teamId of uniqueTeamIds) {
          const r = existingByTeamId.get(teamId)

          if (!r) {
            const created = await tx.tournamentRegistration.create({
              data: {
                tournamentId: input.tournamentId,
                teamId,
                status: RegistrationStatus.APPROVED,
              },
            })
            processed.push({ teamId, registrationId: created.id })
            continue
          }

          if (r.status === RegistrationStatus.APPROVED) {
            processed.push({ teamId, registrationId: r.id })
            continue
          }

          const updated = await tx.tournamentRegistration.update({
            where: { id: r.id },
            data: { status: RegistrationStatus.APPROVED },
          })
          processed.push({ teamId, registrationId: updated.id })
        }

        return processed
      })

      return result
    }),

  approveRegistration: organizerProcedure
    .input(
      z.object({
        registrationId: z.string(),
        seed: z.number().int().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const registration = await ctx.db.tournamentRegistration.findUnique({
        where: { id: input.registrationId },
        include: {
          tournament: true,
        },
      })

      if (!registration) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Registration not found',
        })
      }

      assertTournamentOrganizerOrAdmin(
        ctx.session.user,
        registration.tournament.organizerId,
        'You do not have permission to approve this registration',
      )

      if (
        registration.tournament.status !== TournamentStatus.REGISTRATION &&
        registration.tournament.status !== TournamentStatus.SEEDING
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Cannot approve registrations after the tournament has started. Create a new tournament if you need a different lineup.',
        })
      }

      const updated = await ctx.db.tournamentRegistration.update({
        where: { id: input.registrationId },
        data: {
          status: RegistrationStatus.APPROVED,
          seed: input.seed,
        },
      })

      return updated
    }),

  rejectRegistration: organizerProcedure
    .input(z.object({ registrationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const registration = await ctx.db.tournamentRegistration.findUnique({
        where: { id: input.registrationId },
        include: {
          tournament: true,
        },
      })

      if (!registration) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Registration not found',
        })
      }

      assertTournamentOrganizerOrAdmin(
        ctx.session.user,
        registration.tournament.organizerId,
        'You do not have permission to reject this registration',
      )

      if (
        registration.tournament.status !== TournamentStatus.REGISTRATION &&
        registration.tournament.status !== TournamentStatus.SEEDING
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Cannot change registrations after the tournament has started. Create a new tournament if you need a different lineup.',
        })
      }

      const updated = await ctx.db.tournamentRegistration.update({
        where: { id: input.registrationId },
        data: {
          status: RegistrationStatus.REJECTED,
        },
      })

      return updated
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
