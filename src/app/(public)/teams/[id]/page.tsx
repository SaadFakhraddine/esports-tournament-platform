'use client'

import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Trophy, Calendar, UserPlus, Shield, Edit, Trash2 } from 'lucide-react'
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

  const { data: team, isLoading } = trpc.team.getOverviewById.useQuery({ id: teamId }, { enabled: !!teamId })
  const { data: members, isLoading: membersLoading } = trpc.team.getMembers.useQuery(
    { teamId },
    { enabled: !!teamId && activeTab === 'members' },
  )
  const { data: registrations, isLoading: registrationsLoading } = trpc.team.getRegistrationsByTeamId.useQuery(
    { teamId },
    { enabled: !!teamId && activeTab === 'tournaments' },
  )

  const deleteTeamMutation = trpc.team.delete.useMutation()
  const removeMemberMutation = trpc.team.removeMember.useMutation()
  const utils = trpc.useUtils()

  const isOwner = session?.user?.id === team?.owner.id

  const handleDeleteTeam = async () => {
    try {
      await deleteTeamMutation.mutateAsync({ id: teamId })
      toast({ title: 'Success', description: 'Team deleted successfully' })
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
      toast({ title: 'Success', description: `${userName} removed from team` })
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
      <div className='space-y-6'>
        <Skeleton className='h-32 w-full' />
        <Skeleton className='h-64 w-full' />
      </div>
    )
  }

  if (!team) {
    return (
      <div className='text-center py-12'>
        <p className='text-lg font-medium'>Team not found</p>
      </div>
    )
  }

  return (
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
              <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
                <div>
                  <h1 className='text-3xl font-bold'>{team.name}</h1>
                  <div className='flex items-center gap-2 mt-2'>
                    {team.tag && (
                      <Badge variant='secondary' className='text-sm'>
                        {team.tag}
                      </Badge>
                    )}
                    <Badge variant='outline' className='text-sm'>
                      {team.game.name}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                {isOwner && (
                  <div className='flex gap-2'>
                    <Link href={`/teams/${teamId}/edit`}>
                      <Button variant='outline' className='gap-2'>
                        <Edit className='h-4 w-4' />
                        Edit
                      </Button>
                    </Link>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant='destructive' className='gap-2'>
                          <Trash2 className='h-4 w-4' />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete team?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your team.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteTeam}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>

              {team.description && <p className='text-muted-foreground'>{team.description}</p>}

              {/* Team Stats */}
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4'>
                <div className='flex items-center gap-2'>
                  <Users className='h-5 w-5 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>{team._count.members} Members</p>
                    <p className='text-xs text-muted-foreground'>Active roster</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Trophy className='h-5 w-5 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>{team._count.registrations} Tournaments</p>
                    <p className='text-xs text-muted-foreground'>Participated</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Shield className='h-5 w-5 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Owner</p>
                    <p className='text-xs text-muted-foreground'>{team.owner.name || 'Unknown'}</p>
                  </div>
                </div>
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
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Roster and roles</CardDescription>
              </div>
              {isOwner && (
                <Link href={`/teams/${teamId}/add-member`}>
                  <Button className='gap-2'>
                    <UserPlus className='h-4 w-4' />
                    Add Member
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className='space-y-3'>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className='h-12 w-full' />
                  ))}
                </div>
              ) : (members ?? []).length === 0 ? (
                <p className='text-sm text-muted-foreground'>No members found.</p>
              ) : (
                <div className='space-y-3'>
                  {(members ?? []).map((member) => (
                    <div
                      key={member.user.id}
                      className='flex items-center justify-between p-3 rounded-lg border bg-card/50'
                    >
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-10 w-10'>
                          {member.user.avatar ? (
                            <AvatarImage src={member.user.avatar} alt={member.user.name || 'User'} />
                          ) : (
                            <AvatarFallback className='bg-gradient-purple text-white'>
                              {member.user.name?.charAt(0) || member.user.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className='font-medium'>{member.user.name || member.user.username || 'User'}</p>
                          <p className='text-sm text-muted-foreground'>@{member.user.username || 'user'}</p>
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        <Badge variant={member.role === 'CAPTAIN' ? 'default' : 'secondary'}>{member.role}</Badge>

                        {isOwner && member.user.id !== team.owner.id && (
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => handleRemoveMember(member.user.id, member.user.name || 'User')}
                          >
                            Remove
                          </Button>
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
              <CardTitle>Tournaments</CardTitle>
              <CardDescription>Tournament history</CardDescription>
            </CardHeader>
            <CardContent>
              {registrationsLoading ? (
                <div className='space-y-3'>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className='h-16 w-full' />
                  ))}
                </div>
              ) : (registrations ?? []).length === 0 ? (
                <p className='text-sm text-muted-foreground'>No tournaments found.</p>
              ) : (
                <div className='space-y-3'>
                  {(registrations ?? []).map((reg) => (
                    <Link key={reg.tournament.id} href={`/tournaments/${reg.tournament.id}`}>
                      <div className='p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors'>
                        <div className='flex items-center justify-between'>
                          <div className='space-y-1'>
                            <p className='font-medium'>{reg.tournament.name}</p>
                            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                              <Calendar className='h-4 w-4' />
                              <span>{new Date(reg.tournament.startDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Badge variant='outline'>{reg.status}</Badge>
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
  )
}

