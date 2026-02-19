import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { TeamRole } from '@prisma/client'

export const teamRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3).max(50),
        tag: z.string().min(2).max(10).optional(),
        logo: z.string().url().optional(),
        description: z.string().optional(),
        game: z.string().min(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.team.findUnique({
        where: { name: input.name },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Team name already taken',
        })
      }

      const { game, ...teamData } = input
      const team = await ctx.db.team.create({
        data: {
          ...teamData,
          gameId: game,
          ownerId: ctx.session.user.id,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: TeamRole.CAPTAIN,
            },
          },
        },
      })

      return team
    }),

  getAll: publicProcedure
    .input(
      z.object({
        game: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { game, search, limit, cursor } = input

      const teams = await ctx.db.team.findMany({
        where: {
          ...(game && { gameId: game }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { tag: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        take: limit + 1,
        ...(cursor && {
          skip: 1,
          cursor: { id: cursor },
        }),
        orderBy: { createdAt: 'desc' },
        include: {
          game: true,
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (teams.length > limit) {
        const nextItem = teams.pop()
        nextCursor = nextItem!.id
      }

      return {
        teams,
        nextCursor,
      }
    }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const team = await ctx.db.team.findUnique({
      where: { id: input.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        registrations: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                game: true,
                startDate: true,
                status: true,
              },
            },
          },
          orderBy: { registeredAt: 'desc' },
        },
      },
    })

    if (!team) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Team not found',
      })
    }

    return team
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(3).max(50).optional(),
        tag: z.string().min(2).max(10).optional(),
        logo: z.string().url().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const team = await ctx.db.team.findUnique({
        where: { id },
      })

      if (!team) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        })
      }

      if (team.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this team',
        })
      }

      if (data.name) {
        const existing = await ctx.db.team.findFirst({
          where: {
            name: data.name,
            NOT: { id },
          },
        })

        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Team name already taken',
          })
        }
      }

      const updated = await ctx.db.team.update({
        where: { id },
        data,
      })

      return updated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.id },
      })

      if (!team) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        })
      }

      if (team.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this team',
        })
      }

      await ctx.db.team.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
        role: z.nativeEnum(TeamRole).default(TeamRole.PLAYER),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
      })

      if (!team) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        })
      }

      if (team.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to add members to this team',
        })
      }

      const existing = await ctx.db.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: input.teamId,
            userId: input.userId,
          },
        },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User is already a member of this team',
        })
      }

      const member = await ctx.db.teamMember.create({
        data: {
          teamId: input.teamId,
          userId: input.userId,
          role: input.role,
        },
      })

      return member
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
      })

      if (!team) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        })
      }

      if (team.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to remove members from this team',
        })
      }

      if (team.ownerId === input.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot remove team owner',
        })
      }

      await ctx.db.teamMember.delete({
        where: {
          teamId_userId: {
            teamId: input.teamId,
            userId: input.userId,
          },
        },
      })

      return { success: true }
    }),

  getMyTeams: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.teamMember.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        team: {
          include: {
            game: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    return memberships.map((m) => ({
      ...m.team,
      userRole: m.role,
    }))
  }),
})
