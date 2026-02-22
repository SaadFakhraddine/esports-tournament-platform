'use client'

import { Bell, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

export function Navbar() {
  const { data: session } = useSession()
  const { data: invitations } = trpc.invitation.getMyInvitations.useQuery(undefined, {
    enabled: !!session,
  })

  const pendingCount = invitations?.length || 0

  return (
    <header className='sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60'>
      <div className='flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8'>
        {/* Search */}
        <div className='flex flex-1 items-center gap-4'>
          <div className='relative w-full max-w-md'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search tournaments, teams...'
              className='pl-10 bg-background'
            />
          </div>
        </div>

        {/* Right section */}
        <div className='flex items-center gap-4'>
          {/* Notifications / Invitations */}
          {session && (
            <Link href='/dashboard/invitations'>
              <Button variant='ghost' size='icon' className='relative rounded-full hover:bg-muted'>
                <Bell className='h-5 w-5' />
                {pendingCount > 0 && (
                  <span className='absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center'>
                    {pendingCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {/* User menu */}
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary transition-all'
                >
                  <Avatar className='h-10 w-10'>
                    <AvatarImage
                      src={session.user.image || undefined}
                      alt={session.user.name || 'User'}
                    />
                    <AvatarFallback className='bg-gradient-purple text-white'>
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-56' align='end' forceMount>
                <DropdownMenuLabel className='font-normal'>
                  <div className='flex flex-col space-y-1'>
                    <p className='text-sm font-medium leading-none'>
                      {session.user.name || 'User'}
                    </p>
                    <p className='text-xs leading-none text-muted-foreground'>
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href='/dashboardprofile'>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href='/dashboard/tournaments'>My Tournaments</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href='/teams'>My Teams</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className='text-destructive focus:text-destructive'
                  onClick={() => signOut()}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className='flex items-center gap-2'>
              <Button variant='ghost' asChild>
                <Link href='/login'>Sign in</Link>
              </Button>
              <Button className='gradient-purple' asChild>
                <Link href='/register'>Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
