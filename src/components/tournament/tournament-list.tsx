'use client'

import { useState } from 'react'
import { TournamentCard } from './tournament-card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface Tournament {
  id: string
  name: string
  game: {
    id: string
    name: string
    slug: string
    icon?: string | null
  }
  format: string
  maxTeams: number
  startDate: Date
  status: string
  _count?: {
    registrations: number
  }
}

interface TournamentListProps {
  tournaments?: Tournament[]
  isLoading?: boolean
  showCreateButton?: boolean
}

export function TournamentList({
  tournaments = [],
  isLoading = false,
  showCreateButton = false,
}: TournamentListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [gameFilter, setGameFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formatFilter, setFormatFilter] = useState('all')

  // Filter tournaments
  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesGame = gameFilter === 'all' || tournament.game.name === gameFilter
    const matchesStatus =
      statusFilter === 'all' || tournament.status === statusFilter
    const matchesFormat =
      formatFilter === 'all' || tournament.format === formatFilter

    return matchesSearch && matchesGame && matchesStatus && matchesFormat
  })

  // Get unique games for filter
  const games = Array.from(new Set(tournaments.map((t) => t.game.name)))

  if (isLoading) {
    return (
      <div className='space-y-6'>
        {/* Skeleton filters */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <Skeleton className='h-10 w-full sm:w-64' />
          <div className='flex gap-2'>
            <Skeleton className='h-10 w-32' />
            <Skeleton className='h-10 w-32' />
            <Skeleton className='h-10 w-32' />
          </div>
        </div>

        {/* Skeleton cards */}
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className='space-y-4'>
              <Skeleton className='h-64 w-full rounded-lg' />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Filters */}
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        {/* Search */}
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='search'
            placeholder='Search tournaments...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>

        {/* Filters and Create button */}
        <div className='flex flex-wrap gap-2'>
          <Select value={gameFilter} onValueChange={setGameFilter}>
            <SelectTrigger className='w-[140px]'>
              <Filter className='mr-2 h-4 w-4' />
              <SelectValue placeholder='Game' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Games</SelectItem>
              {games.map((game) => (
                <SelectItem key={game} value={game}>
                  {game}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='UPCOMING'>Upcoming</SelectItem>
              <SelectItem value='REGISTRATION_OPEN'>Open</SelectItem>
              <SelectItem value='IN_PROGRESS'>Live</SelectItem>
              <SelectItem value='COMPLETED'>Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Format' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Formats</SelectItem>
              <SelectItem value='SINGLE_ELIMINATION'>Single Elim</SelectItem>
              <SelectItem value='DOUBLE_ELIMINATION'>Double Elim</SelectItem>
              <SelectItem value='ROUND_ROBIN'>Round Robin</SelectItem>
              <SelectItem value='SWISS'>Swiss</SelectItem>
            </SelectContent>
          </Select>

          {showCreateButton && (
            <Button className='gradient-purple glow-purple-hover' asChild>
              <Link href='/dashboard/tournaments/create'>
                <Plus className='mr-2 h-4 w-4' />
                Create Tournament
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          {filteredTournaments.length} tournament
          {filteredTournaments.length !== 1 ? 's' : ''} found
        </p>
        {(searchQuery || gameFilter !== 'all' || statusFilter !== 'all' || formatFilter !== 'all') && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setSearchQuery('')
              setGameFilter('all')
              setStatusFilter('all')
              setFormatFilter('all')
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Tournament grid */}
      {filteredTournaments.length > 0 ? (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {filteredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center py-20 text-center'>
          <div className='rounded-full bg-muted p-6 mb-4'>
            <Search className='h-10 w-10 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-semibold mb-2'>No tournaments found</h3>
          <p className='text-muted-foreground mb-6 max-w-md'>
            {searchQuery || gameFilter !== 'all' || statusFilter !== 'all' || formatFilter !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'There are no tournaments yet. Be the first to create one!'}
          </p>
          {showCreateButton && (
            <Button className='gradient-purple glow-purple-hover' asChild>
              <Link href='/dashboard/tournaments/create'>
                <Plus className='mr-2 h-4 w-4' />
                Create Tournament
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
