'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { Mail, Check, X, Clock, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function InvitationsPage() {
  const { data: session, status } = useSession({
    required: true,
  })
  const { toast } = useToast()

  const { data: invitations, isLoading } = trpc.invitation.getMyInvitations.useQuery(
    undefined,
    { enabled: !!session }
  )

  const acceptMutation = trpc.invitation.accept.useMutation()
  const declineMutation = trpc.invitation.decline.useMutation()
  const utils = trpc.useUtils()

  if (status === 'loading' || !session) {
    return <DashboardSkeleton />
  }

  const handleAccept = async (invitationId: string, teamName: string) => {
    try {
      await acceptMutation.mutateAsync({ invitationId })
      toast({
        title: 'Invitation Accepted!',
        description: `You&apos;ve joined ${teamName}`,
      })
      utils.invitation.getMyInvitations.invalidate()
      utils.team.getMyTeams.invalidate()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept invitation',
        variant: 'destructive',
      })
    }
  }

  const handleDecline = async (invitationId: string, teamName: string) => {
    try {
      await declineMutation.mutateAsync({ invitationId })
      toast({
        title: 'Invitation Declined',
        description: `You&apos;ve declined the invitation to ${teamName}`,
      })
      utils.invitation.getMyInvitations.invalidate()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to decline invitation',
        variant: 'destructive',
      })
    }
  }

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Team Invitations</h1>
          <p className='text-muted-foreground mt-2'>
            Manage your pending team invitations
          </p>
        </div>

        {/* Invitations List */}
        {isLoading ? (
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-32' />
            ))}
          </div>
        ) : !invitations || invitations.length === 0 ? (
          <Card>
            <CardContent className='py-12 text-center'>
              <Mail className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
              <p className='text-lg font-medium mb-2'>No pending invitations</p>
              <p className='text-sm text-muted-foreground mb-4'>
                When teams invite you, they&apos;ll appear here
              </p>
              <Link href='/teams'>
                <Button>Browse Teams</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            {invitations.map((invitation) => (
              <Card key={invitation.id} className='hover:shadow-lg transition-shadow'>
                <CardContent className='pt-6'>
                  <div className='flex flex-col md:flex-row gap-6'>
                    {/* Team Logo */}
                    <Avatar className='h-20 w-20'>
                      {invitation.team.logo ? (
                        <AvatarImage src={invitation.team.logo} alt={invitation.team.name} />
                      ) : (
                        <AvatarFallback className='bg-gradient-purple text-white text-xl font-bold'>
                          {invitation.team.tag || invitation.team.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    {/* Invitation Details */}
                    <div className='flex-1 space-y-3'>
                      <div>
                        <div className='flex items-center gap-3 flex-wrap'>
                          <h3 className='text-xl font-bold'>{invitation.team.name}</h3>
                          {invitation.team.tag && (
                            <Badge variant='secondary'>{invitation.team.tag}</Badge>
                          )}
                          <Badge variant='outline'>{invitation.role}</Badge>
                        </div>
                        <p className='text-sm text-muted-foreground mt-1'>
                          {invitation.team.game.name}
                        </p>
                      </div>

                      <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                        <div className='flex items-center gap-1'>
                          <Users className='h-4 w-4' />
                          <span>
                            Invited by {invitation.inviter.name || invitation.inviter.username}
                          </span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Clock className='h-4 w-4' />
                          <span>
                            Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className='flex gap-2'>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className='gap-2'>
                              <Check className='h-4 w-4' />
                              Accept
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Accept Invitation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to join {invitation.team.name}?
                                You&apos;ll become a {invitation.role.toLowerCase()} on the team.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleAccept(invitation.id, invitation.team.name)}
                              >
                                Accept Invitation
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant='outline' className='gap-2'>
                              <X className='h-4 w-4' />
                              Decline
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Decline Invitation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to decline this invitation to join{' '}
                                {invitation.team.name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDecline(invitation.id, invitation.team.name)}
                              >
                                Decline
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Link href={`/teams/${invitation.team.id}`}>
                          <Button variant='ghost'>View Team</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function DashboardSkeleton() {
  return (
    <DashboardLayout>
      <div className='space-y-6'>
        <Skeleton className='h-12 w-64' />
        <div className='space-y-4'>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-32' />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
