import { Suspense } from 'react'
import { TournamentsBrowse, TournamentsBrowseSkeleton } from '@/components/browse/tournaments-browse'
import { getPublicTournamentsList } from '@/lib/tournaments/public-tournaments-data'

export const revalidate = 60

export default async function TournamentsPage() {
  const initialData = await getPublicTournamentsList()

  return (
    <Suspense fallback={<TournamentsBrowseSkeleton />}>
      <TournamentsBrowse listBasePath='/tournaments' homeHref='/' initialData={initialData} />
    </Suspense>
  )
}
