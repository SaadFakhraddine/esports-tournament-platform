'use client'

import Cs2SVG from '@/assets/cs2.svg'
import ValorantSVG from '@/assets/valorant.svg'
import LeagueSVG from '@/assets/league-of-legends.svg'
import FortniteSVG from '@/assets/fortnite.svg'
import { GameCard } from './landing-ui'

export function LandingSupportedGames() {
  return (
    <section className='py-20 relative'>
      <div className='absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent' />
      <div className='container mx-auto px-4 relative'>
        <div className='text-center mb-12'>
          <h2 className='text-5xl font-black mb-4'>
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400'>
              SUPPORTED GAMES
            </span>
          </h2>
          <p className='text-gray-400 text-lg'>Compete in your favorite esports titles</p>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto'>
          <GameCard name='VALORANT' players='2.5K+' gradient='from-red-500 to-orange-500' Image={ValorantSVG} />
          <GameCard name='LEAGUE' players='3.2K+' gradient='from-blue-500 to-cyan-500' Image={LeagueSVG} />
          <GameCard name='CS2' players='1.8K+' gradient='from-yellow-500 to-orange-500' Image={Cs2SVG} />
          <GameCard name='FORTNITE' players='2.1K+' gradient='from-purple-500 to-pink-500' Image={FortniteSVG} />
        </div>
      </div>
    </section>
  )
}
