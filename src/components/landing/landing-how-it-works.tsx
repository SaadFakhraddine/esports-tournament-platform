'use client'

import { Crown, Swords, Target } from 'lucide-react'
import { StepCard } from './landing-ui'

export function LandingHowItWorks() {
  return (
    <section className='py-20 relative'>
      <div className='absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-purple-500/5 to-pink-500/5' />
      <div className='container mx-auto px-4 relative'>
        <div className='text-center mb-12'>
          <h2 className='text-5xl font-black mb-4'>
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400'>
              HOW IT WORKS
            </span>
          </h2>
        </div>
        <div className='grid md:grid-cols-3 gap-8 max-w-5xl mx-auto'>
          <StepCard
            number='01'
            icon={<Swords className='h-12 w-12' />}
            title='CREATE ACCOUNT'
            description='Sign up and join the competitive scene'
            color='cyan'
          />
          <StepCard
            number='02'
            icon={<Target className='h-12 w-12' />}
            title='JOIN TOURNAMENT'
            description='Register your team and prepare for battle'
            color='purple'
          />
          <StepCard
            number='03'
            icon={<Crown className='h-12 w-12' />}
            title='CLAIM VICTORY'
            description='Compete, win, and earn your place in history'
            color='pink'
          />
        </div>
      </div>
    </section>
  )
}
