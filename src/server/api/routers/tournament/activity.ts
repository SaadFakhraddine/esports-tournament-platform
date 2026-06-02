import { z } from 'zod'
import { RegistrationStatus } from '@prisma/client'
import { protectedProcedure } from '@/server/api/trpc'
import { assertTournamentOrganizerOrAdmin, throwTournamentNotFound } from './guards'

const REGISTRATION_ACTION: Record<RegistrationStatus, string> = {
  PENDING: 'Team registered',
  APPROVED: 'Registration approved',
  REJECTED: 'Registration rejected',
  WITHDRAWN: 'Team withdrew',
}

export const tournamentActivity = {
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        limit: z.number().int().min(1).max(20).default(10),
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
        'You do not have permission to view this tournament activity',
      )

      const [registrations, matches] = await Promise.all([
        ctx.db.tournamentRegistration.findMany({
          where: { tournamentId: input.tournamentId },
          orderBy: { registeredAt: 'desc' },
          take: input.limit,
          select: {
            id: true,
            status: true,
            registeredAt: true,
            updatedAt: true,
            team: { select: { name: true } },
          },
        }),
        ctx.db.match.findMany({
          where: {
            tournamentId: input.tournamentId,
            status: 'COMPLETED',
            completedAt: { not: null },
          },
          orderBy: { completedAt: 'desc' },
          take: input.limit,
          select: {
            id: true,
            homeScore: true,
            awayScore: true,
            completedAt: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        }),
      ])

      const activities: Array<{
        id: string
        action: string
        detail: string
        timestamp: Date
      }> = []

      for (const reg of registrations) {
        activities.push({
          id: `reg-${reg.id}`,
          action: REGISTRATION_ACTION[reg.status],
          detail: reg.team.name,
          timestamp: reg.status === RegistrationStatus.PENDING ? reg.registeredAt : reg.updatedAt,
        })
      }

      for (const match of matches) {
        if (!match.completedAt) continue
        const home = match.homeTeam?.name ?? 'TBD'
        const away = match.awayTeam?.name ?? 'TBD'
        const homeScore = match.homeScore ?? 0
        const awayScore = match.awayScore ?? 0
        activities.push({
          id: `match-${match.id}`,
          action: 'Match completed',
          detail: `${home} ${homeScore} - ${awayScore} ${away}`,
          timestamp: match.completedAt,
        })
      }

      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, input.limit)
    }),
}
