import Link from 'next/link'
import { Gamepad2, Github, Twitter, Mail } from 'lucide-react'

const currentYear = new Date().getFullYear()

type SiteFooterProps = {
  /** `dark` matches the landing page (black + neon). `default` matches app shell / light UI. */
  variant?: 'default' | 'dark'
}

const footerLinks = {
  platform: [
    { href: '/tournaments', label: 'Browse tournaments' },
    { href: '/teams', label: 'Teams' },
    { href: '/register', label: 'Create account' },
  ],
  organizers: [
    { href: '/dashboard/tournaments/create', label: 'Create tournament' },
    { href: '/dashboard/tournaments', label: 'Manage events' },
    { href: '/tournaments', label: 'Public listings' },
  ],
  legal: [
    { href: '#', label: 'Privacy' },
    { href: '#', label: 'Terms' },
    { href: '#', label: 'Contact' },
  ],
} as const

export function SiteFooter({ variant = 'default' }: SiteFooterProps) {
  const isDark = variant === 'dark'

  const shell = isDark
    ? 'border-t border-white/10 bg-gradient-to-b from-black/40 via-black/80 to-black text-gray-300'
    : 'border-t border-border/80 bg-muted/30 text-muted-foreground'

  const heading = isDark
    ? 'text-xs font-semibold uppercase tracking-[0.2em] text-gray-500'
    : 'text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70'

  const linkBase = isDark
    ? 'text-sm text-gray-400 transition-colors hover:text-cyan-400'
    : 'text-sm transition-colors hover:text-primary'

  const brandGradient = isDark ? (
    <>
      <span className='text-cyan-400'>ESPORTS</span>
      <span className='text-pink-400'>ARENA</span>
    </>
  ) : (
    <span className='bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent'>
      Esports Arena
    </span>
  )

  const iconBtn = isDark
    ? 'flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300'
    : 'flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary'

  return (
    <footer className={`mt-auto ${shell}`}>
      <div className='container mx-auto px-4 py-14 lg:py-16'>
        <div className='grid gap-12 lg:grid-cols-12 lg:gap-8'>
          {/* Brand */}
          <div className='lg:col-span-4'>
            <Link href='/' className='mb-5 inline-flex items-center gap-2.5'>
              <div
                className={
                  isDark
                    ? 'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-pink-500/20 ring-1 ring-white/10'
                    : 'flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10'
                }
              >
                <Gamepad2 className={`h-5 w-5 ${isDark ? 'text-cyan-400' : 'text-primary'}`} />
              </div>
              <span className={`text-lg font-black tracking-tight ${isDark ? '' : 'font-bold'}`}>
                {brandGradient}
              </span>
            </Link>
            <p className='max-w-sm text-sm leading-relaxed text-balance opacity-90'>
              Professional tournament operations for organizers and a clear competitive path for
              teams — brackets, registrations, and results in one place.
            </p>
            <div className='mt-6 flex flex-wrap gap-3'>
              <a
                href='https://github.com'
                target='_blank'
                rel='noopener noreferrer'
                className={iconBtn}
                aria-label='GitHub'
              >
                <Github className='h-4 w-4' />
              </a>
              <a
                href='https://twitter.com'
                target='_blank'
                rel='noopener noreferrer'
                className={iconBtn}
                aria-label='X (Twitter)'
              >
                <Twitter className='h-4 w-4' />
              </a>
              <a href='mailto:hello@example.com' className={iconBtn} aria-label='Email'>
                <Mail className='h-4 w-4' />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div className='lg:col-span-2'>
            <h3 className={heading}>Platform</h3>
            <ul className='mt-4 space-y-3'>
              {footerLinks.platform.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkBase}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Organizers */}
          <div className='lg:col-span-2'>
            <h3 className={heading}>Organizers</h3>
            <ul className='mt-4 space-y-3'>
              {footerLinks.organizers.map((item) => (
                <li key={item.href + item.label}>
                  <Link href={item.href} className={linkBase}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + account */}
          <div className='lg:col-span-2'>
            <h3 className={heading}>Legal</h3>
            <ul className='mt-4 space-y-3'>
              {footerLinks.legal.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className={linkBase}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <h3 className={`${heading} mt-8`}>Account</h3>
            <ul className='mt-4 space-y-3'>
              <li>
                <Link href='/login' className={linkBase}>
                  Sign in
                </Link>
              </li>
              <li>
                <Link href='/dashboard' className={linkBase}>
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* CTA card */}
          <div className='lg:col-span-2'>
            <div
              className={
                isDark
                  ? 'rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-pink-500/10 p-6 ring-1 ring-white/5'
                  : 'rounded-2xl border border-border bg-card p-6 shadow-sm'
              }
            >
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
                Run your next event
              </p>
              <p className='mt-2 text-xs leading-relaxed opacity-80'>
                Set up formats, approve rosters, and publish brackets — all from the organizer
                dashboard.
              </p>
              <Link
                href='/register'
                className={
                  isDark
                    ? 'mt-4 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-500 hover:to-purple-500'
                    : 'mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'
                }
              >
                Get started
              </Link>
            </div>
          </div>
        </div>

        <div
          className={
            isDark
              ? 'mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row'
              : 'mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row'
          }
        >
          <p className='text-center text-xs sm:text-left'>
            © {currentYear} Esports Arena. All rights reserved.
          </p>
          <p className='text-center text-xs opacity-70'>
            Tournament management for competitive gaming communities.
          </p>
        </div>
      </div>
    </footer>
  )
}
