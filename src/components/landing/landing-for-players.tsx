'use client'

import Image from 'next/image'
import { Crown, Star, TrendingUp, Trophy, Users } from 'lucide-react'
import { FeatureItem } from './landing-ui'

export function LandingForPlayers() {
  return (
    <section className='py-20 relative'>
      <div className='container mx-auto px-4 relative'>
        <div className='grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto'>
          <div className='relative group order-2 md:order-1'>
            <div className='absolute -inset-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity' />
            <div className='relative aspect-[16/10] max-h-[min(420px,55vh)] w-full rounded-2xl border-2 border-pink-500/30 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl shadow-pink-500/10'>
              <Image
                src='/images/dashboard-stats.png'
                alt='Player stats dashboard — win rate, matches by team and by game, recent matches'
                fill
                className='object-cover object-left-top'
                sizes='(max-width: 768px) 100vw, min(560px, 50vw)'
              />
            </div>
          </div>

          <div className='order-1 md:order-2'>
            <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-pink-400/30 bg-pink-400/5 backdrop-blur-sm mb-6'>
              <Star className='h-4 w-4 text-pink-400' />
              <span className='text-pink-400 text-sm font-bold tracking-wider'>FOR PLAYERS</span>
            </div>
            <h2 className='text-5xl font-black mb-6 leading-tight'>
              <span className='text-white'>PROVE YOUR</span>
              <br />
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400'>
                DOMINANCE
              </span>
            </h2>
            <p className='text-gray-400 text-lg mb-8 leading-relaxed'>
              Join tournaments, track your stats, and climb the leaderboards. Build your reputation and become a legend.
            </p>
            <div className='space-y-4'>
              <FeatureItem icon={<TrendingUp />} text='Track your win rate & stats' color='pink' />
              <FeatureItem icon={<Trophy />} text='Earn achievements & badges' color='pink' />
              <FeatureItem icon={<Users />} text='Find & join teams' color='pink' />
              <FeatureItem icon={<Crown />} text='Compete for prizes' color='pink' />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
