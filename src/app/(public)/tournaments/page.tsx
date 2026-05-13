'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { TournamentCard } from '@/components/tournament/tournament-card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Search, Trophy, AlertCircle, RefreshCw } from 'lucide-react'

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

  const { data, isLoading, isError, refetch, isFetching } = trpc.tournament.getAll.useQuery({
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

  const clearSearchAndTab = () => {
    setSearchQuery('')
    handleTabChange('all')
  }

  const filteredTournaments = data?.tournaments || []
  const hasActiveFilters = Boolean(debouncedSearch) || activeTab !== 'all'

  return (
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
        {isFetching && !isLoading && !isError && (
          <p className='text-xs text-muted-foreground'>Updating results…</p>
        )}
      </div>

      {isError && (
        <Alert variant='destructive' className='max-w-2xl mx-auto'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Couldn&apos;t load tournaments</AlertTitle>
          <AlertDescription className='mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <span className='text-sm'>Check your connection and try again.</span>
            <Button type='button' variant='outline' size='sm' className='shrink-0 border-destructive/40' onClick={() => void refetch()}>
              <RefreshCw className='mr-2 h-4 w-4' />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
            ) : isError ? (
              <p className='text-sm text-muted-foreground'>Results unavailable</p>
            ) : (
              <p className='text-sm text-muted-foreground'>
                {filteredTournaments.length} tournament{filteredTournaments.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          {/* Tournament grid */}
          {isError ? null : isLoading ? (
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
                {hasActiveFilters ? (
                  <Search className='h-10 w-10 text-muted-foreground' />
                ) : (
                  <Trophy className='h-10 w-10 text-muted-foreground' />
                )}
              </div>
              <h3 className='text-lg font-semibold mb-2'>No tournaments found</h3>
              <p className='text-muted-foreground mb-6 max-w-md'>
                {hasActiveFilters
                  ? 'Nothing matches your search or filters. Try widening your criteria.'
                  : 'There are no public tournaments right now. Check back soon, or explore the rest of the platform.'}
              </p>
              <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center'>
                {hasActiveFilters && (
                  <Button type='button' variant='outline' onClick={clearSearchAndTab}>
                    Clear search & filters
                  </Button>
                )}
                <Button type='button' variant='ghost' asChild>
                  <Link href='/'>Back to home</Link>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function TournamentsPage() {
  return (
    <Suspense
      fallback={
        <div className='space-y-8'>
          <div className='text-center space-y-4'>
            <Skeleton className='h-12 w-72 mx-auto' />
            <Skeleton className='h-5 max-w-2xl mx-auto' />
          </div>
          <Skeleton className='h-10 max-w-xl mx-auto rounded-md' />
          <Skeleton className='h-10 max-w-2xl mx-auto rounded-md' />
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className='h-80 w-full rounded-lg' />
            ))}
          </div>
        </div>
      }
    >
      <TournamentsContent />
    </Suspense>
  )
}

