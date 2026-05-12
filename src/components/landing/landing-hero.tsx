'use client'

import Link from 'next/link'
import type { Session } from 'next-auth'
import { Button } from '@/components/ui/button'
import { ArrowRight, Crown, Play, Trophy, Users, Zap } from 'lucide-react'
import { StatCard } from './landing-ui'

export function LandingHero({
  session,
  isOrganizer,
  platformStats,
}: {
  session: Session | null
  isOrganizer: boolean
  platformStats:
    | {
        totalTournaments: number
        totalTeams: number
        tournamentsWithPrizes: number
      }
    | undefined
}) {
  return (
    <section className='relative min-h-[90vh] flex items-center'>
      <div className='absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-pink-500/5 mix-blend-overlay' />

      <div className='container mx-auto px-4 py-20'>
        <div className='max-w-6xl mx-auto text-center'>
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 backdrop-blur-sm mb-8'>
            <Zap className='h-4 w-4 text-cyan-400 animate-pulse' />
            <span className='text-cyan-400 text-sm font-bold tracking-wider'>NEXT-GEN TOURNAMENT PLATFORM</span>
          </div>

          <h1 className='text-6xl md:text-8xl font-black mb-6 leading-none'>
            <span className='block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-pulse'>
              DOMINATE
            </span>
            <span className='block text-white'>THE ARENA</span>
          </h1>

          <p className='text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto font-light'>
            Join the ultimate esports tournament platform. Compete, organize, and prove you&apos;re the best.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center mb-16'>
            {session && isOrganizer ? (
              <Link href='/dashboard/tournaments/create'>
                <Button
                  size='lg'
                  className='bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white font-black text-lg px-12 py-6 shadow-2xl shadow-purple-500/50 hover:shadow-cyan-500/50 transition-all'
                >
                  <Trophy className='mr-2 h-6 w-6' />
                  CREATE TOURNAMENT
                </Button>
              </Link>
            ) : (
              <Link href='/tournaments?filter=open'>
                <Button
                  size='lg'
                  className='bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white font-black text-lg px-12 py-6 shadow-2xl shadow-purple-500/50 hover:shadow-cyan-500/50 transition-all group'
                >
                  <Play className='mr-2 h-6 w-6 group-hover:animate-pulse' />
                  ENTER ARENA
                </Button>
              </Link>
            )}
            <Link href='/tournaments'>
              <Button
                size='lg'
                variant='outline'
                className='border-2 border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 font-bold text-lg px-12 py-6'
              >
                EXPLORE
                <ArrowRight className='ml-2 h-5 w-5' />
              </Button>
            </Link>
          </div>

          <div className='grid grid-cols-3 gap-6 max-w-3xl mx-auto'>
            <StatCard
              icon={<Trophy className='h-8 w-8' />}
              value={platformStats?.totalTournaments || 0}
              label='ACTIVE'
              color='cyan'
            />
            <StatCard
              icon={<Users className='h-8 w-8' />}
              value={platformStats?.totalTeams || 0}
              label='TEAMS'
              color='purple'
            />
            <StatCard
              icon={<Crown className='h-8 w-8' />}
              value={platformStats?.tournamentsWithPrizes || 0}
              label='PRIZES'
              color='pink'
            />
          </div>
        </div>
      </div>
    </section>
  )
}
