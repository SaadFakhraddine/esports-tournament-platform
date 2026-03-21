'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { PublicLayout } from '@/components/layout/public-layout'
import { TournamentCard } from '@/components/tournament/tournament-card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Trophy } from 'lucide-react'

function TournamentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Get filter from URL params
  const filterParam = searchParams?.get('filter') || 'all'
  const [activeTab, setActiveTab] = useState(filterParam)

  // Sync tab with URL param
  useEffect(() => {
    setActiveTab(filterParam)
  }, [filterParam])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data, isLoading } = trpc.tournament.getAll.useQuery({
    limit: 30,
    status:
      activeTab === 'live'
        ? 'IN_PROGRESS'
        : activeTab === 'open'
          ? 'REGISTRATION'
          : activeTab === 'completed'
            ? 'COMPLETED'
            : undefined,
    search: debouncedSearch || undefined,
  })

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Update URL without page reload
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', value)
    }
    router.push(`/tournaments${params.toString() ? '?' + params.toString() : ''}`, { scroll: false })
  }

  const filteredTournaments = data?.tournaments || []

  return (
    <PublicLayout>
      <div className='space-y-8'>
        {/* Page header */}
        <div className='text-center space-y-4'>
          <h1 className='text-4xl md:text-5xl font-bold tracking-tight'>
            <Trophy className='inline h-10 w-10 mr-3 text-primary' />
            <span className='text-gradient-purple-cyan'>Tournaments</span>
          </h1>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
            Browse and join competitive esports tournaments from around the world
          </p>
        </div>

        {/* Search bar */}
        <div className='max-w-xl mx-auto'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search tournaments...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>

        {/* Tabs for filtering */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className='space-y-6'>
          <TabsList className='grid w-full max-w-2xl mx-auto grid-cols-4'>
            <TabsTrigger value='all'>All</TabsTrigger>
            <TabsTrigger value='live'>Live</TabsTrigger>
            <TabsTrigger value='open'>Open</TabsTrigger>
            <TabsTrigger value='completed'>Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className='space-y-6'>
            {/* Results count */}
            <div className='text-center'>
              {isLoading ? (
                <Skeleton className='h-4 w-32 mx-auto' />
              ) : (
                <p className='text-sm text-muted-foreground'>
                  {filteredTournaments.length} tournament
                  {filteredTournaments.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>

            {/* Tournament grid */}
            {isLoading ? (
              <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className='h-80 w-full rounded-lg' />
                ))}
              </div>
            ) : filteredTournaments.length > 0 ? (
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
                  {searchQuery
                    ? 'Try adjusting your search query.'
                    : `No ${activeTab === 'all' ? '' : activeTab} tournaments available at the moment.`}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PublicLayout>
  )
}

export default function TournamentsPage() {
  return (
    <Suspense fallback={
      <PublicLayout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center space-y-4'>
            <Skeleton className='h-12 w-64 mx-auto' />
            <Skeleton className='h-4 w-96 mx-auto' />
          </div>
        </div>
      </PublicLayout>
    }>
      <TournamentsContent />
    </Suspense>
  )
}