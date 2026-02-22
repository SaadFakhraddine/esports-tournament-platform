'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Mail,
  Trophy,
  Users,
  Calendar,
  Camera,
  Save
} from 'lucide-react'
import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [isEditing, setIsEditing] = useState(false)

  // Fetch real data
  const { data: profile } = trpc.user.getProfile.useQuery()
  const { data: stats } = trpc.user.getDashboardStats.useQuery()
  const { data: myTeams } = trpc.team.getMyTeams.useQuery()
  const { data: tournaments } = trpc.tournament.getParticipatingTournaments.useQuery({
    limit: 20,
  })

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    redirect('/login')
  }

  const memberSinceDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'N/A'

  const handleSaveProfile = async () => {
    // TODO: Implement profile update logic
    setIsEditing(false)
  }

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Profile</h1>
          <p className='text-muted-foreground mt-2'>
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Content */}
        <div className='grid gap-6 md:grid-cols-3'>
          {/* Sidebar with avatar and stats */}
          <div className='space-y-6'>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex flex-col items-center text-center space-y-4'>
                  <div className='relative'>
                    <Avatar className='h-24 w-24'>
                      <AvatarImage
                        src={session.user.image || undefined}
                        alt={session.user.name || 'User'}
                      />
                      <AvatarFallback className='text-2xl bg-gradient-purple text-white'>
                        {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size='icon'
                      variant='secondary'
                      className='absolute bottom-0 right-0 h-8 w-8 rounded-full'
                    >
                      <Camera className='h-4 w-4' />
                    </Button>
                  </div>
                  <div>
                    <h2 className='text-xl font-bold'>{session.user.name || 'User'}</h2>
                    <p className='text-sm text-muted-foreground'>
                      @{session.user.username || 'username'}
                    </p>
                    <Badge className='mt-2' variant='secondary'>
                      {session.user.role}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Statistics</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-sm'>
                    <Trophy className='h-4 w-4 text-muted-foreground' />
                    <span>Tournaments</span>
                  </div>
                  {stats ? (
                    <span className='font-medium'>{stats.activeTournamentsCount}</span>
                  ) : (
                    <Skeleton className='h-5 w-8' />
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-sm'>
                    <Users className='h-4 w-4 text-muted-foreground' />
                    <span>Teams</span>
                  </div>
                  {stats ? (
                    <span className='font-medium'>{stats.teamsCount}</span>
                  ) : (
                    <Skeleton className='h-5 w-8' />
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-sm'>
                    <Trophy className='h-4 w-4 text-muted-foreground' />
                    <span>Wins</span>
                  </div>
                  {stats ? (
                    <span className='font-medium'>{stats.wonMatches}</span>
                  ) : (
                    <Skeleton className='h-5 w-8' />
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-sm'>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                    <span>Member Since</span>
                  </div>
                  <span className='font-medium text-xs'>{memberSinceDate}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className='md:col-span-2'>
            <Tabs defaultValue='account' className='space-y-4'>
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='account'>Account</TabsTrigger>
                <TabsTrigger value='teams'>Teams</TabsTrigger>
                <TabsTrigger value='tournaments'>Tournaments</TabsTrigger>
              </TabsList>

              {/* Account Tab */}
              <TabsContent value='account' className='space-y-4'>
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>
                      Update your account details and profile information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='name'>Display Name</Label>
                        <Input
                          id='name'
                          defaultValue={session.user.name || ''}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='username'>Username</Label>
                        <Input
                          id='username'
                          defaultValue={session.user.username || ''}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='email'>Email</Label>
                        <div className='flex items-center gap-2'>
                          <Input
                            id='email'
                            type='email'
                            defaultValue={session.user.email || ''}
                            disabled
                          />
                          <Badge variant='outline' className='shrink-0'>
                            <Mail className='h-3 w-3 mr-1' />
                            Verified
                          </Badge>
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='role'>Role</Label>
                        <Input
                          id='role'
                          defaultValue={session.user.role}
                          disabled
                        />
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      {isEditing ? (
                        <>
                          <Button
                            className='gap-2'
                            onClick={handleSaveProfile}
                          >
                            <Save className='h-4 w-4' />
                            Save Changes
                          </Button>
                          <Button
                            variant='outline'
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setIsEditing(true)}>
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>
                      Manage your password and security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <Button variant='outline'>Change Password</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Teams Tab */}
              <TabsContent value='teams' className='space-y-4'>
                <Card>
                  <CardHeader>
                    <CardTitle>My Teams</CardTitle>
                    <CardDescription>
                      Teams you own or are a member of
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!myTeams ? (
                      <div className='space-y-4'>
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className='h-20 w-full' />
                        ))}
                      </div>
                    ) : myTeams.length === 0 ? (
                      <div className='text-center py-8 text-muted-foreground'>
                        <p>You&apos;re not a member of any teams yet.</p>
                        <Link href='/teams/create'>
                          <Button className='mt-4'>Create a Team</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        {myTeams.map((team) => (
                          <Link key={team.id} href={`/teams/${team.id}`}>
                            <TeamListItem
                              name={team.name}
                              game={team.game.name}
                              role={team.userRole}
                              members={team._count.members}
                              logo={team.logo}
                            />
                          </Link>
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
                      Tournaments you&apos;ve participated in
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!tournaments ? (
                      <div className='space-y-4'>
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className='h-20 w-full' />
                        ))}
                      </div>
                    ) : tournaments.length === 0 ? (
                      <div className='text-center py-8 text-muted-foreground'>
                        <p>You haven&apos;t participated in any tournaments yet.</p>
                        <Link href='/tournaments'>
                          <Button className='mt-4'>Browse Tournaments</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        {tournaments.map((tournament) => (
                          <TournamentListItem
                            key={tournament.id}
                            id={tournament.id}
                            name={tournament.name}
                            game={tournament.game.name}
                            status={tournament.status}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Team List Item Component
function TeamListItem({
  name,
  game,
  role,
  members,
  logo,
}: {
  name: string
  game: string
  role: string
  members: number
  logo?: string | null
}) {
  return (
    <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors'>
      <div className='flex items-center gap-4'>
        <Avatar className='h-12 w-12'>
          <AvatarImage src={logo || undefined} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className='font-medium'>{name}</p>
          <p className='text-sm text-muted-foreground'>{game}</p>
        </div>
      </div>
      <div className='flex items-center gap-3'>
        <div className='text-right'>
          <Badge variant='secondary'>{role}</Badge>
          <p className='text-xs text-muted-foreground mt-1'>
            {members} members
          </p>
        </div>
      </div>
    </div>
  )
}

// Tournament List Item Component
function TournamentListItem({
  id,
  name,
  game,
  status,
}: {
  id: string
  name: string
  game: string
  status: string
}) {
  const statusColors: Record<string, string> = {
    REGISTRATION: 'bg-blue-500/10 text-blue-500',
    SEEDING: 'bg-yellow-500/10 text-yellow-500',
    IN_PROGRESS: 'bg-green-500/10 text-green-500',
    COMPLETED: 'bg-purple-500/10 text-purple-500',
    CANCELLED: 'bg-red-500/10 text-red-500',
  }

  return (
    <Link href={`/tournaments/${id}`}>
      <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors'>
        <div className='flex items-center gap-4'>
          <div className='h-12 w-12 rounded-lg bg-gradient-purple flex items-center justify-center'>
            <Trophy className='h-6 w-6 text-white' />
          </div>
          <div>
            <p className='font-medium'>{name}</p>
            <p className='text-sm text-muted-foreground'>{game}</p>
          </div>
        </div>
        <div className='flex items-center gap-3 text-right'>
          <Badge
            variant='outline'
            className={statusColors[status] || ''}
          >
            {status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>
    </Link>
  )
}
