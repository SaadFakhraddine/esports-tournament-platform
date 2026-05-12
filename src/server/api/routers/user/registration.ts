import { z } from 'zod'
import { publicProcedure } from '@/server/api/trpc'
import bcrypt from 'bcryptjs'
import { TRPCError } from '@trpc/server'

export const userRegistration = {
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
        username: z.string().min(3).max(20).optional(),
      }),
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
}
