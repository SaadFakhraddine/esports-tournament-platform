import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import bcrypt from 'bcryptjs'
import { TRPCError } from '@trpc/server'

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
        username: z.string().min(3).max(20).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists',
        })
      }

      if (input.username) {
        const existingUsername = await ctx.db.user.findUnique({
          where: { username: input.username },
        })

        if (existingUsername) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Username already taken',
          })
        }
      }

      const hashedPassword = await bcrypt.hash(input.password, 10)

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
          username: input.username,
        },
      })

      return {
        success: true,
        userId: user.id,
      }
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        role: true,
        createdAt: true,
        ownedTeams: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        teamMemberships: {
          select: {
            team: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            role: true,
          },
        },
      },
    })

    return user
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        username: z.string().min(3).max(20).optional(),
        avatar: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.username) {
        const existing = await ctx.db.user.findFirst({
          where: {
            username: input.username,
            NOT: { id: ctx.session.user.id },
          },
        })

        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Username already taken',
          })
        }
      }

      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatar: true,
          role: true,
        },
      })

      return user
    }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Get team memberships count
    const teamsCount = await ctx.db.teamMember.count({
      where: { userId },
    })

    // Get tournaments user is participating in (through teams)
    const userTeamIds = await ctx.db.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    })

    const teamIds = userTeamIds.map((tm) => tm.teamId)

    const activeTournamentsCount = await ctx.db.tournamentRegistration.count({
      where: {
        teamId: { in: teamIds },
        status: 'APPROVED',
        tournament: {
          status: { in: ['REGISTRATION', 'SEEDING', 'IN_PROGRESS'] },
        },
      },
    })

    // Get upcoming matches for user's teams
    const upcomingMatchesCount = await ctx.db.match.count({
      where: {
        OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
        status: 'SCHEDULED',
      },
    })

    // Calculate win rate (matches where user's team won)
    const totalMatches = await ctx.db.match.count({
      where: {
        OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
        status: 'COMPLETED',
      },
    })

    const wonMatches = await ctx.db.match.count({
      where: {
        winnerTeamId: { in: teamIds },
        status: 'COMPLETED',
      },
    })

    const winRate = totalMatches > 0 ? Math.round((wonMatches / totalMatches) * 100) : 0

    return {
      teamsCount,
      activeTournamentsCount,
      upcomingMatchesCount,
      winRate,
      totalMatches,
      wonMatches,
    }
  }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        where: {
          OR: [
            { username: { contains: input.query, mode: 'insensitive' } },
            { email: { contains: input.query, mode: 'insensitive' } },
            { name: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        take: input.limit,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatar: true,
          role: true,
        },
      })

      return users
    }),

  getRecentActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(20).default(10),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const limit = input?.limit || 10

      // Get user's team IDs
      const userTeamIds = await ctx.db.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
      })
      const teamIds = userTeamIds.map((tm) => tm.teamId)

      // Fetch different types of activities
      const [
        notifications,
        recentMatches,
        recentRegistrations,
        recentInvitations,
      ] = await Promise.all([
        // Recent notifications
        ctx.db.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            link: true,
            read: true,
            createdAt: true,
          },
        }),

        // Recent completed matches for user's teams
        ctx.db.match.findMany({
          where: {
            homeTeamId: { not: null },
            awayTeamId: { not: null },
            OR: [
              { homeTeamId: { in: teamIds } },
              { awayTeamId: { in: teamIds } },
            ],
            status: 'COMPLETED',
          },
          orderBy: { completedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            homeTeam: { select: { id: true, name: true } },
            awayTeam: { select: { id: true, name: true } },
            homeScore: true,
            awayScore: true,
            winnerTeamId: true,
            completedAt: true,
            tournament: { select: { id: true, name: true } },
          },
        }),

        // Recent tournament registrations
        ctx.db.tournamentRegistration.findMany({
          where: {
            teamId: { in: teamIds },
          },
          orderBy: { registeredAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            registeredAt: true,
            tournament: {
              select: {
                id: true,
                name: true,
                game: { select: { name: true, icon: true } },
              },
            },
            team: { select: { id: true, name: true } },
          },
        }),

        // Recent team invitations
        ctx.db.teamInvitation.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            role: true,
            createdAt: true,
            team: { select: { id: true, name: true } },
          },
        }),
      ])

      // Combine and sort all activities by date
      const activities: Array<{
        id: string
        type: 'notification' | 'match' | 'registration' | 'invitation'
        title: string
        description: string
        link?: string | null
        timestamp: Date
        read?: boolean
        metadata?: Record<string, unknown>
      }> = []

      // Add notifications
      notifications.forEach((notif) => {
        activities.push({
          id: notif.id,
          type: 'notification',
          title: notif.title,
          description: notif.message,
          link: notif.link,
          timestamp: notif.createdAt,
          read: notif.read,
        })
      })

      // Add match results
      recentMatches.forEach((match) => {
        const userTeamWon = teamIds.includes(match.winnerTeamId || '')

        const homeTeamName = match.homeTeam?.name ?? 'TBD'
        const awayTeamName = match.awayTeam?.name ?? 'TBD'

        activities.push({
          id: match.id,
          type: 'match',
          title: userTeamWon ? 'Match Won! 🎉' : 'Match Completed',
          description: `${homeTeamName} ${match.homeScore} - ${match.awayScore} ${awayTeamName}`,
          link: `/tournaments/${match.tournament.id}`,
          timestamp: match.completedAt || new Date(),
          metadata: { tournamentName: match.tournament.name },
        })
      })

      // Add registrations
      recentRegistrations.forEach((reg) => {
        const statusText = {
          PENDING: 'pending approval',
          APPROVED: 'approved',
          REJECTED: 'rejected',
          WITHDRAWN: 'withdrawn',
        }[reg.status]

        activities.push({
          id: reg.id,
          type: 'registration',
          title: `Tournament Registration ${statusText}`,
          description: `${reg.team.name} → ${reg.tournament.name}`,
          link: `/tournaments/${reg.tournament.id}`,
          timestamp: reg.registeredAt,
          metadata: { gameName: reg.tournament.game.name, gameIcon: reg.tournament.game.icon },
        })
      })

      // Add invitations
      recentInvitations.forEach((inv) => {
        const statusText = {
          PENDING: 'received',
          ACCEPTED: 'accepted',
          DECLINED: 'declined',
          EXPIRED: 'expired',
          CANCELLED: 'cancelled',
        }[inv.status]

        activities.push({
          id: inv.id,
          type: 'invitation',
          title: `Team Invitation ${statusText}`,
          description: `${inv.team.name} invited you as ${inv.role}`,
          link: `/teams/${inv.team.id}`,
          timestamp: inv.createdAt,
        })
      })

      // Sort by timestamp descending and limit
      const sortedActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)

      return sortedActivities
    }),
})