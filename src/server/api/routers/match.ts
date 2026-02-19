import { z } from 'zod'
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  organizerProcedure,
} from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { MatchStatus } from '@prisma/client'

export const matchRouter = createTRPCRouter({
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const match = await ctx.db.match.findUnique({
      where: { id: input.id },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            format: true,
          },
        },
        bracket: {
          select: {
            type: true,
            round: true,
          },
        },
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
        resultSubmitter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!match) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Match not found',
      })
    }

    return match
  }),

  submitResult: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        homeScore: z.number().int().min(0),
        awayScore: z.number().int().min(0),
      })
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

      // Check if user is part of either team or is the tournament organizer
      const isHomeTeamOwner = match.homeTeam.ownerId === ctx.session.user.id
      const isAwayTeamOwner = match.awayTeam.ownerId === ctx.session.user.id
      const isOrganizer = match.tournament.organizerId === ctx.session.user.id
      const isAdmin = ctx.session.user.role === 'ADMIN'

      if (!isHomeTeamOwner && !isAwayTeamOwner && !isOrganizer && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to submit result for this match',
        })
      }

      // Determine winner
      const winnerTeamId =
        input.homeScore > input.awayScore
          ? match.homeTeamId
          : input.awayScore > input.homeScore
            ? match.awayTeamId
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
        },
      })

      // If there's a next match, update it with the winner
      if (match.nextMatchId && winnerTeamId) {
        await ctx.db.match.update({
          where: { id: match.nextMatchId },
          data: {
            ...(match.nextMatchSlot === 'home'
              ? { homeTeamId: winnerTeamId }
              : { awayTeamId: winnerTeamId }),
          },
        })
      }

      return updated
    }),

  dispute: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db.match.findUnique({
        where: { id: input.matchId },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      })

      if (!match) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Match not found',
        })
      }

      const isHomeTeamOwner = match.homeTeam.ownerId === ctx.session.user.id
      const isAwayTeamOwner = match.awayTeam.ownerId === ctx.session.user.id

      if (!isHomeTeamOwner && !isAwayTeamOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to dispute this match',
        })
      }

      const updated = await ctx.db.match.update({
        where: { id: input.matchId },
        data: {
          status: MatchStatus.DISPUTED,
          disputeReason: input.reason,
        },
      })

      return updated
    }),

  adminOverride: organizerProcedure
    .input(
      z.object({
        matchId: z.string(),
        homeScore: z.number().int().min(0),
        awayScore: z.number().int().min(0),
      })
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

      const winnerTeamId =
        input.homeScore > input.awayScore
          ? match.homeTeamId
          : input.awayScore > input.homeScore
            ? match.awayTeamId
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
      if (match.nextMatchId && winnerTeamId) {
        await ctx.db.match.update({
          where: { id: match.nextMatchId },
          data: {
            ...(match.nextMatchSlot === 'home'
              ? { homeTeamId: winnerTeamId }
              : { awayTeamId: winnerTeamId }),
          },
        })
      }

      return updated
    }),

  updateStatus: organizerProcedure
    .input(
      z.object({
        matchId: z.string(),
        status: z.nativeEnum(MatchStatus),
        scheduledAt: z.date().optional(),
      })
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
          message: 'You do not have permission to update this match',
        })
      }

      const updated = await ctx.db.match.update({
        where: { id: input.matchId },
        data: {
          status: input.status,
          ...(input.scheduledAt && { scheduledAt: input.scheduledAt }),
          ...(input.status === MatchStatus.IN_PROGRESS && { startedAt: new Date() }),
        },
      })

      return updated
    }),
})
