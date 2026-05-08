'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'
import { Loader2, Search, UserPlus, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TeamRole } from '@prisma/client'

export default function AddMemberPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const teamId = params.id as string

  type UserType = {
    id: string
    name?: string | null
    username?: string | null
    avatar?: string | null
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [selectedRole, setSelectedRole] = useState<TeamRole>('PLAYER')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Invitation state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('PLAYER')
  const [isSendingInvite, setIsSendingInvite] = useState(false)

  const { data: team, isLoading: teamLoading } = trpc.team.getOverviewById.useQuery({ id: teamId }, { enabled: !!teamId })
  const { data: members, isLoading: membersLoading } = trpc.team.getMembers.useQuery(
    { teamId },
    { enabled: !!teamId && !!team },
  )

  const { data: searchResults, isLoading: searchLoading } = trpc.user.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length >= 2 },
  )

  const addMemberMutation = trpc.team.addMember.useMutation()
  const sendInvitationMutation = trpc.invitation.send.useMutation()
  const utils = trpc.useUtils()

  if (status === 'loading' || teamLoading || membersLoading) {
    return (
      <div className='max-w-3xl mx-auto space-y-6'>
        <Skeleton className='h-12 w-64' />
        <Skeleton className='h-96' />
      </div>
    )
  }

  if (!session) {
    redirect('/login')
  }

  if (!team) {
    return (
      <div className='text-center py-12'>
        <p className='text-lg font-medium'>Team not found</p>
      </div>
    )
  }

  if (team.owner.id !== session.user.id) {
    return (
      <div className='text-center py-12'>
        <p className='text-lg font-medium'>Only team owners can add members</p>
      </div>
    )
  }

  const existingMemberIds = (members ?? []).map((m) => m.user.id)

  const handleAddMember = async () => {
    if (!selectedUser) {
      toast({
        title: 'Error',
        description: 'Please select a user to add',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await addMemberMutation.mutateAsync({
        teamId,
        userId: selectedUser.id,
        role: selectedRole,
      })

      toast({
        title: 'Success',
        description: 'Member added successfully',
      })

      setSelectedUser(null)
      setSearchQuery('')

      await Promise.all([utils.team.getMembers.invalidate({ teamId }), utils.team.getOverviewById.invalidate({ id: teamId })])
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add member',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'Enter an email address to send an invitation.',
        variant: 'destructive',
      })
      return
    }

    setIsSendingInvite(true)

    try {
      await sendInvitationMutation.mutateAsync({
        teamId,
        email: inviteEmail.trim(),
        role: inviteRole,
      })

      toast({
        title: 'Invitation sent',
        description: 'The user will receive an invitation if they have an account.',
      })

      setInviteEmail('')
      await utils.invitation.getMyInvitations.invalidate()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      })
    } finally {
      setIsSendingInvite(false)
    }
  }

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Add Member</h1>
          <p className='text-muted-foreground mt-2'>Add players to {team.name} or invite by email</p>
        </div>
        <Button variant='outline' onClick={() => router.push(`/teams/${teamId}`)}>
          Back to team
        </Button>
      </div>

      <Tabs defaultValue='search' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='search'>Search users</TabsTrigger>
          <TabsTrigger value='invite'>Invite by email</TabsTrigger>
        </TabsList>

        <TabsContent value='search'>
          <Card>
            <CardHeader>
              <CardTitle>Search users</CardTitle>
              <CardDescription>Find an existing user and add them to the team</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  placeholder='Search by name or username...'
                  className='pl-10'
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSelectedUser(null)
                  }}
                />
              </div>

              {searchLoading && <p className='text-sm text-muted-foreground'>Searching...</p>}

              {!searchLoading && searchQuery.length >= 2 && (
                <div className='space-y-2'>
                  {(searchResults ?? [])
                    .filter((u) => !existingMemberIds.includes(u.id))
                    .map((user) => (
                      <button
                        key={user.id}
                        type='button'
                        onClick={() => setSelectedUser(user)}
                        className='w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors text-left'
                      >
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-10 w-10'>
                            {user.avatar ? (
                              <AvatarImage src={user.avatar} alt={user.name || 'User'} />
                            ) : (
                              <AvatarFallback className='bg-gradient-purple text-white'>
                                {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className='font-medium'>{user.name || 'User'}</p>
                            <p className='text-sm text-muted-foreground'>@{user.username || 'user'}</p>
                          </div>
                        </div>
                        <UserPlus className='h-4 w-4 text-muted-foreground' />
                      </button>
                    ))}
                </div>
              )}

              {selectedUser && (
                <div className='space-y-4 pt-2'>
                  <div className='space-y-2'>
                    <Label>Role</Label>
                    <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as TeamRole)}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select role' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='PLAYER'>Player</SelectItem>
                        <SelectItem value='CAPTAIN'>Captain</SelectItem>
                        <SelectItem value='SUBSTITUTE'>Substitute</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleAddMember} disabled={isSubmitting} className='w-full'>
                    {isSubmitting ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Adding...
                      </>
                    ) : (
                      'Add member'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='invite'>
          <Card>
            <CardHeader>
              <CardTitle>Invite by email</CardTitle>
              <CardDescription>Send an invitation to join the team</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='inviteEmail'>Email</Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='inviteEmail'
                    type='email'
                    placeholder='player@example.com'
                    className='pl-10'
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select role' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PLAYER'>Player</SelectItem>
                    <SelectItem value='CAPTAIN'>Captain</SelectItem>
                    <SelectItem value='SUBSTITUTE'>Substitute</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSendInvite} disabled={isSendingInvite} className='w-full'>
                {isSendingInvite ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Sending...
                  </>
                ) : (
                  'Send invitation'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

