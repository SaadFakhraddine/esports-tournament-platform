'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Trophy, Users, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc/client'
import { browseListHref } from '@/lib/browse/search-url'

const MIN_QUERY_LENGTH = 2

function formatTournamentStatus(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function DashboardGlobalSearch() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const canSearch = debouncedQuery.length >= MIN_QUERY_LENGTH

  const { data, isLoading, isFetching } = trpc.search.global.useQuery(
    { q: debouncedQuery, limit: 5 },
    { enabled: canSearch },
  )

  const tournaments = data?.tournaments ?? []
  const teams = data?.teams ?? []
  const hasResults = tournaments.length > 0 || teams.length > 0
  const showPanel = open && query.trim().length > 0
  const showEmpty = canSearch && !isLoading && !isFetching && data !== undefined && !hasResults
  const trimmedQuery = query.trim()
  const tournamentsBrowseHref = browseListHref('/dashboard/discover/tournaments', {
    search: canSearch ? trimmedQuery : '',
  })
  const teamsBrowseHref = browseListHref('/dashboard/discover/teams', {
    search: canSearch ? trimmedQuery : '',
  })

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const navigate = (href: string) => {
    setOpen(false)
    setQuery('')
    setDebouncedQuery('')
    router.push(href)
  }

  return (
    <div ref={containerRef} className='relative w-full max-w-md'>
      <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10' />
      <Input
        ref={inputRef}
        type='search'
        role='combobox'
        aria-expanded={showPanel}
        aria-autocomplete='list'
        aria-controls='dashboard-global-search-results'
        placeholder='Search tournaments, teams...'
        className='pl-10 bg-background'
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false)
            inputRef.current?.blur()
          }
        }}
      />

      {showPanel && (
        <div
          id='dashboard-global-search-results'
          role='listbox'
          className='absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(24rem,70vh)] overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-lg'
        >
          {!canSearch && (
            <p className='px-4 py-3 text-sm text-muted-foreground'>
              Type at least {MIN_QUERY_LENGTH} characters to search
            </p>
          )}

          {canSearch && (isLoading || (isFetching && !data)) && (
            <div className='flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Searching…
            </div>
          )}

          {showEmpty && (
            <p className='px-4 py-6 text-sm text-muted-foreground'>No tournaments or teams found</p>
          )}

          {canSearch && hasResults && (
            <div className='py-2'>
              {tournaments.length > 0 && (
                <section>
                  <p className='px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    Tournaments
                  </p>
                  <ul>
                    {tournaments.map((t) => (
                      <li key={t.id}>
                        <button
                          type='button'
                          role='option'
                          className={cn(
                            'flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm',
                            'hover:bg-muted/80 focus:bg-muted/80 focus:outline-none',
                          )}
                          onClick={() => navigate(`/tournaments/${t.id}`)}
                        >
                          <Trophy className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
                          <span className='min-w-0 flex-1'>
                            <span className='block truncate font-medium'>{t.name}</span>
                            <span className='block truncate text-xs text-muted-foreground'>
                              {t.game.name} · {formatTournamentStatus(t.status)}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {teams.length > 0 && (
                <section className={tournaments.length > 0 ? 'border-t border-border mt-1 pt-1' : ''}>
                  <p className='px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    Teams
                  </p>
                  <ul>
                    {teams.map((team) => (
                      <li key={team.id}>
                        <button
                          type='button'
                          role='option'
                          className={cn(
                            'flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm',
                            'hover:bg-muted/80 focus:bg-muted/80 focus:outline-none',
                          )}
                          onClick={() => navigate(`/teams/${team.id}`)}
                        >
                          <Users className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
                          <span className='min-w-0 flex-1'>
                            <span className='block truncate font-medium'>
                              {team.name}
                              {team.tag ? (
                                <span className='ml-1.5 font-normal text-muted-foreground'>[{team.tag}]</span>
                              ) : null}
                            </span>
                            <span className='block truncate text-xs text-muted-foreground'>{team.game.name}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {canSearch && data !== undefined && !isLoading && (hasResults || showEmpty) && (
            <div className='border-t border-border px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 text-xs'>
              <Link
                href={tournamentsBrowseHref}
                className='text-primary hover:underline'
                onClick={() => setOpen(false)}
              >
                See all tournament results
              </Link>
              <Link
                href={teamsBrowseHref}
                className='text-primary hover:underline'
                onClick={() => setOpen(false)}
              >
                See all team results
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
