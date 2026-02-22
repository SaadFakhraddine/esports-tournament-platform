'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Search,
  Calendar,
  Users,
  Settings,
  Eye,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { trpc } from '@/lib/trpc/client'
import { TournamentStatus } from '@prisma/client'

export default function TournamentsManagementPage() {
  const { data: session, status } = useSession({
    required: true,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<TournamentStatus | undefined>()

  const { data: tournaments, isLoading } = trpc.tournament.getMyTournaments.useQuery(
    { limit: 50, status: selectedStatus },
    { enabled: !!session }
  )

  if (status === 'loading' || !session) {
    return <div>Loading...</div>
  }

  // Role-based access control - only organizers and admins can manage tournaments
  if (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN') {
    redirect('/tournaments')
  }

  const filteredTournaments = tournaments?.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.game.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>My Tournaments</h1>
            <p className='text-muted-foreground mt-2'>
              Manage and organize your tournaments
            </p>
          </div>
          <Link href='/dashboard/tournaments/create'>
            <Button className='gap-2'>
              <Plus className='h-4 w-4' />
              Create Tournament
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search tournaments...'
              className='pl-10'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs for tournament status */}
        <Tabs
          defaultValue='all'
          className='space-y-4'
          onValueChange={(value) => {
            if (value === 'all') {
              setSelectedStatus(undefined)
            } else {
              setSelectedStatus(value.toUpperCase() as TournamentStatus)
            }
          }}
        >
          <TabsList>
            <TabsTrigger value='all'>All</TabsTrigger>
            <TabsTrigger value='draft'>Draft</TabsTrigger>
            <TabsTrigger value='registration'>Registration</TabsTrigger>
            <TabsTrigger value='in_progress'>In Progress</TabsTrigger>
            <TabsTrigger value='completed'>Completed</TabsTrigger>
          </TabsList>

          <TabsContent value='all' className='space-y-4'>
            <TournamentGrid tournaments={filteredTournaments} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value='draft' className='space-y-4'>
            <TournamentGrid tournaments={filteredTournaments} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value='registration' className='space-y-4'>
            <TournamentGrid tournaments={filteredTournaments} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value='in_progress' className='space-y-4'>
            <TournamentGrid tournaments={filteredTournaments} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value='completed' className='space-y-4'>
            <TournamentGrid tournaments={filteredTournaments} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

// Tournament Grid Component
type TournamentItem = {
  id: string
  name: string
  game: {
    id: string
    name: string
    icon?: string | null
  }
  status: string
  format: string
  _count?: {
    registrations?: number
  }
  maxTeams: number
  startDate: Date | string
}

function TournamentGrid({
  tournaments,
  isLoading,
}: {
  tournaments?: TournamentItem[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className='h-64' />
        ))}
      </div>
    )
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-muted-foreground mb-4'>No tournaments found</p>
        <Link href='/dashboard/tournaments/create'>
          <Button>Create Your First Tournament</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {tournaments.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </div>
  )
}

// Tournament Card Component
function TournamentCard({ tournament }: { tournament: TournamentItem }) {
  const statusColors = {
    DRAFT: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    REGISTRATION: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    SEEDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    IN_PROGRESS: 'bg-green-500/10 text-green-500 border-green-500/20',
    COMPLETED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
  }

  const formatLabels = {
    SINGLE_ELIMINATION: 'Single Elim',
    DOUBLE_ELIMINATION: 'Double Elim',
    ROUND_ROBIN: 'Round Robin',
    SWISS: 'Swiss',
  }

  return (
    <Card className='hover:shadow-lg transition-shadow'>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <CardTitle className='text-lg line-clamp-1'>{tournament.name}</CardTitle>
            <CardDescription>
              {tournament.game.icon && <span className='mr-1'>{tournament.game.icon}</span>}
              {tournament.game.name}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8'>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem asChild>
                <Link href={`/tournaments/${tournament.id}`}>
                  <Eye className='h-4 w-4 mr-2' />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/tournaments/${tournament.id}/edit`}>
                  <Settings className='h-4 w-4 mr-2' />
                  Manage
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/tournaments/${tournament.id}/registrations`}>
                  <Users className='h-4 w-4 mr-2' />
                  Registrations
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className='flex gap-2 mt-2'>
          <Badge
            variant='outline'
            className={statusColors[tournament.status as keyof typeof statusColors]}
          >
            {tournament.status.replace(/_/g, ' ')}
          </Badge>
          <Badge variant='secondary'>
            {formatLabels[tournament.format as keyof typeof formatLabels]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex items-center text-sm text-muted-foreground'>
          <Users className='h-4 w-4 mr-2' />
          {tournament._count?.registrations || 0}/{tournament.maxTeams} Teams
        </div>
        <div className='flex items-center text-sm text-muted-foreground'>
          <Calendar className='h-4 w-4 mr-2' />
          {new Date(tournament.startDate).toLocaleDateString()}
        </div>
      </CardContent>
      <CardFooter className='flex gap-2'>
        <Link href={`/tournaments/${tournament.id}`} className='flex-1'>
          <Button variant='outline' className='w-full gap-2'>
            <Eye className='h-4 w-4' />
            View
          </Button>
        </Link>
        <Link href={`/dashboard/tournaments/${tournament.id}/edit`} className='flex-1'>
          <Button className='w-full gap-2'>
            <Settings className='h-4 w-4' />
            Manage
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
