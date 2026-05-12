'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function LandingFinalCta() {
  return (
    <section className='py-32 relative'>
      <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20' />
      <div className='container mx-auto px-4 text-center relative'>
        <h2 className='text-6xl md:text-7xl font-black mb-6'>
          <span className='text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400'>
            READY TO COMPETE?
          </span>
        </h2>
        <p className='text-2xl text-gray-400 mb-12 max-w-2xl mx-auto'>Join thousands of players in the arena</p>
        <Link href='/register'>
          <Button
            size='lg'
            className='bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white font-black text-xl px-16 py-8 shadow-2xl shadow-purple-500/50 hover:shadow-cyan-500/50 transition-all'
          >
            START NOW
            <ArrowRight className='ml-2 h-6 w-6' />
          </Button>
        </Link>
      </div>
    </section>
  )
}
