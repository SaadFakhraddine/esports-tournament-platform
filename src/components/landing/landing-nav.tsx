'use client'

import Link from 'next/link'
import type { Session } from 'next-auth'
import { Button } from '@/components/ui/button'
import { Gamepad2 } from 'lucide-react'

export function LandingNav({ session }: { session: Session | null }) {
  return (
    <nav className='border-b border-cyan-500/20 backdrop-blur-xl bg-black/50 sticky top-0 z-50'>
      <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
        <Link href='/' className='flex items-center gap-2 group'>
          <div className='relative'>
            <Gamepad2 className='h-8 w-8 text-cyan-400 group-hover:text-pink-400 transition-colors' />
            <div className='absolute inset-0 blur-xl bg-cyan-400 opacity-50 group-hover:opacity-75 transition-opacity' />
          </div>
          <span className='text-2xl font-black tracking-wider'>
            <span className='text-cyan-400'>ESPORTS</span>
            <span className='text-pink-400'>ARENA</span>
          </span>
        </Link>
        <div className='flex gap-3'>
          {session ? (
            <Link href='/dashboard'>
              <Button className='bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold shadow-lg shadow-cyan-500/50 hover:shadow-purple-500/50 transition-all'>
                DASHBOARD
              </Button>
            </Link>
          ) : (
            <>
              <Link href='/login'>
                <Button variant='ghost' className='text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10'>
                  SIGN IN
                </Button>
              </Link>
              <Link href='/register'>
                <Button className='bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold shadow-lg shadow-pink-500/50 transition-all'>
                  GET STARTED
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
