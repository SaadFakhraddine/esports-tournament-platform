'use client'

import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  Trophy,
  Calendar,
  UserPlus,
  Shield,
  Edit,
  Trash2,
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
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
import { useToast } from '@/hooks/use-toast'

export default function TeamDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const teamId = params.id as string
  const [activeTab, setActiveTab] = useState<'members' | 'tournaments'>('members')

  const { data: team, isLoading } = trpc.team.getOverviewById.useQuery(
    { id: teamId },
    { enabled: !!teamId }
  )
  const { data: members, isLoading: membersLoading } = trpc.team.getMembers.useQuery(
    { teamId },
    { enabled: !!teamId && activeTab === 'members' }
  )
  const { data: registrations, isLoading: registrationsLoading } =
    trpc.team.getRegistrationsByTeamId.useQuery(
      { teamId },
      { enabled: !!teamId && activeTab === 'tournaments' }
    )

  const deleteTeamMutation = trpc.team.delete.useMutation()
  const removeMemberMutation = trpc.team.removeMember.useMutation()
  const utils = trpc.useUtils()

  const isOwner = session?.user?.id === team?.owner.id

  const handleDeleteTeam = async () => {
    try {
      await deleteTeamMutation.mutateAsync({ id: teamId })
      toast({
        title: 'Success',
        description: 'Team deleted successfully',
      })
      router.push('/teams')
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete team',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    try {
      await removeMemberMutation.mutateAsync({ teamId, userId })
      toast({
        title: 'Success',
        description: `${userName} removed from team`,
      })
      await Promise.all([
        utils.team.getMembers.invalidate({ teamId }),
        utils.team.getOverviewById.invalidate({ id: teamId }),
      ])
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole={session?.user?.role}>
        <div className='space-y-6'>
          <Skeleton className='h-32 w-full' />
          <Skeleton className='h-64 w-full' />
        </div>
      </DashboardLayout>
    )
  }

  if (!team) {
    return (
      <DashboardLayout userRole={session?.user?.role}>
        <div className='text-center py-12'>
          <p className='text-lg font-medium'>Team not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={session?.user?.role}>
      <div className='space-y-6'>
        {/* Team Header */}
        <Card>
          <CardContent className='pt-6'>
            <div className='flex flex-col md:flex-row gap-6'>
              {/* Team Logo */}
              <Avatar className='h-24 w-24'>
                {team.logo ? (
                  <AvatarImage src={team.logo} alt={team.name} />
                ) : (
                  <AvatarFallback className='bg-gradient-purple text-white text-2xl font-bold'>
                    {team.tag || team.name.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Team Info */}
              <div className='flex-1 space-y-3'>
                <div className='flex items-start justify-between'>
                  <div>
                    <div className='flex items-center gap-3'>
                      <h1 className='text-3xl font-bold'>{team.name}</h1>
                      {team.tag && (
                        <Badge variant='secondary' className='text-base'>
                          {team.tag}
                        </Badge>
                      )}
                    </div>
                    <p className='text-muted-foreground mt-1'>{team.game.name}</p>
                  </div>

                  {/* Action Buttons */}
                  {isOwner && (
                    <div className='flex gap-2'>
                      <Link href={`/teams/${teamId}/edit`}>
                        <Button variant='outline' size='sm'>
                          <Edit className='h-4 w-4 mr-2' />
                          Edit
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant='destructive' size='sm'>
                            <Trash2 className='h-4 w-4 mr-2' />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Team</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this team? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteTeam}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>

                {team.description && (
                  <p className='text-sm'>{team.description}</p>
                )}

                {/* Stats */}
                <div className='flex gap-6 text-sm'>
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4 text-muted-foreground' />
                    <span>{team.members.length} members</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Trophy className='h-4 w-4 text-muted-foreground' />
                    <span>{team._count.registrations} tournaments</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                    <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Owner Info */}
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Shield className='h-4 w-4' />
                  <span>
                    Owner: {team.owner.name || team.owner.username || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className='space-y-4'>
          <TabsList>
            <TabsTrigger value='members'>Members</TabsTrigger>
            <TabsTrigger value='tournaments'>Tournaments</TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value='members' className='space-y-4'>
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      {team._count.members} member{team._count.members !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  {isOwner && (
                    <Link href={`/teams/${teamId}/add-member`}>
                      <Button size='sm'>
                        <UserPlus className='h-4 w-4 mr-2' />
                        Add Member
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className='space-y-4'>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className='h-20 w-full' />
                    ))}
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {(members ?? []).map((member) => (
                    <div
                      key={member.id}
                      className='flex items-center justify-between p-4 border rounded-lg'
                    >
                      <div className='flex items-center gap-4'>
                        <Avatar className='h-12 w-12'>
                          <AvatarImage src={member.user.avatar || undefined} />
                          <AvatarFallback>
                            {member.user.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>
                            {member.user.name || member.user.username}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <Badge
                          variant={member.role === 'CAPTAIN' ? 'default' : 'secondary'}
                        >
                          {member.role}
                        </Badge>
                        {isOwner && member.user.id !== team.owner.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant='ghost' size='sm'>
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove{' '}
                                  {member.user.name || member.user.username} from the
                                  team?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleRemoveMember(
                                      member.user.id,
                                      member.user.name || member.user.username || 'User'
                                    )
                                  }
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value='tournaments' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Tournament History</CardTitle>
                <CardDescription>
                  Tournaments this team has participated in
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registrationsLoading ? (
                  <div className='space-y-4'>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className='h-20 w-full' />
                    ))}
                  </div>
                ) : (registrations ?? []).length === 0 ? (
                  <div className='text-center py-8'>
                    <p className='text-sm text-muted-foreground'>
                      No tournament registrations yet
                    </p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {(registrations ?? []).map((registration) => (
                      <Link
                        key={registration.id}
                        href={`/tournaments/${registration.tournament.id}`}
                      >
                        <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer'>
                          <div className='flex items-center gap-4'>
                            <div className='h-12 w-12 rounded-lg bg-gradient-purple flex items-center justify-center'>
                              <Trophy className='h-6 w-6 text-white' />
                            </div>
                            <div>
                              <p className='font-medium'>
                                {registration.tournament.name}
                              </p>
                              <p className='text-sm text-muted-foreground'>
                                {registration.tournament.game.name}
                              </p>
                            </div>
                          </div>
                          <div className='flex items-center gap-3'>
                            <Badge
                              variant={
                                registration.status === 'APPROVED'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {registration.status}
                            </Badge>
                            <p className='text-sm text-muted-foreground'>
                              {new Date(
                                registration.tournament.startDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
