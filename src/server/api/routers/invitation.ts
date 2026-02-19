import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { TeamRole, InvitationStatus } from '@prisma/client'
import { resend, FROM_EMAIL } from '@/lib/email/resend'
import { TeamInvitationEmail, teamInvitationEmailText } from '@/lib/email/templates/team-invitation'

export const invitationRouter = createTRPCRouter({
  // Send a team invitation
  send: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        email: z.string().email(),
        role: z.nativeEnum(TeamRole).default('PLAYER'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is team owner
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        include: {
          members: true,
        },
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
          message: 'Only team owners can send invitations',
        })
      }

      // Check if user exists and get their ID
      const invitedUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      // Check if user is already a member
      if (invitedUser) {
        const isAlreadyMember = team.members.some((m) => m.userId === invitedUser.id)
        if (isAlreadyMember) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User is already a member of this team',
          })
        }
      }

      // Check if there's already a pending invitation
      const existingInvitation = await ctx.db.teamInvitation.findFirst({
        where: {
          teamId: input.teamId,
          email: input.email,
          status: InvitationStatus.PENDING,
        },
      })

      if (existingInvitation) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An invitation has already been sent to this email',
        })
      }

      // Create invitation (expires in 7 days)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const invitation = await ctx.db.teamInvitation.create({
        data: {
          teamId: input.teamId,
          email: input.email,
          userId: invitedUser?.id,
          role: input.role,
          invitedBy: ctx.session.user.id,
          expiresAt,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              game: true,
              logo: true,
            },
          },
          inviter: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      })

      // Send email notification
      try {
        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/invitations`

        await resend.emails.send({
          from: FROM_EMAIL,
          to: input.email,
          subject: `You've been invited to join ${invitation.team.name}!`,
          react: TeamInvitationEmail({
            teamName: invitation.team.name,
            teamGame: invitation.team.game.name,
            role: invitation.role,
            inviterName: invitation.inviter.name || invitation.inviter.username || 'Someone',
            invitationUrl,
            expiresAt: invitation.expiresAt,
          }) as React.ReactElement,
          text: teamInvitationEmailText({
            teamName: invitation.team.name,
            teamGame: invitation.team.game.name,
            role: invitation.role,
            inviterName: invitation.inviter.name || invitation.inviter.username || 'Someone',
            invitationUrl,
            expiresAt: invitation.expiresAt,
          }),
        })
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError)
        // Don't throw error - invitation was created successfully
        // We just log the email error
      }

      return invitation
    }),

  // Get invitations for a team
  getByTeam: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        status: z.nativeEnum(InvitationStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user is team owner
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
          message: 'Only team owners can view invitations',
        })
      }

      const invitations = await ctx.db.teamInvitation.findMany({
        where: {
          teamId: input.teamId,
          ...(input.status && { status: input.status }),
        },
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
        orderBy: { createdAt: 'desc' },
      })

      return invitations
    }),

  // Get invitations for current user
  getMyInvitations: protectedProcedure.query(async ({ ctx }) => {
    const invitations = await ctx.db.teamInvitation.findMany({
      where: {
        OR: [
          { email: ctx.session.user.email! },
          { userId: ctx.session.user.id },
        ],
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() }, // Not expired
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            game: true,
            logo: true,
            tag: true,
            owner: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return invitations
  }),

  // Accept invitation
  accept: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.teamInvitation.findUnique({
        where: { id: input.invitationId },
        include: { team: true },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      // Check if invitation is for current user
      if (
        invitation.email !== ctx.session.user.email &&
        invitation.userId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This invitation is not for you',
        })
      }

      // Check if invitation is still pending
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This invitation has already been processed',
        })
      }

      // Check if invitation is expired
      if (invitation.expiresAt < new Date()) {
        await ctx.db.teamInvitation.update({
          where: { id: input.invitationId },
          data: { status: InvitationStatus.EXPIRED },
        })

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This invitation has expired',
        })
      }

      // Check if user is already a member
      const existingMember = await ctx.db.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: invitation.teamId,
            userId: ctx.session.user.id,
          },
        },
      })

      if (existingMember) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You are already a member of this team',
        })
      }

      // Accept invitation and add user to team
      const [updatedInvitation, newMember] = await ctx.db.$transaction([
        ctx.db.teamInvitation.update({
          where: { id: input.invitationId },
          data: {
            status: InvitationStatus.ACCEPTED,
            userId: ctx.session.user.id,
          },
        }),
        ctx.db.teamMember.create({
          data: {
            teamId: invitation.teamId,
            userId: ctx.session.user.id,
            role: invitation.role,
          },
        }),
      ])

      return {
        invitation: updatedInvitation,
        member: newMember,
      }
    }),

  // Decline invitation
  decline: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.teamInvitation.findUnique({
        where: { id: input.invitationId },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      // Check if invitation is for current user
      if (
        invitation.email !== ctx.session.user.email &&
        invitation.userId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This invitation is not for you',
        })
      }

      // Check if invitation is still pending
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This invitation has already been processed',
        })
      }

      const updatedInvitation = await ctx.db.teamInvitation.update({
        where: { id: input.invitationId },
        data: { status: InvitationStatus.DECLINED },
      })

      return updatedInvitation
    }),

  // Cancel invitation (by sender)
  cancel: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.teamInvitation.findUnique({
        where: { id: input.invitationId },
        include: { team: true },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      // Check if user is the team owner or the one who sent the invitation
      if (
        invitation.team.ownerId !== ctx.session.user.id &&
        invitation.invitedBy !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot cancel this invitation',
        })
      }

      // Check if invitation is still pending
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This invitation has already been processed',
        })
      }

      const updatedInvitation = await ctx.db.teamInvitation.update({
        where: { id: input.invitationId },
        data: { status: InvitationStatus.CANCELLED },
      })

      return updatedInvitation
    }),
})
