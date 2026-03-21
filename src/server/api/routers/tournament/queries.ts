import { z } from 'zod'
import { protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { getTournamentsSchema } from '@/lib/validators/tournament'
import { RegistrationStatus, TournamentStatus } from '@prisma/client'
import { assertTournamentOrganizerOrAdmin, throwTournamentNotFound } from './guards'

export const tournamentQueries = {
  getAll: publicProcedure.input(getTournamentsSchema).query(async ({ ctx, input }) => {
    const { game, status, search, limit, cursor } = input

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

    if (!tournament) throwTournamentNotFound()

    const isOrganizer = ctx.session?.user?.id === tournament.organizerId
    const isAdmin = ctx.session?.user?.role === 'ADMIN'
    const canSeeAllRegistrations = isOrganizer || isAdmin

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
      orderBy: [{ status: 'asc' }, { seed: 'asc' }],
    })

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

  getManageOverviewById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
        include: {
          game: {
            select: { id: true },
          },
        },
      })

      if (!tournament) throwTournamentNotFound()

      assertTournamentOrganizerOrAdmin(
        ctx.session.user,
        tournament.organizerId,
        'You do not have permission to manage this tournament',
      )

      const [bracketsCount, matchesCount] = await Promise.all([
        ctx.db.bracket.count({ where: { tournamentId: input.id } }),
        ctx.db.match.count({ where: { tournamentId: input.id } }),
      ])

      return {
        ...tournament,
        bracketsCount,
        matchesCount,
      }
    }),

  getBracketTree: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        select: { organizerId: true },
      })

      if (!tournament) throwTournamentNotFound()

      assertTournamentOrganizerOrAdmin(
        ctx.session.user,
        tournament.organizerId,
        'You do not have permission to view this bracket',
      )

      const brackets = await ctx.db.bracket.findMany({
        where: { tournamentId: input.tournamentId },
        orderBy: { round: 'asc' },
        include: {
          matches: {
            orderBy: { createdAt: 'asc' },
            include: {
              homeTeam: {
                select: { id: true, name: true, tag: true, logo: true },
              },
              awayTeam: {
                select: { id: true, name: true, tag: true, logo: true },
              },
              winner: {
                select: { id: true, name: true, tag: true, logo: true },
              },
            },
          },
        },
      })

      return { brackets }
    }),

  getPublicOverviewById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
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

      if (!tournament) throwTournamentNotFound()

      const isOrganizer = ctx.session?.user?.id === tournament.organizerId
      const isAdmin = ctx.session?.user?.role === 'ADMIN'
      const canSeeAllRegistrations = isOrganizer || isAdmin

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
        orderBy: [{ status: 'asc' }, { seed: 'asc' }],
      })

      const bracketsCount = await ctx.db.bracket.count({
        where: { tournamentId: input.id },
      })

      return {
        ...tournament,
        registrations,
        bracketsCount,
      }
    }),

  getPublicBracketTree: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        select: { organizerId: true },
      })

      if (!tournament) throwTournamentNotFound()

      const brackets = await ctx.db.bracket.findMany({
        where: { tournamentId: input.tournamentId },
        orderBy: { round: 'asc' },
        include: {
          matches: {
            orderBy: { createdAt: 'asc' },
            include: {
              homeTeam: { select: { id: true, name: true, tag: true, logo: true } },
              awayTeam: { select: { id: true, name: true, tag: true, logo: true } },
              winner: { select: { id: true, name: true, tag: true, logo: true } },
            },
          },
        },
      })

      return { brackets }
    }),

  getMyTournaments: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(TournamentStatus).optional(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, limit } = input

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
      }),
    )
    .query(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
      })

      if (!tournament) throwTournamentNotFound()

      assertTournamentOrganizerOrAdmin(
        ctx.session.user,
        tournament.organizerId,
        'You do not have permission to view registrations',
      )

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
      }),
    )
    .query(async ({ ctx, input }) => {
      const userTeamIds = await ctx.db.teamMember.findMany({
        where: { userId: ctx.session.user.id },
        select: { teamId: true },
      })

      const teamIds = userTeamIds.map((tm) => tm.teamId)

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

      const uniqueTournaments = new Map()
      registrations.forEach((r) => {
        if (!uniqueTournaments.has(r.tournament.id)) {
          uniqueTournaments.set(r.tournament.id, r.tournament)
        }
      })
      return Array.from(uniqueTournaments.values())
    }),
}
