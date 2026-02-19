"use client"

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Gamepad2, Github, Twitter, Mail } from 'lucide-react'

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Esports Arena
            </span>
          </Link>
          <div className="flex gap-3 items-center">
            <Link href="/tournaments">
              <Button variant="ghost">Tournaments</Button>
            </Link>
            {session ? (
              <Link href="/dashboard">
                <Button className="gradient-purple glow-purple-hover">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button className="gradient-purple glow-purple-hover">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Gamepad2 className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">Esports Arena</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The ultimate platform for esports tournament management and competition.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/tournaments" className="hover:text-primary transition-colors">
                    Tournaments
                  </Link>
                </li>
                <li>
                  <Link href="/teams" className="hover:text-primary transition-colors">
                    Teams
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Rules
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="h-10 w-10 rounded-full bg-muted hover:bg-primary/20 flex items-center justify-center transition-colors"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="h-10 w-10 rounded-full bg-muted hover:bg-primary/20 flex items-center justify-center transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="h-10 w-10 rounded-full bg-muted hover:bg-primary/20 flex items-center justify-center transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 Esports Arena. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
