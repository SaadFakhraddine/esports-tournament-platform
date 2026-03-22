'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Gamepad2 } from 'lucide-react'
import { SiteFooter } from '@/components/layout/site-footer'

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { data: session } = useSession()

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      {/* Navigation */}
      <nav className='border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50'>
        <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
          <Link href='/' className='flex items-center gap-2'>
            <Gamepad2 className='h-8 w-8 text-primary' />
            <span className='text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent'>
              Esports Arena
            </span>
          </Link>
          <div className='flex gap-3 items-center'>
            <Link href='/tournaments'>
              <Button variant='ghost'>Tournaments</Button>
            </Link>
            {session ? (
              <Link href='/dashboard'>
                <Button className='gradient-purple glow-purple-hover'>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href='/login'>
                  <Button variant='ghost'>Sign In</Button>
                </Link>
                <Link href='/register'>
                  <Button className='gradient-purple glow-purple-hover'>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className='flex-1 container mx-auto px-4 py-8'>
        {children}
      </main>

      <SiteFooter />
    </div>
  )
}
