'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Target, Zap } from 'lucide-react'
import { TournamentCardNeon, type TournamentCardNeonTournament } from './landing-ui'

export function LandingLiveUpcoming({
  liveTournaments,
  upcomingTournaments,
}: {
  liveTournaments: TournamentCardNeonTournament[] | undefined
  upcomingTournaments: TournamentCardNeonTournament[] | undefined
}) {
  return (
    <section className='py-20 relative'>
      <div className='absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent' />
      <div className='container mx-auto px-4 relative'>
        <div className='grid md:grid-cols-2 gap-8'>
          <div className='relative group'>
            <div className='absolute -inset-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl blur-xl opacity-25 group-hover:opacity-50 transition-opacity' />
            <Card className='relative bg-black/80 border-2 border-red-500/30 backdrop-blur-xl'>
              <CardContent className='p-8'>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-3xl font-black flex items-center gap-3'>
                    <div className='relative'>
                      <Zap className='h-8 w-8 text-red-400 animate-pulse' />
                      <div className='absolute inset-0 blur-xl bg-red-400 opacity-50' />
                    </div>
                    <span className='text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400'>
                      LIVE NOW
                    </span>
                  </h2>
                  <Link href='/tournaments?filter=live'>
                    <Button variant='ghost' className='text-red-400 hover:text-red-300 hover:bg-red-400/10'>
                      VIEW ALL →
                    </Button>
                  </Link>
                </div>
                <div className='space-y-3'>
                  {liveTournaments && liveTournaments.length > 0 ? (
                    liveTournaments.slice(0, 3).map((tournament) => (
                      <TournamentCardNeon key={tournament.id} tournament={tournament} isLive />
                    ))
                  ) : (
                    <p className='text-center py-8 text-gray-500'>No live tournaments</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className='relative group'>
            <div className='absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-xl opacity-25 group-hover:opacity-50 transition-opacity' />
            <Card className='relative bg-black/80 border-2 border-cyan-500/30 backdrop-blur-xl'>
              <CardContent className='p-8'>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-3xl font-black flex items-center gap-3'>
                    <div className='relative'>
                      <Target className='h-8 w-8 text-cyan-400' />
                      <div className='absolute inset-0 blur-xl bg-cyan-400 opacity-50' />
                    </div>
                    <span className='text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400'>
                      OPEN NOW
                    </span>
                  </h2>
                  <Link href='/tournaments?filter=open'>
                    <Button variant='ghost' className='text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10'>
                      VIEW ALL →
                    </Button>
                  </Link>
                </div>
                <div className='space-y-3'>
                  {upcomingTournaments && upcomingTournaments.length > 0 ? (
                    upcomingTournaments.slice(0, 3).map((tournament) => (
                      <TournamentCardNeon key={tournament.id} tournament={tournament} />
                    ))
                  ) : (
                    <p className='text-center py-8 text-gray-500'>No open tournaments</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
