'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
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
  Calendar,
  Save
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import Link from 'next/link'
import {
  AdminDataTable,
  AdminDataTableBody,
  AdminDataTableCell,
  AdminDataTableHead,
  AdminDataTableHeader,
  AdminDataTableRow,
} from '@/components/admin/admin-data-table'

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession()
  const utils = trpc.useUtils()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'history'>('overview')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch real data
  const { data: profile } = trpc.user.getProfile.useQuery(undefined, { enabled: !!session })
  const { data: stats, isLoading: statsLoading } = trpc.user.getPlayerStats.useQuery(
    { range: 'all' },
    { enabled: !!session, staleTime: 60_000 },
  )
  const { data: myTeams, isLoading: myTeamsLoading } = trpc.team.getMyTeams.useQuery(undefined, {
    enabled: !!session && activeTab === 'teams',
  })
  const { data: tournaments, isLoading: tournamentsLoading } = trpc.tournament.getParticipatingTournaments.useQuery(
    {
      limit: 20,
    },
    { enabled: !!session && activeTab === 'history' }
  )

  useEffect(() => {
    if (!profile || isEditing) return
    setDisplayName(profile.name ?? '')
    setUsername(profile.username ?? '')
  }, [profile, isEditing])

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: async (updated) => {
      setFormError(null)
      setIsEditing(false)
      await utils.user.getProfile.invalidate()
      await updateSession?.({
        user: {
          name: updated.name ?? undefined,
          username: updated.username ?? undefined,
        },
      })
    },
    onError: (err) => {
      setFormError(err.message)
    },
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
  const teamsList = myTeams ?? []
  const tournamentsList = tournaments ?? []

  const handleCancelEdit = () => {
    if (profile) {
      setDisplayName(profile.name ?? '')
      setUsername(profile.username ?? '')
    }
    setFormError(null)
    setIsEditing(false)
  }

  const handleSaveProfile = () => {
    setFormError(null)
    const nameTrim = displayName.trim()
    const userTrim = username.trim()

    if (nameTrim.length < 2) {
      setFormError('Display name must be at least 2 characters.')
      return
    }
    if (userTrim.length > 0 && userTrim.length < 3) {
      setFormError('Username must be at least 3 characters, or leave it empty.')
      return
    }

    const input: { name: string; username?: string } = { name: nameTrim }
    if (userTrim.length >= 3) input.username = userTrim

    updateProfileMutation.mutate(input)
  }

  const avatarSrc = profile?.avatar ?? session.user.image ?? undefined
  const displayNameValue = profile?.name ?? session.user.name ?? 'User'
  const usernameValue = profile?.username ?? session.user.username
  const roleLabel = formatRoleLabel(session.user.role)
  const summary = stats?.summary

  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div className='flex flex-col gap-4 rounded-lg border bg-card p-6 md:flex-row md:items-center md:justify-between'>
          <div className='flex items-center gap-4 min-w-0'>
            <Avatar className='h-16 w-16'>
              <AvatarImage src={avatarSrc} alt={displayNameValue} />
              <AvatarFallback className='text-lg'>
                {displayNameValue.charAt(0) || session.user.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <h1 className='text-2xl font-semibold tracking-tight truncate'>{displayNameValue}</h1>
                <Badge variant='secondary' className='font-medium'>
                  {roleLabel}
                </Badge>
              </div>
              <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground'>
                <span className='truncate'>@{usernameValue || 'username'}</span>
                <span className='hidden sm:inline'>•</span>
                <span className='inline-flex items-center gap-1'>
                  <Calendar className='h-3.5 w-3.5' />
                  Member since {memberSinceDate}
                </span>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4'>
            <KpiStat label='Win rate' value={statsLoading ? null : summary ? `${summary.winRate}%` : '—'} />
            <KpiStat label='Matches' value={statsLoading ? null : summary ? String(summary.completedMatches) : '—'} />
            <KpiStat label='Teams' value={statsLoading ? null : summary ? String(summary.teamsCount) : '—'} />
            <KpiStat
              label='Active events'
              value={statsLoading ? null : summary ? String(summary.activeTournamentsCount) : '—'}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className='space-y-4'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='teams'>Teams</TabsTrigger>
            <TabsTrigger value='history'>History</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-4'>
            <Card>
              <CardHeader className='flex flex-row items-start justify-between gap-4'>
                <div>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Basic identity and account details.</CardDescription>
                </div>
                {!isEditing ? (
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-muted-foreground'
                    onClick={() => {
                      setFormError(null)
                      setIsEditing(true)
                    }}
                  >
                    Edit
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className='space-y-4'>
                {formError && (
                  <p className='text-sm text-destructive' role='alert'>
                    {formError}
                  </p>
                )}

                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Display name</Label>
                    <Input
                      id='name'
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!isEditing}
                      autoComplete='name'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='username'>Username</Label>
                    <Input
                      id='username'
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={!isEditing}
                      autoComplete='username'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <div className='flex items-center gap-2'>
                      <Input id='email' type='email' defaultValue={session.user.email || ''} disabled />
                      <Badge variant='outline' className='shrink-0'>
                        <Mail className='h-3 w-3 mr-1' />
                        Verified
                      </Badge>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='role'>Role</Label>
                    <Input id='role' defaultValue={roleLabel} disabled />
                  </div>
                </div>

                {isEditing ? (
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      className='gap-2'
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                    >
                      <Save className='h-4 w-4' />
                      {updateProfileMutation.isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                    <Button variant='outline' onClick={handleCancelEdit} disabled={updateProfileMutation.isPending}>
                      Cancel
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Security and authentication settings.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                <p className='text-sm text-muted-foreground'>
                  Password management depends on your sign-in method (email/password vs OAuth).
                </p>
                <Button variant='outline' disabled>
                  Change password (coming soon)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='teams' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Teams</CardTitle>
                <CardDescription>Teams you own or are a member of.</CardDescription>
              </CardHeader>
              <CardContent>
                {myTeamsLoading ? (
                  <div className='space-y-3'>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className='h-10 w-full' />
                    ))}
                  </div>
                ) : teamsList.length === 0 ? (
                  <div className='text-center py-8 text-muted-foreground'>
                    <p>You&apos;re not a member of any teams yet.</p>
                    <Link href='/teams/create'>
                      <Button className='mt-4'>Create a team</Button>
                    </Link>
                  </div>
                ) : (
                  <AdminDataTable>
                    <AdminDataTableHeader>
                      <AdminDataTableRow>
                        <AdminDataTableHead>Team</AdminDataTableHead>
                        <AdminDataTableHead>Game</AdminDataTableHead>
                        <AdminDataTableHead>Role</AdminDataTableHead>
                        <AdminDataTableHead className='text-right'>Members</AdminDataTableHead>
                      </AdminDataTableRow>
                    </AdminDataTableHeader>
                    <AdminDataTableBody>
                      {teamsList.map((team) => (
                        <AdminDataTableRow key={team.id}>
                          <AdminDataTableCell>
                            <Link href={`/teams/${team.id}`} className='font-medium hover:underline'>
                              {team.name}
                            </Link>
                          </AdminDataTableCell>
                          <AdminDataTableCell className='text-muted-foreground'>{team.game.name}</AdminDataTableCell>
                          <AdminDataTableCell>
                            <Badge variant='secondary' className='font-medium'>
                              {team.userRole}
                            </Badge>
                          </AdminDataTableCell>
                          <AdminDataTableCell className='text-right text-muted-foreground'>
                            {team._count.members}
                          </AdminDataTableCell>
                        </AdminDataTableRow>
                      ))}
                    </AdminDataTableBody>
                  </AdminDataTable>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='history' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Tournament history</CardTitle>
                <CardDescription>Tournaments you&apos;ve participated in.</CardDescription>
              </CardHeader>
              <CardContent>
                {tournamentsLoading ? (
                  <div className='space-y-3'>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className='h-10 w-full' />
                    ))}
                  </div>
                ) : tournamentsList.length === 0 ? (
                  <div className='text-center py-8 text-muted-foreground'>
                    <p>You haven&apos;t participated in any tournaments yet.</p>
                    <Link href='/tournaments'>
                      <Button className='mt-4'>Browse tournaments</Button>
                    </Link>
                  </div>
                ) : (
                  <AdminDataTable>
                    <AdminDataTableHeader>
                      <AdminDataTableRow>
                        <AdminDataTableHead>Tournament</AdminDataTableHead>
                        <AdminDataTableHead>Game</AdminDataTableHead>
                        <AdminDataTableHead>Status</AdminDataTableHead>
                        <AdminDataTableHead className='text-right'>Start</AdminDataTableHead>
                      </AdminDataTableRow>
                    </AdminDataTableHeader>
                    <AdminDataTableBody>
                      {tournamentsList.map((tournament) => (
                        <AdminDataTableRow key={tournament.id}>
                          <AdminDataTableCell>
                            <Link href={`/tournaments/${tournament.id}`} className='font-medium hover:underline'>
                              {tournament.name}
                            </Link>
                          </AdminDataTableCell>
                          <AdminDataTableCell className='text-muted-foreground'>{tournament.game.name}</AdminDataTableCell>
                          <AdminDataTableCell>
                            <Badge variant='outline' className={statusBadgeClass(tournament.status)}>
                              {tournament.status.replace(/_/g, ' ')}
                            </Badge>
                          </AdminDataTableCell>
                          <AdminDataTableCell className='text-right text-muted-foreground'>
                            {new Date(tournament.startDate).toLocaleDateString()}
                          </AdminDataTableCell>
                        </AdminDataTableRow>
                      ))}
                    </AdminDataTableBody>
                  </AdminDataTable>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function KpiStat({ label, value }: { label: string; value: string | null }) {
  return (
    <div className='rounded-md border bg-background/40 px-3 py-2'>
      <div className='text-[11px] uppercase tracking-wide text-muted-foreground'>{label}</div>
      {value === null ? (
        <Skeleton className='mt-1 h-5 w-14' />
      ) : (
        <div className='mt-1 font-mono text-lg font-semibold tabular-nums'>{value}</div>
      )}
    </div>
  )
}

function formatRoleLabel(role: string | undefined): string {
  switch (role) {
    case 'ADMIN':
      return 'Admin'
    case 'ORGANIZER':
      return 'Organizer'
    case 'PLAYER':
      return 'Player'
    case 'SPECTATOR':
      return 'Spectator'
    default:
      return role ? role.toLowerCase() : 'User'
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'REGISTRATION':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'SEEDING':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
    case 'IN_PROGRESS':
      return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'COMPLETED':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    case 'CANCELLED':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    default:
      return ''
  }
}
