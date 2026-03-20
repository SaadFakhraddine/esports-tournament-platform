import { z } from 'zod'
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  organizerProcedure,
} from '@/server/api/trpc'
import {
  createTournamentSchema,
  updateTournamentSchema,
  getTournamentsSchema,
} from '@/lib/validators/tournament'
import { TRPCError } from '@trpc/server'
import { RegistrationStatus, TournamentStatus } from '@prisma/client'

export const tournamentRouter = createTRPCRouter({
  create: organizerProcedure.input(createTournamentSchema).mutation(async ({ ctx, input }) => {
    const tournament = await ctx.db.tournament.create({
      data: {
        ...input,
        organizerId: ctx.session.user.id,
      },
    })

    return tournament
  }),

  getAll: publicProcedure.input(getTournamentsSchema).query(async ({ ctx, input }) => {
    const { game, status, search, limit, cursor } = input

    // If game filter is provided, look up the game by slug or name to get the ID
    let gameFilter = {}
    if (game) {
      const gameRecord = await ctx.db.game.findFirst({
        where: {
          OR: [{ slug: game }, { name: { equals: game, mode: 'insensitive' } }],
        },
      })
      if (gameRecord) {
        gameFilter = { gameId: gameRecord.id }
      }
    }

    const tournaments = await ctx.db.tournament.findMany({
      where: {
        ...gameFilter,
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { startDate: 'desc' },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        organizer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: { status: RegistrationStatus.APPROVED },
            },
          },
        },
      },
    })

    let nextCursor: typeof cursor | undefined = undefined
    if (tournaments.length > limit) {
      const nextItem = tournaments.pop()
      nextCursor = nextItem!.id
    }

    return {
      tournaments,
      nextCursor,
    }
  }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const tournament = await ctx.db.tournament.findUnique({
      where: { id: input.id },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        organizer: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
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

    // Check if user is organizer or admin
    const isOrganizer = ctx.session?.user?.id === tournament.organizerId
    const isAdmin = ctx.session?.user?.role === 'ADMIN'
    const canSeeAllRegistrations = isOrganizer || isAdmin

    // Fetch registrations with appropriate filtering
    const registrations = await ctx.db.tournamentRegistration.findMany({
      where: {
        tournamentId: input.id,
        ...(canSeeAllRegistrations ? {} : { status: RegistrationStatus.APPROVED }),
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
      orderBy: [
        { status: 'asc' }, // PENDING first, then APPROVED, etc
        { seed: 'asc' },
      ],
    })

    // Fetch brackets
    const brackets = await ctx.db.bracket.findMany({
      where: { tournamentId: input.id },
      include: {
        matches: {
          include: {
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
            winner: {
              select: {
                id: true,
                name: true,
                tag: true,
                logo: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { round: 'asc' },
    })

    // Fetch matches
    const matches = await ctx.db.match.findMany({
      where: { tournamentId: input.id },
      include: {
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
      },
      orderBy: { createdAt: 'asc' },
    })

    return {
      ...tournament,
      registrations,
      brackets,
      matches,
    }
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

  register: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        teamId: z.string(),
      })
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

      // Check permissions: team owner or admin
      const isTeamOwner = team.ownerId === ctx.session.user.id
      const isAdmin = ctx.session.user.role === 'ADMIN'
      const isTournamentOrganizer = tournament.organizerId === ctx.session.user.id

      if (!isTeamOwner && !isAdmin && !isTournamentOrganizer) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to register this team',
        })
      }

      // Prevent conflict of interest: organizers cannot register their own teams
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

      // Admins can register teams with auto-approval
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
      })
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

      if (tournament.organizerId !== ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to add teams to this tournament',
        })
      }

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

      // Prevent mixing games inside a tournament
      const normalizedTeamGame = await ctx.db.game.findFirst({
        where: {
          OR: [
            { id: team.gameId.trim() },
            { slug: team.gameId.trim() },
            { name: { equals: team.gameId.trim(), mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      })

      const normalizedTeamGameId = normalizedTeamGame?.id ?? team.gameId

      if (normalizedTeamGameId !== tournament.gameId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Team game does not match tournament game',
        })
      }

      // Prevent conflict of interest: organizers cannot add their own teams (unless admin)
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
        // Promote an existing registration to APPROVED (seed optional)
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
      })
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

      if (tournament.organizerId !== ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to add teams to this tournament',
        })
      }

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

      // Validate teams + game compatibility up-front
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
        const teamGameIdTrimmed = team.gameId.trim()
        const normalizedTeamGame = await ctx.db.game.findFirst({
          where: {
            OR: [
              { id: teamGameIdTrimmed },
              { slug: teamGameIdTrimmed },
              { name: { equals: teamGameIdTrimmed, mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        })

        const normalizedTeamGameId = normalizedTeamGame?.id ?? team.gameId

        if (normalizedTeamGameId !== tournament.gameId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'All teams must match the tournament game',
          })
        }

        // Prevent non-admin organizers from adding their own teams
        if (team.ownerId === ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You cannot add your own team to a tournament you organize',
          })
        }
      }

      // Determine how many *newly-approved* slots will be consumed
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
      })
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

      if (
        registration.tournament.organizerId !== ctx.session.user.id &&
        ctx.session.user.role !== 'ADMIN'
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to approve this registration',
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

      if (
        registration.tournament.organizerId !== ctx.session.user.id &&
        ctx.session.user.role !== 'ADMIN'
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to reject this registration',
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

  getMyTournaments: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(TournamentStatus).optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, limit } = input

      // Get tournaments organized by the user
      const tournaments = await ctx.db.tournament.findMany({
        where: {
          organizerId: ctx.session.user.id,
          ...(status && { status }),
        },
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          game: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
          _count: {
            select: {
              registrations: {
                where: { status: RegistrationStatus.APPROVED },
              },
            },
          },
        },
      })

      return tournaments
    }),

  getRegistrations: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
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
          message: 'You do not have permission to view registrations',
        })
      }

      const registrations = await ctx.db.tournamentRegistration.findMany({
        where: { tournamentId: input.tournamentId },
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
        orderBy: { registeredAt: 'desc' },
      })

      return registrations
    }),

  getParticipatingTournaments: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get user's team IDs
      const userTeamIds = await ctx.db.teamMember.findMany({
        where: { userId: ctx.session.user.id },
        select: { teamId: true },
      })

      const teamIds = userTeamIds.map((tm) => tm.teamId)

      // Get tournaments where user's teams are registered
      const registrations = await ctx.db.tournamentRegistration.findMany({
        where: {
          teamId: { in: teamIds },
          status: RegistrationStatus.APPROVED,
        },
        take: input.limit,
        include: {
          tournament: {
            include: {
              _count: {
                select: {
                  registrations: {
                    where: { status: RegistrationStatus.APPROVED },
                  },
                },
              },
            },
          },
        },
        orderBy: { tournament: { startDate: 'desc' } },
      })

      // Deduplicate tournaments (user might have multiple teams in same tournament)
      const uniqueTournaments = new Map()
      registrations.forEach((r) => {
        if (!uniqueTournaments.has(r.tournament.id)) {
          uniqueTournaments.set(r.tournament.id, r.tournament)
        }
      })
      return Array.from(uniqueTournaments.values())
    }),

  generateBracket: organizerProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { generateBracket, autoSeedTeams } = await import('@/lib/bracket-generator')

      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
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
          message: 'You do not have permission to generate brackets for this tournament',
        })
      }

      // Auto-seed teams that don't have seeds
      await autoSeedTeams(ctx.db, input.tournamentId)

      // Generate the bracket
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

      if (!tournament) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found',
        })
      }

      if (tournament.organizerId !== ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to regenerate brackets for this tournament',
        })
      }

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

      // Auto-seed teams that don't have seeds
      await autoSeedTeams(ctx.db, input.tournamentId)

      // Regenerate the bracket (this will clear existing brackets first)
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

      if (!tournament) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found',
        })
      }

      if (tournament.organizerId !== ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to seed teams for this tournament',
        })
      }

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

      if (!tournament) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found',
        })
      }

      if (tournament.organizerId !== ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to start this tournament',
        })
      }

      // Validation: Cannot start if already in progress, completed, or cancelled
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

      // Validation: Must have at least 2 approved teams
      if (tournament.registrations.length < 2) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot start tournament with less than 2 teams (currently ${tournament.registrations.length})`,
        })
      }

      // Validation: Must have generated bracket with matches
      if (tournament.brackets.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot start tournament without a bracket. Please generate the bracket first.',
        })
      }

      const totalMatches = tournament.brackets.reduce(
        (sum, bracket) => sum + bracket.matches.length,
        0
      )
      if (totalMatches === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot start tournament without any matches. Please regenerate the bracket.',
        })
      }

      // All validations passed - start the tournament
      const updated = await ctx.db.tournament.update({
        where: { id: input.tournamentId },
        data: {
          status: TournamentStatus.IN_PROGRESS,
        },
      })

      return { success: true, tournament: updated }
    }),
})
