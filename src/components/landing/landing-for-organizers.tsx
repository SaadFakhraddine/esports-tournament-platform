'use client'

import Image from 'next/image'
import { Calendar, CheckCircle, Trophy, Users } from 'lucide-react'
import { FeatureItem } from './landing-ui'

export function LandingForOrganizers() {
  return (
    <section className='py-20 relative overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-pink-500/5' />
      <div className='container mx-auto px-4 relative'>
        <div className='grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto'>
          <div>
            <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 backdrop-blur-sm mb-6'>
              <Trophy className='h-4 w-4 text-cyan-400' />
              <span className='text-cyan-400 text-sm font-bold tracking-wider'>FOR ORGANIZERS</span>
            </div>
            <h2 className='text-5xl font-black mb-6 leading-tight'>
              <span className='text-white'>CREATE</span>
              <br />
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400'>
                PROFESSIONAL
              </span>
              <br />
              <span className='text-white'>TOURNAMENTS</span>
            </h2>
            <p className='text-gray-400 text-lg mb-8 leading-relaxed'>
              Everything you need to run epic esports tournaments. From bracket generation to match scheduling,
              we&apos;ve got you covered.
            </p>
            <div className='space-y-4'>
              <FeatureItem icon={<CheckCircle />} text='Automatic bracket generation' />
              <FeatureItem icon={<Users />} text='Team management & registration' />
              <FeatureItem icon={<Trophy />} text='Real-time match tracking' />
              <FeatureItem icon={<Calendar />} text='Flexible scheduling system' />
            </div>
          </div>

          <div className='relative group'>
            <div className='absolute -inset-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-3xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity' />
            <div className='relative aspect-[16/10] max-h-[min(420px,55vh)] w-full rounded-2xl border-2 border-cyan-500/30 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl shadow-cyan-500/10'>
              <Image
                src='/images/dashboard-preview.png'
                alt='Tournament management dashboard — brackets, registrations, and match controls'
                fill
                className='object-cover object-left-top'
                sizes='(max-width: 768px) 100vw, min(560px, 50vw)'
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
