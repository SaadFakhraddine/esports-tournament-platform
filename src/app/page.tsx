"use client"

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import {
  Trophy,
  Users,
  DollarSign,
  TrendingUp,
  Zap,
  Calendar,
  Medal,
  Award,
  ArrowRight,
  Gamepad2,
  UserPlus,
  Target,
  Github,
  Twitter,
  Mail,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LandingPage() {
  const { data: session } = useSession()
  const { data: platformStats, isLoading: statsLoading } = trpc.stats.getPlatformStats.useQuery()
  const { data: liveTournaments, isLoading: liveLoading } = trpc.stats.getLiveTournaments.useQuery()
  const { data: upcomingTournaments, isLoading: upcomingLoading } =
    trpc.stats.getUpcomingTournaments.useQuery()
  const { data: leaderboards, isLoading: leaderboardsLoading } = trpc.stats.getLeaderboards.useQuery()
  const { data: recentActivity, isLoading: activityLoading } = trpc.stats.getRecentActivity.useQuery()

  const isOrganizer = session?.user?.role === 'ORGANIZER' || session?.user?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Esports Arena
            </span>
          </Link>
          <div className="flex gap-3">
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

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-cyan-500/10 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Compete in{' '}
              <span className="text-gradient-purple-cyan">Esports Tournaments</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              The ultimate platform for organizing and competing in esports tournaments.
              <br />
              Join thousands of players and teams battling for glory.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {session && isOrganizer ? (
                <Link href="/dashboard/tournaments/create">
                  <Button size="lg" className="gradient-purple glow-purple text-lg px-8">
                    <Trophy className="mr-2 h-5 w-5" />
                    Create Your First Tournament
                  </Button>
                </Link>
              ) : (
                <Link href="/tournaments?filter=open">
                  <Button size="lg" className="gradient-purple glow-purple text-lg px-8">
                    <Trophy className="mr-2 h-5 w-5" />
                    Register Now
                  </Button>
                </Link>
              )}
              <Link href="/tournaments">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Explore Tournaments
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {statsLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </>
              ) : (
                <>
                  <Card className="border-primary/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                    <CardContent className="pt-6 text-center">
                      <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="text-3xl font-bold">{platformStats?.totalTournaments || 0}</div>
                      <div className="text-sm text-muted-foreground">Tournaments</div>
                    </CardContent>
                  </Card>
                  <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
                    <CardContent className="pt-6 text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-cyan-500" />
                      <div className="text-3xl font-bold">{platformStats?.totalTeams || 0}</div>
                      <div className="text-sm text-muted-foreground">Teams</div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
                    <CardContent className="pt-6 text-center">
                      <Award className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <div className="text-3xl font-bold">{platformStats?.completedTournaments || 0}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
                    <CardContent className="pt-6 text-center">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      <div className="text-3xl font-bold">{platformStats?.tournamentsWithPrizes || 0}</div>
                      <div className="text-sm text-muted-foreground">With Prizes</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Live & Upcoming Tournaments */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Live Tournaments */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold flex items-center gap-2">
                  <Zap className="h-8 w-8 text-red-500" />
                  Live Tournaments
                </h2>
                <Link href="/tournaments?filter=live">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {liveLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : liveTournaments && liveTournaments.length > 0 ? (
                <div className="space-y-4">
                  {liveTournaments.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} isLive />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No live tournaments right now</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Upcoming Tournaments */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold flex items-center gap-2">
                  <Calendar className="h-8 w-8 text-blue-500" />
                  Open Registration
                </h2>
                <Link href="/tournaments?filter=open">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {upcomingLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : upcomingTournaments && upcomingTournaments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingTournaments.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No upcoming tournaments</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            <TrendingUp className="inline h-10 w-10 mr-2 text-primary" />
            Leaderboards
          </h2>
          {leaderboardsLoading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Top Teams */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Teams by Win Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboards?.topTeams && leaderboards.topTeams.length > 0 ? (
                    <div className="space-y-4">
                      {leaderboards.topTeams.map((team, idx) => (
                        <Link key={team.id} href={`/teams/${team.id}`}>
                          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="text-2xl font-bold text-muted-foreground w-8">
                              #{idx + 1}
                            </div>
                            {team.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={team.logo} alt={team.name ?? 'Team'} className="h-10 w-10 rounded-full" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-purple flex items-center justify-center">
                                <Users className="h-5 w-5 text-white" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{team.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {team.wins}W - {team.losses}L
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-500">{team.winRate}%</div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No team data yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Players */}
              <Card className="border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="h-5 w-5 text-cyan-500" />
                    Top Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboards?.topPlayers && leaderboards.topPlayers.length > 0 ? (
                    <div className="space-y-4">
                      {leaderboards.topPlayers.map((player, idx) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="text-2xl font-bold text-muted-foreground w-8">
                            #{idx + 1}
                          </div>
                          {player.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={player.avatar} alt={player.name ?? 'Player'} className="h-10 w-10 rounded-full" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-cyan flex items-center justify-center">
                              <UserPlus className="h-5 w-5 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{player.name}</p>
                            <p className="text-sm text-muted-foreground">Tournament Wins</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-cyan-500">{player.winCount}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No player data yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Champions */}
              <Card className="border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-500" />
                    Recent Champions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboards?.recentChampions && leaderboards.recentChampions.length > 0 ? (
                    <div className="space-y-4">
                      {leaderboards.recentChampions.map((champion) => (
                        <Link key={champion.tournamentId} href={`/tournaments/${champion.tournamentId}`}>
                          <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            {champion.winnerTeam ? (
                              <div className="flex items-center gap-2 mb-2">
                                {champion.winnerTeam.logo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={champion.winnerTeam.logo}
                                    alt={champion.winnerTeam.name}
                                    className="h-8 w-8 rounded-full"
                                  />
                                ) : (
                                  <Trophy className="h-8 w-8 text-yellow-500" />
                                )}
                                <span className="font-semibold">{champion.winnerTeam.name}</span>
                              </div>
                            ) : null}
                            <p className="text-sm text-muted-foreground truncate">
                              {champion.tournamentName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {champion.gameIcon} {champion.gameName} •{' '}
                              {new Date(champion.completedAt || '').toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No champions yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Recent Activity Feed */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            <Activity className="inline h-10 w-10 mr-2 text-primary" />
            Recent Activity
          </h2>
          <Card className="max-w-3xl mx-auto">
            <CardContent className="pt-6">
              {activityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-1">
                  {recentActivity.map((activity) => (
                    <Link key={activity.id} href={activity.link}>
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                        <div className="mt-1">
                          {activity.type === 'registration' && (
                            <UserPlus className="h-4 w-4 text-blue-500" />
                          )}
                          {activity.type === 'completion' && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                          {activity.type === 'new_tournament' && (
                            <Calendar className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm group-hover:text-primary transition-colors">
                            {activity.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Get started in three simple steps and join the competitive esports community
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-primary/20 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-gradient-purple flex items-center justify-center mb-4">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <CardTitle>1. Create Account</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Sign up as a player or organizer. Set up your profile and choose your role in the
                  competitive scene.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-cyan-500/20 hover:border-cyan-500/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-gradient-cyan flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle>2. Join Tournament</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Browse available tournaments, create or join a team, and register for competitions
                  in your favorite games.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-green-500/20 hover:border-green-500/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <CardTitle>3. Compete & Win</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Play your matches, track your progress, and climb the rankings. Prove you&apos;re the
                  best!
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-500/10 via-cyan-500/10 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of players competing in tournaments every day
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gradient-purple glow-purple text-lg px-8">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Explore Tournaments
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm py-12">
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

// Tournament Card Component
type TournamentCardType = {
  id: string
  name: string
  game?: {
    icon?: string | null
    name?: string
  }
  format?: string
  maxTeams?: number
  _count?: {
    registrations?: number
  }
  startDate: Date | string
}

function TournamentCard({
  tournament,
  isLive = false,
}: {
  tournament: TournamentCardType
  isLive?: boolean
}) {
  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <Card className={cn(
        'hover:shadow-lg transition-all duration-300 glow-purple-hover',
        isLive && 'border-red-500/50 bg-red-500/5'
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {tournament.game?.icon && <span className="text-lg">{tournament.game.icon}</span>}
                <Badge variant="outline" className="text-xs">
                  {tournament.game?.name}
                </Badge>
                {isLive && (
                  <Badge className="bg-red-500 text-white animate-pulse">
                    <Zap className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg leading-tight mb-1">{tournament.name}</h3>
              <p className="text-sm text-muted-foreground">
                {tournament.format?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {tournament._count?.registrations || 0}
                {tournament.maxTeams && `/${tournament.maxTeams}`} teams
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Helper function for time ago
function getTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}
