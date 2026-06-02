import { z } from 'zod'
import { protectedProcedure, organizerProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { MatchStatus } from '@prisma/client'
import { getMatchWithRound } from './queries'

export const matchResults = {
  submitResult: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        homeScore: z.number().int().min(0),
        awayScore: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db.match.findUnique({
        where: { id: input.matchId },
        include: {
          homeTeam: true,
          awayTeam: true,
          tournament: true,
        },
      })

      if (!match) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Match not found',
        })
      }

      const isOrganizer = match.tournament.organizerId === ctx.session.user.id
      const isAdmin = ctx.session.user.role === 'ADMIN'

      if (!isOrganizer && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to submit result for this match',
        })
      }

      if (!match.homeTeamId || !match.awayTeamId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Both teams must be set before submitting a result',
        })
      }

      // Determine winner
      const winnerTeamId =
        input.homeScore > input.awayScore
          ? match.homeTeamId
          : input.awayScore > input.homeScore
            ? match.awayTeamId
            : null

      const loserTeamId =
        winnerTeamId === match.homeTeamId
          ? match.awayTeamId
          : winnerTeamId === match.awayTeamId
            ? match.homeTeamId
            : null

      await ctx.db.match.update({
        where: { id: input.matchId },
        data: {
          homeScore: input.homeScore,
          awayScore: input.awayScore,
          winnerTeamId,
          status: MatchStatus.COMPLETED,
          completedAt: new Date(),
          resultSubmittedBy: ctx.session.user.id,
        },
      })

      // If there's a next match, update it with the winner
      if (match.nextMatchId && match.nextMatchSlot && winnerTeamId) {
        await ctx.db.match.update({
          where: { id: match.nextMatchId },
          data: {
            ...(match.nextMatchSlot === 'home'
              ? { homeTeamId: winnerTeamId }
              : { awayTeamId: winnerTeamId }),
          },
        })
      }

      // Double elimination: if configured, also advance the loser
      if (match.nextMatchLoserId && match.nextMatchLoserSlot && loserTeamId) {
        await ctx.db.match.update({
          where: { id: match.nextMatchLoserId },
          data: {
            ...(match.nextMatchLoserSlot === 'home'
              ? { homeTeamId: loserTeamId }
              : { awayTeamId: loserTeamId }),
          },
        })
      }

      // Fetch the updated match with bracket
      const matchWithBracket = await ctx.db.match.findUnique({
        where: { id: input.matchId },
        include: {
          bracket: {
            select: {
              round: true,
              type: true,
            },
          },
        },
      })

      if (!matchWithBracket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Match not found after update',
        })
      }

      // Transform to include round
      return {
        ...matchWithBracket,
        round: matchWithBracket.bracket.round,
      }
    }),

  dispute: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        reason: z.string().min(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db.match.findUnique({
        where: { id: input.matchId },
        include: {
          homeTeam: true,
          awayTeam: true,
          tournament: true,
        },
      })

      if (!match) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Match not found',
        })
      }

      const isOrganizer = match.tournament.organizerId === ctx.session.user.id
      const isAdmin = ctx.session.user.role === 'ADMIN'

      if (!isOrganizer && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to dispute this match',
        })
      }

      await ctx.db.match.update({
        where: { id: input.matchId },
        data: {
          status: MatchStatus.DISPUTED,
          disputeReason: input.reason,
        },
      })

      // Return the updated match with bracket info
      return getMatchWithRound(ctx, input.matchId)
    }),

  adminOverride: organizerProcedure
    .input(
      z.object({
        matchId: z.string(),
        homeScore: z.number().int().min(0),
        awayScore: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db.match.findUnique({
        where: { id: input.matchId },
        include: {
          tournament: true,
        },
      })

      if (!match) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Match not found',
        })
      }

      const isOrganizer = match.tournament.organizerId === ctx.session.user.id
      const isAdmin = ctx.session.user.role === 'ADMIN'

      if (!isOrganizer && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to override this match result',
        })
      }

      if (!match.homeTeamId || !match.awayTeamId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Both teams must be set before overriding a result',
        })
      }

      const winnerTeamId =
        input.homeScore > input.awayScore
          ? match.homeTeamId
          : input.awayScore > input.homeScore
            ? match.awayTeamId
            : null

      const loserTeamId =
        winnerTeamId === match.homeTeamId
          ? match.awayTeamId
          : winnerTeamId === match.awayTeamId
            ? match.homeTeamId
            : null

      const updated = await ctx.db.match.update({
        where: { id: input.matchId },
        data: {
          homeScore: input.homeScore,
          awayScore: input.awayScore,
          winnerTeamId,
          status: MatchStatus.COMPLETED,
          completedAt: new Date(),
          resultSubmittedBy: ctx.session.user.id,
          disputeReason: null,
        },
      })

      // Update next match with winner
      if (match.nextMatchId && match.nextMatchSlot && winnerTeamId) {
        await ctx.db.match.update({
          where: { id: match.nextMatchId },
          data: {
            ...(match.nextMatchSlot === 'home'
              ? { homeTeamId: winnerTeamId }
              : { awayTeamId: winnerTeamId }),
          },
        })
      }

      // Double elimination: also advance loser (if configured)
      if (match.nextMatchLoserId && match.nextMatchLoserSlot && loserTeamId) {
        await ctx.db.match.update({
          where: { id: match.nextMatchLoserId },
          data: {
            ...(match.nextMatchLoserSlot === 'home'
              ? { homeTeamId: loserTeamId }
              : { awayTeamId: loserTeamId }),
          },
        })
      }

      return updated
    }),
}
