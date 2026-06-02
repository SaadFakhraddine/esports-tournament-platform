'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { TournamentCard } from '@/components/tournament/tournament-card'
import type { PublicTournamentsList } from '@/lib/tournaments/public-tournaments-data'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Search, Trophy, AlertCircle, RefreshCw } from 'lucide-react'
import { browseListHref, searchFromUrl } from '@/lib/browse/search-url'

export function TournamentsBrowseSkeleton() {
  return (
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
  )
}

export interface TournamentsBrowseProps {
  /** Base path for list + query sync (e.g. `/tournaments` or `/dashboard/discover/tournaments`) */
  listBasePath: string
  /** Target for empty-state “Back to home” */
  homeHref?: string
  /** Server-fetched list for the default "all" tab with no search */
  initialData?: PublicTournamentsList
}

export function TournamentsBrowse({ listBasePath, homeHref = '/', initialData }: TournamentsBrowseProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const filterParam = searchParams?.get('filter') || 'all'
  const [activeTab, setActiveTab] = useState(filterParam)

  useEffect(() => {
    setActiveTab(filterParam)
  }, [filterParam])

  useEffect(() => {
    setSearchQuery(searchFromUrl(searchParams))
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim()
      setDebouncedSearch(trimmed)

      const urlSearch = searchFromUrl(searchParams)
      if (trimmed === urlSearch) return

      const params = new URLSearchParams(searchParams?.toString() || '')
      router.replace(browseListHref(listBasePath, { search: trimmed, preserveParams: params }), {
        scroll: false,
      })
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery, searchParams, listBasePath, router])

  const queryInput = {
    limit: 30,
    status:
      activeTab === 'live'
        ? ('IN_PROGRESS' as const)
        : activeTab === 'open'
          ? ('REGISTRATION' as const)
          : activeTab === 'completed'
            ? ('COMPLETED' as const)
            : undefined,
    search: debouncedSearch || undefined,
  }

  const canUseInitialData =
    initialData && activeTab === 'all' && !debouncedSearch && filterParam === 'all'

  const { data, isLoading, isError, refetch, isFetching } = trpc.tournament.getAll.useQuery(
    queryInput,
    {
      initialData: canUseInitialData ? initialData : undefined,
    },
  )

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', value)
    }
    const qs = params.toString()
    router.push(`${listBasePath}${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  const clearSearchAndTab = () => {
    setSearchQuery('')
    setActiveTab('all')
    router.replace(listBasePath, { scroll: false })
  }

  const filteredTournaments = data?.tournaments || []
  const hasActiveFilters = Boolean(debouncedSearch) || activeTab !== 'all'

  return (
    <div className='space-y-8'>
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
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='shrink-0 border-destructive/40'
              onClick={() => void refetch()}
            >
              <RefreshCw className='mr-2 h-4 w-4' />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

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

      <Tabs value={activeTab} onValueChange={handleTabChange} className='space-y-6'>
        <TabsList className='grid w-full max-w-2xl mx-auto grid-cols-4'>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='live'>Live</TabsTrigger>
          <TabsTrigger value='open'>Open</TabsTrigger>
          <TabsTrigger value='completed'>Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className='space-y-6'>
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
                  <Link href={homeHref}>Back to home</Link>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
