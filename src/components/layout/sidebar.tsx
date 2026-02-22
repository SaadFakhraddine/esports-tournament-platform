'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Trophy,
  Users,
  Calendar,
  User,
  Shield,
  Home,
  Menu,
  X,
  Mail,
} from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  userRole?: string
}

const navigation = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
    roles: ['ADMIN', 'ORGANIZER', 'PLAYER', 'SPECTATOR'],
  },
  {
    name: 'Tournaments',
    href: '/tournaments',
    icon: Trophy,
    roles: ['ADMIN', 'ORGANIZER', 'PLAYER', 'SPECTATOR'],
  },
  {
    name: 'Teams',
    href: '/teams',
    icon: Users,
    roles: ['ADMIN', 'ORGANIZER', 'PLAYER', 'SPECTATOR'],
  },
  {
    name: 'My Tournaments',
    href: '/dashboard/tournaments',
    icon: Calendar,
    roles: ['ADMIN', 'ORGANIZER'],
  },
  {
    name: 'Invitations',
    href: '/dashboard/invitations',
    icon: Mail,
    roles: ['ADMIN', 'ORGANIZER', 'PLAYER'],
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: User,
    roles: ['ADMIN', 'ORGANIZER', 'PLAYER'],
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: Shield,
    roles: ['ADMIN'],
  },
]

export function Sidebar({ userRole = 'PLAYER' }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userRole)
  )

  const SidebarContent = () => (
    <div className='flex h-full flex-col'>
      {/* Logo */}
      <div className='flex h-16 items-center border-b border-border px-6'>
        <Link href='/' className='flex items-center space-x-2'>
          <div className='h-8 w-8 rounded-lg bg-gradient-purple-cyan flex items-center justify-center'>
            <Trophy className='h-5 w-5 text-white' />
          </div>
          <span className='text-xl font-bold text-gradient-purple-cyan'>
            TourneyHub
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className='flex-1 space-y-1 px-3 py-4'>
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg glow-purple'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 transition-transform duration-200',
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className='border-t border-border p-4'>
        <div className='text-xs text-muted-foreground'>
          <p>© 2026 TourneyHub</p>
          <p className='mt-1'>Esports Tournament Platform</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className='fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-card p-2 shadow-lg border border-border'
      >
        {isMobileOpen ? (
          <X className='h-6 w-6' />
        ) : (
          <Menu className='h-6 w-6' />
        )}
      </button>

      {/* Mobile sidebar */}
      {isMobileOpen && (
        <>
          <div
            className='fixed inset-0 z-40 bg-black/50 lg:hidden'
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className='fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border lg:hidden animate-slide-in-from-left'>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className='hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-card border-r border-border'>
        <SidebarContent />
      </aside>
    </>
  )
}
