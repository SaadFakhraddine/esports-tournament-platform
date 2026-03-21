'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

  const { data: team, isLoading: teamLoading } = trpc.team.getOverviewById.useQuery(
    { id: teamId },
    { enabled: !!teamId }
  )
  const { data: members, isLoading: membersLoading } = trpc.team.getMembers.useQuery(
    { teamId },
    { enabled: !!teamId && !!team }
  )

  const { data: searchResults, isLoading: searchLoading } = trpc.user.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length >= 2 }
  )

  const addMemberMutation = trpc.team.addMember.useMutation()
  const sendInvitationMutation = trpc.invitation.send.useMutation()
  const utils = trpc.useUtils()

  if (status === 'loading' || teamLoading || membersLoading) {
    return (
      <DashboardLayout userRole={session?.user?.role}>
        <div className='max-w-3xl mx-auto space-y-6'>
          <Skeleton className='h-12 w-64' />
          <Skeleton className='h-96' />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    redirect('/login')
  }

  if (!team) {
    return (
      <DashboardLayout userRole={session.user.role}>
        <div className='text-center py-12'>
          <p className='text-lg font-medium'>Team not found</p>
        </div>
      </DashboardLayout>
    )
  }

  if (team.owner.id !== session.user.id) {
    return (
      <DashboardLayout userRole={session.user.role}>
        <div className='text-center py-12'>
          <p className='text-lg font-medium'>Only team owners can add members</p>
        </div>
      </DashboardLayout>
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
        title: 'Success!',
        description: `${selectedUser.name || selectedUser.username} added to team`,
      })

      // Invalidate queries
      await Promise.all([
        utils.team.getOverviewById.invalidate({ id: teamId }),
        utils.team.getMembers.invalidate({ teamId }),
      ])

      router.push(`/teams/${teamId}`)
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

  const handleSendInvitation = async () => {
    if (!inviteEmail) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      })
      return
    }

    setIsSendingInvite(true)

    try {
      await sendInvitationMutation.mutateAsync({
        teamId,
        email: inviteEmail,
        role: inviteRole,
      })

      toast({
        title: 'Invitation Sent!',
        description: `An invitation has been sent to ${inviteEmail}`,
      })

      setInviteEmail('')
      setInviteRole('PLAYER')
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
    <DashboardLayout userRole={session.user.role}>
      <div className='max-w-3xl mx-auto space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Add Team Member</h1>
          <p className='text-muted-foreground mt-2'>
            Search for a user to add to {team.name}
          </p>
        </div>

        {/* Tabs for Add Methods */}
        <Tabs defaultValue='direct' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='direct'>
              <UserPlus className='h-4 w-4 mr-2' />
              Direct Add
            </TabsTrigger>
            <TabsTrigger value='invite'>
              <Mail className='h-4 w-4 mr-2' />
              Send Invitation
            </TabsTrigger>
          </TabsList>

          {/* Direct Add Tab */}
          <TabsContent value='direct'>
            <Card>
          <CardHeader>
            <CardTitle>Search Users</CardTitle>
            <CardDescription>
              Search by username or email address
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Search Input */}
            <div className='space-y-2'>
              <Label htmlFor='search'>Search</Label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='search'
                  placeholder='Enter username or email...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>
              <p className='text-xs text-muted-foreground'>
                Type at least 2 characters to search
              </p>
            </div>

            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <div className='space-y-2'>
                <Label>Search Results</Label>
                <div className='border rounded-lg divide-y max-h-80 overflow-y-auto'>
                  {searchLoading ? (
                    <div className='p-8 text-center'>
                      <Loader2 className='h-6 w-6 animate-spin mx-auto mb-2' />
                      <p className='text-sm text-muted-foreground'>Searching...</p>
                    </div>
                  ) : !searchResults || searchResults.length === 0 ? (
                    <div className='p-8 text-center'>
                      <p className='text-sm text-muted-foreground'>No users found</p>
                    </div>
                  ) : (
                    searchResults.map((user) => {
                      const isAlreadyMember = existingMemberIds.includes(user.id)
                      const isCurrentUser = user.id === session.user.id

                      return (
                        <div
                          key={user.id}
                          className={`flex items-center justify-between p-4 ${
                            selectedUser?.id === user.id
                              ? 'bg-primary/10'
                              : 'hover:bg-muted/50'
                          } ${
                            isAlreadyMember || isCurrentUser
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            if (!isAlreadyMember && !isCurrentUser) {
                              setSelectedUser(user)
                            }
                          }}
                        >
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-10 w-10'>
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback>
                                {user.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='font-medium'>
                                {user.name || 'No name'}
                                {isCurrentUser && ' (You)'}
                              </p>
                              <p className='text-sm text-muted-foreground'>
                                @{user.username || 'no-username'}
                              </p>
                            </div>
                          </div>
                          {isAlreadyMember && (
                            <span className='text-xs text-muted-foreground'>
                              Already a member
                            </span>
                          )}
                          {isCurrentUser && (
                            <span className='text-xs text-muted-foreground'>
                              Team owner
                            </span>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* Selected User */}
            {selectedUser && (
              <div className='space-y-4 p-4 border rounded-lg bg-muted/50'>
                <div>
                  <Label>Selected User</Label>
                  <div className='flex items-center gap-3 mt-2'>
                    <Avatar className='h-12 w-12'>
                      <AvatarImage src={selectedUser.avatar || undefined} />
                      <AvatarFallback>
                        {selectedUser.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-medium'>{selectedUser.name || 'No name'}</p>
                      <p className='text-sm text-muted-foreground'>
                        @{selectedUser.username || 'no-username'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div className='space-y-2'>
                  <Label htmlFor='role'>Team Role</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as TeamRole)}
                  >
                    <SelectTrigger id='role'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='PLAYER'>Player</SelectItem>
                      <SelectItem value='SUBSTITUTE'>Substitute</SelectItem>
                      <SelectItem value='CAPTAIN'>Captain</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-muted-foreground'>
                    Select the role for this team member
                  </p>
                </div>

                {/* Action Buttons */}
                <div className='flex gap-2'>
                  <Button
                    onClick={handleAddMember}
                    disabled={isSubmitting}
                    className='flex-1'
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className='mr-2 h-4 w-4' />
                        Add to Team
                      </>
                    )}
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => setSelectedUser(null)}
                    disabled={isSubmitting}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Invitation Tab */}
          <TabsContent value='invite'>
            <Card>
              <CardHeader>
                <CardTitle>Send Invitation</CardTitle>
                <CardDescription>
                  Invite someone to join {team.name} by email
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Email Input */}
                <div className='space-y-2'>
                  <Label htmlFor='invite-email'>
                    Email Address <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    id='invite-email'
                    type='email'
                    placeholder='user@example.com'
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <p className='text-xs text-muted-foreground'>
                    They&apos;ll receive an invitation they can accept or decline
                  </p>
                </div>

                {/* Role Selection */}
                <div className='space-y-2'>
                  <Label htmlFor='invite-role'>Team Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value) => setInviteRole(value as TeamRole)}
                  >
                    <SelectTrigger id='invite-role'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='PLAYER'>Player</SelectItem>
                      <SelectItem value='SUBSTITUTE'>Substitute</SelectItem>
                      <SelectItem value='CAPTAIN'>Captain</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-muted-foreground'>
                    Select the role for this team member
                  </p>
                </div>

                {/* Send Button */}
                <div className='flex gap-2'>
                  <Button
                    onClick={handleSendInvitation}
                    disabled={isSendingInvite || !inviteEmail}
                    className='flex-1'
                  >
                    {isSendingInvite ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className='mr-2 h-4 w-4' />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </div>

                {/* Info Box */}
                <div className='p-4 bg-muted rounded-lg text-sm'>
                  <p className='font-medium mb-2'>How invitations work:</p>
                  <ul className='space-y-1 text-muted-foreground list-disc list-inside'>
                    <li>User receives notification of invitation</li>
                    <li>They can accept or decline</li>
                    <li>If they don&apos;t have an account, they can create one</li>
                    <li>Invitation expires after 7 days</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Cancel Button */}
        <div className='flex justify-end'>
          <Button
            variant='outline'
            onClick={() => router.push(`/teams/${teamId}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
