'use client'

import Link from 'next/link'
import { Award, Crown, Shield, Star, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export interface TeamItem {
  id: string
  name: string
  wins: number
  losses: number
  winRate: number
}

export interface PlayerItem {
  id: string
  name: string
  winCount: number
}

export interface ChampionItem {
  matchId: string
  tournamentId: string
  tournamentName: string
  gameName: string
  winnerTeam: {
    name: string
  }
  completedAt: Date
}

type LeaderboardData = {
  topTeams?: TeamItem[]
  topPlayers?: PlayerItem[]
  recentChampions?: ChampionItem[]
}

type LeaderboardItem = TeamItem | PlayerItem | ChampionItem

function LeaderboardCard<T extends LeaderboardItem>({
  title,
  icon,
  items,
  color,
  renderItem,
  loading = false,
}: {
  title: string
  icon: React.ReactNode
  items: T[]
  color: 'cyan' | 'purple' | 'pink'
  renderItem: (item: T, idx: number) => React.ReactNode
  loading?: boolean
}) {
  const colorClasses = {
    cyan: {
      border: 'border-cyan-500/30',
      gradient1: 'from-cyan-500',
      gradient2: 'to-blue-500',
      text: 'text-cyan-400',
    },
    purple: {
      border: 'border-purple-500/30',
      gradient1: 'from-purple-500',
      gradient2: 'to-pink-500',
      text: 'text-purple-400',
    },
    pink: {
      border: 'border-pink-500/30',
      gradient1: 'from-pink-500',
      gradient2: 'to-red-500',
      text: 'text-pink-400',
    },
  }

  const currentColor = colorClasses[color]

  return (
    <div className='relative group'>
      <div
        className={`absolute -inset-1 bg-gradient-to-r ${currentColor.gradient1} ${currentColor.gradient2} rounded-2xl blur-xl opacity-25 group-hover:opacity-50 transition-opacity`}
      />
      <Card className={`relative bg-black/80 border-2 ${currentColor.border} backdrop-blur-xl`}>
        <CardContent className='p-6'>
          <div className='flex items-center gap-2 mb-6'>
            <div className={`${currentColor.text}`}>{icon}</div>
            <h3 className='text-sm font-black tracking-widest text-gray-400'>{title}</h3>
          </div>
          <div className='space-y-2'>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className='h-14 rounded-lg bg-gray-900/80 animate-pulse border border-white/5' />
              ))
            ) : items.length > 0 ? (
              items.map((item, idx) => (
                <div
                  key={
                    'matchId' in item && item.matchId
                      ? item.matchId
                      : 'id' in item && item.id
                        ? item.id
                        : `${title}-${idx}`
                  }
                >
                  {renderItem(item, idx)}
                </div>
              ))
            ) : (
              <p className='text-center py-8 text-gray-600 text-sm'>No data yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function LandingHallOfFame({
  leaderboardsLoading,
  leaderboards,
}: {
  leaderboardsLoading: boolean
  leaderboards: LeaderboardData | undefined
}) {
  return (
    <section className='py-20'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h2 className='text-5xl font-black mb-4'>
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400'>
              HALL OF FAME
            </span>
          </h2>
          <p className='text-gray-400'>The best of the best</p>
        </div>

        <div className='grid md:grid-cols-3 gap-6 max-w-6xl mx-auto'>
          <LeaderboardCard
            title='TOP TEAMS'
            icon={<Shield className='h-5 w-5' />}
            loading={leaderboardsLoading}
            items={leaderboards?.topTeams?.slice(0, 5) || []}
            color='cyan'
            renderItem={(team: TeamItem, idx: number) => (
              <div className='flex items-center gap-3 p-3 rounded-lg hover:bg-cyan-400/5 transition-all group cursor-pointer'>
                <div className='text-2xl font-black text-gray-600 w-8'>#{idx + 1}</div>
                <div className='h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center'>
                  <Trophy className='h-5 w-5 text-white' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-bold truncate text-white group-hover:text-cyan-400 transition-colors'>{team.name}</p>
                  <p className='text-xs text-gray-500'>
                    {team.wins}W - {team.losses}L
                  </p>
                </div>
                <div className='text-cyan-400 font-black text-lg'>{team.winRate}%</div>
              </div>
            )}
          />

          <LeaderboardCard
            title='TOP PLAYERS'
            icon={<Crown className='h-5 w-5' />}
            loading={leaderboardsLoading}
            items={leaderboards?.topPlayers?.slice(0, 5) || []}
            color='purple'
            renderItem={(player: PlayerItem, idx: number) => (
              <div className='flex items-center gap-3 p-3 rounded-lg hover:bg-purple-400/5 transition-all group cursor-pointer'>
                <div className='text-2xl font-black text-gray-600 w-8'>#{idx + 1}</div>
                <div className='h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center'>
                  <Star className='h-5 w-5 text-white' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-bold truncate text-white group-hover:text-purple-400 transition-colors'>
                    {player.name}
                  </p>
                  <p className='text-xs text-gray-500'>Match wins (teams owned)</p>
                </div>
                <div className='text-purple-400 font-black text-lg'>{player.winCount}</div>
              </div>
            )}
          />

          <LeaderboardCard
            title='RECENT WINNERS'
            icon={<Award className='h-5 w-5' />}
            loading={leaderboardsLoading}
            items={leaderboards?.recentChampions?.slice(0, 5) || []}
            color='pink'
            renderItem={(champion: ChampionItem) => (
              <Link href={`/tournaments/${champion.tournamentId}`}>
                <div className='p-3 rounded-lg hover:bg-pink-400/5 transition-all group cursor-pointer'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Trophy className='h-6 w-6 text-yellow-400' />
                    <span className='font-bold text-white group-hover:text-pink-400 transition-colors'>
                      {champion.winnerTeam.name}
                    </span>
                  </div>
                  <p className='text-sm text-gray-400 truncate'>{champion.tournamentName}</p>
                  <p className='text-xs text-pink-400/80 mt-0.5'>{champion.gameName}</p>
                  <p className='text-xs text-gray-600 mt-1'>
                    {new Date(champion.completedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            )}
          />
        </div>
      </div>
    </section>
  )
}
