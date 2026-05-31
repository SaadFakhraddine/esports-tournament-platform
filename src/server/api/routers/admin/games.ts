import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { adminProcedure } from '@/server/api/trpc'
import { slugifyGameName } from '@/lib/admin/slug'
import { logAdminAction } from '@/lib/admin/audit'

const gameInputSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  icon: z.string().url().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  active: z.boolean().optional(),
})

export const adminGames = {
  listGames: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.game.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { tournaments: true, teams: true } },
      },
    })
  }),

  createGame: adminProcedure.input(gameInputSchema).mutation(async ({ ctx, input }) => {
    const slug = input.slug?.trim() || slugifyGameName(input.name)
    if (!slug) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid game slug' })
    }

    try {
      const game = await ctx.db.game.create({
        data: {
          name: input.name.trim(),
          slug,
          icon: input.icon ?? null,
          description: input.description ?? null,
          active: input.active ?? true,
        },
      })

      await logAdminAction(ctx.db, {
        actorId: ctx.session.user.id,
        action: 'GAME_CREATED',
        targetType: 'game',
        targetId: game.id,
        metadata: { name: game.name, slug: game.slug },
      })

      return game
    } catch {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'A game with this name or slug already exists',
      })
    }
  }),

  updateGame: adminProcedure
    .input(gameInputSchema.extend({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const slug = data.slug?.trim() || (data.name ? slugifyGameName(data.name) : undefined)

      try {
        const game = await ctx.db.game.update({
          where: { id },
          data: {
            ...(data.name !== undefined ? { name: data.name.trim() } : {}),
            ...(slug !== undefined ? { slug } : {}),
            ...(data.icon !== undefined ? { icon: data.icon } : {}),
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.active !== undefined ? { active: data.active } : {}),
          },
        })

        await logAdminAction(ctx.db, {
          actorId: ctx.session.user.id,
          action: 'GAME_UPDATED',
          targetType: 'game',
          targetId: game.id,
          metadata: { name: game.name, slug: game.slug, active: game.active },
        })

        return game
      } catch {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found or name/slug conflict',
        })
      }
    }),

  deleteGame: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const usage = await ctx.db.game.findUnique({
        where: { id: input.id },
        include: { _count: { select: { tournaments: true, teams: true } } },
      })

      if (!usage) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Game not found' })
      }

      if (usage._count.tournaments > 0 || usage._count.teams > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete a game in use. Deactivate it instead.',
        })
      }

      await ctx.db.game.delete({ where: { id: input.id } })

      await logAdminAction(ctx.db, {
        actorId: ctx.session.user.id,
        action: 'GAME_DELETED',
        targetType: 'game',
        targetId: input.id,
        metadata: { name: usage.name, slug: usage.slug },
      })

      return { success: true }
    }),
}
