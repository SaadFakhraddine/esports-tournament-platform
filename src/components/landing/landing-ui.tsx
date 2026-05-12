'use client'

import Link from 'next/link'
import type { SVGProps } from 'react'
import { Calendar, Users, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: number
  label: string
  color: 'cyan' | 'purple' | 'pink'
}) {
  const colorClasses = {
    cyan: {
      gradient: 'from-cyan-500 to-blue-500',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
    },
    purple: {
      gradient: 'from-purple-500 to-pink-500',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
    },
    pink: {
      gradient: 'from-pink-500 to-red-500',
      text: 'text-pink-400',
      border: 'border-pink-500/30',
    },
  }

  const currentColor = colorClasses[color]

  return (
    <div className='relative group'>
      <div
        className={`absolute -inset-1 bg-gradient-to-r ${currentColor.gradient} rounded-xl blur opacity-25 group-hover:opacity-50 transition-opacity`}
      />
      <Card className={`relative bg-black/80 border ${currentColor.border} backdrop-blur-xl`}>
        <CardContent className='p-6 text-center'>
          <div className={`${currentColor.text} mb-2 flex justify-center`}>{icon}</div>
          <div className='text-4xl font-black text-white'>{value}</div>
          <div className='text-xs font-bold text-gray-500 tracking-widest'>{label}</div>
        </CardContent>
      </Card>
    </div>
  )
}

interface GameCardProps {
  name: string
  players: string
  gradient: string
  Image: React.ComponentType<SVGProps<SVGSVGElement>>
}

export function GameCard({ name, players, gradient, Image }: GameCardProps) {
  return (
    <div className='relative group cursor-pointer'>
      <div
        className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-2xl blur-xl opacity-25 group-hover:opacity-50 transition-opacity`}
      />
      <Card className='relative bg-black/80 border-2 border-gray-800 hover:border-gray-700 backdrop-blur-xl overflow-hidden aspect-square'>
        <CardContent className='p-0 h-full flex flex-col items-center justify-center relative'>
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20`} />
          <div className='relative z-10 text-center p-6'>
            <div className='h-28 w-28 mx-auto mb-4 flex items-center justify-center'>
              <Image className='h-full w-full' aria-label={name} />
            </div>
            <h3 className='text-xl font-black text-white mb-2'>{name}</h3>
            <p className='text-sm text-gray-400'>{players} Players</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function FeatureItem({
  icon,
  text,
  color = 'cyan',
}: {
  icon: React.ReactNode
  text: string
  color?: 'cyan' | 'pink'
}) {
  const colorClasses = {
    cyan: 'text-cyan-400',
    pink: 'text-pink-400',
  }

  const textColor = colorClasses[color] || colorClasses.cyan

  return (
    <div className='flex items-center gap-3'>
      <div className={`${textColor}`}>{icon}</div>
      <span className='text-gray-300'>{text}</span>
    </div>
  )
}

export interface TournamentCardNeonTournament {
  id: string
  name: string
  game?: {
    icon?: string
  }
  _count?: {
    registrations: number
  }
  startDate: string | Date
}

export function TournamentCardNeon({
  tournament,
  isLive = false,
}: {
  tournament: TournamentCardNeonTournament
  isLive?: boolean
}) {
  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <div
        className={`p-4 rounded-xl border-2 ${isLive ? 'border-red-500/30 bg-red-500/5' : 'border-gray-800 bg-gray-900/50'} hover:bg-gray-800/50 transition-all group cursor-pointer`}
      >
        <div className='flex items-start justify-between mb-2'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              {tournament.game?.icon && <span className='text-lg'>{tournament.game.icon}</span>}
              {isLive && (
                <Badge className='bg-red-500 text-white text-xs font-bold'>
                  <Zap className='h-3 w-3 mr-1 animate-pulse' />
                  LIVE
                </Badge>
              )}
            </div>
            <h3 className='font-bold text-white group-hover:text-cyan-400 transition-colors leading-tight'>
              {tournament.name}
            </h3>
          </div>
        </div>
        <div className='flex items-center justify-between text-xs text-gray-500'>
          <span className='flex items-center gap-1'>
            <Users className='h-3 w-3' />
            {tournament._count?.registrations || 0} teams
          </span>
          <span className='flex items-center gap-1'>
            <Calendar className='h-3 w-3' />
            {new Date(tournament.startDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  )
}

export function StepCard({
  number,
  icon,
  title,
  description,
  color,
}: {
  number: string
  icon: React.ReactNode
  title: string
  description: string
  color: 'cyan' | 'purple' | 'pink'
}) {
  const colorClasses = {
    cyan: {
      gradient1: 'from-cyan-500',
      gradient2: 'to-blue-500',
      text: 'text-cyan-400',
    },
    purple: {
      gradient1: 'from-purple-500',
      gradient2: 'to-pink-500',
      text: 'text-purple-400',
    },
    pink: {
      gradient1: 'from-pink-500',
      gradient2: 'to-red-500',
      text: 'text-pink-400',
    },
  }

  const currentColor = colorClasses[color]

  return (
    <div className='relative group'>
      <div
        className={`absolute -inset-1 bg-gradient-to-r ${currentColor.gradient1} ${currentColor.gradient2} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity`}
      />
      <Card className='relative bg-black/80 border-2 border-gray-800 hover:border-gray-700 backdrop-blur-xl transition-all'>
        <CardContent className='p-8 text-center'>
          <div className='text-6xl font-black text-gray-800 mb-4'>{number}</div>
          <div className={`${currentColor.text} mb-4 flex justify-center`}>{icon}</div>
          <h3 className='text-xl font-black text-white mb-2'>{title}</h3>
          <p className='text-sm text-gray-500'>{description}</p>
        </CardContent>
      </Card>
    </div>
  )
}
