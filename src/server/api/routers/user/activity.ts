import { z } from 'zod'
import { protectedProcedure } from '@/server/api/trpc'

export const userActivity = {
  getRecentActivity: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(20).default(10),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const limit = input?.limit || 10

      const userTeamIds = await ctx.db.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
      })
      const teamIds = userTeamIds.map((tm) => tm.teamId)

      const [notifications, recentMatches, recentRegistrations, recentInvitations] = await Promise.all([
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

        ctx.db.match.findMany({
          where: {
            homeTeamId: { not: null },
            awayTeamId: { not: null },
            OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
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

      const sortedActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)

      return sortedActivities
    }),
}
