'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc/client'
import {
  Trophy,
  Zap,
  Target,
  Crown,
  Swords,
  Shield,
  ArrowRight,
  Gamepad2,
  Play,
  TrendingUp,
  Users,
  Calendar,
  Star,
  Award,
  CheckCircle,
} from 'lucide-react'
import Cs2SVG from '@/assets/cs2.svg'
import ValorantSVG from '@/assets/valorant.svg'
import LeagueSVG from '@/assets/league-of-legends.svg'
import FortniteSVG from '@/assets/fortnite.svg'
import Image from 'next/image';



export default function LandingPage() {
  const { data: session } = useSession()
  const { data: platformStats } = trpc.stats.getPlatformStats.useQuery()
  const { data: liveTournaments } = trpc.stats.getLiveTournaments.useQuery()
  const { data: upcomingTournaments } = trpc.stats.getUpcomingTournaments.useQuery()
  const { data: leaderboards } = trpc.stats.getLeaderboards.useQuery()

  const isOrganizer = session?.user?.role === 'ORGANIZER' || session?.user?.role === 'ADMIN'

  return (
    <div className='min-h-screen bg-black text-white overflow-hidden'>
      {/* Animated Background */}
      <div className='fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse' />
        <div className='absolute inset-0 bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+")] opacity-20' />
      </div>

      {/* Content */}
      <div className='relative z-10'>
        {/* Navigation */}
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

        {/* Hero Section */}
        <section className='relative min-h-[90vh] flex items-center'>
          <div className='absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-pink-500/5 mix-blend-overlay' />
          
          <div className='container mx-auto px-4 py-20'>
            <div className='max-w-6xl mx-auto text-center'>
              <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 backdrop-blur-sm mb-8'>
                <Zap className='h-4 w-4 text-cyan-400 animate-pulse' />
                <span className='text-cyan-400 text-sm font-bold tracking-wider'>NEXT-GEN TOURNAMENT PLATFORM</span>
              </div>

              <h1 className='text-6xl md:text-8xl font-black mb-6 leading-none'>
                <span className='block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-pulse'>
                  DOMINATE
                </span>
                <span className='block text-white'>THE ARENA</span>
              </h1>

              <p className='text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto font-light'>
                Join the ultimate esports tournament platform. Compete, organize, and prove you're the best.
              </p>

              <div className='flex flex-col sm:flex-row gap-4 justify-center mb-16'>
                {session && isOrganizer ? (
                  <Link href='/dashboard/tournaments/create'>
                    <Button size='lg' className='bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white font-black text-lg px-12 py-6 shadow-2xl shadow-purple-500/50 hover:shadow-cyan-500/50 transition-all'>
                      <Trophy className='mr-2 h-6 w-6' />
                      CREATE TOURNAMENT
                    </Button>
                  </Link>
                ) : (
                  <Link href='/tournaments?filter=open'>
                    <Button size='lg' className='bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white font-black text-lg px-12 py-6 shadow-2xl shadow-purple-500/50 hover:shadow-cyan-500/50 transition-all group'>
                      <Play className='mr-2 h-6 w-6 group-hover:animate-pulse' />
                      ENTER ARENA
                    </Button>
                  </Link>
                )}
                <Link href='/tournaments'>
                  <Button size='lg' variant='outline' className='border-2 border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 font-bold text-lg px-12 py-6'>
                    EXPLORE
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Button>
                </Link>
              </div>

              {/* Platform Stats - Only 3 */}
              <div className='grid grid-cols-3 gap-6 max-w-3xl mx-auto'>
                <StatCard
                  icon={<Trophy className='h-8 w-8' />}
                  value={platformStats?.totalTournaments || 0}
                  label='ACTIVE'
                  color='cyan'
                />
                <StatCard
                  icon={<Users className='h-8 w-8' />}
                  value={platformStats?.totalTeams || 0}
                  label='TEAMS'
                  color='purple'
                />
                <StatCard
                  icon={<Crown className='h-8 w-8' />}
                  value={platformStats?.tournamentsWithPrizes || 0}
                  label='PRIZES'
                  color='pink'
                />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Games Section */}
        <section className='py-20 relative'>
          <div className='absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent' />
          <div className='container mx-auto px-4 relative'>
            <div className='text-center mb-12'>
              <h2 className='text-5xl font-black mb-4'>
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400'>
                  SUPPORTED GAMES
                </span>
              </h2>
              <p className='text-gray-400 text-lg'>Compete in your favorite esports titles</p>
            </div>
            
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto'>
              <GameCard 
                name='VALORANT' 
                players='2.5K+'
                gradient='from-red-500 to-orange-500'
                Image={ValorantSVG}
              />
              <GameCard 
                name='LEAGUE' 
                players='3.2K+'
                gradient='from-blue-500 to-cyan-500'
                Image={LeagueSVG}
              />
              <GameCard 
                name='CS2' 
                players='1.8K+'
                gradient='from-yellow-500 to-orange-500'
                Image={Cs2SVG}
              />
              <GameCard 
                name='FORTNITE' 
                players='2.1K+'
                gradient='from-purple-500 to-pink-500'
                Image={FortniteSVG}
              />
            </div>
          </div>
        </section>

        {/* Tournament Features Section */}
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
                  Everything you need to run epic esports tournaments. From bracket generation 
                  to match scheduling, we've got you covered.
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
                <div className='relative aspect-square rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 backdrop-blur-xl flex items-center justify-center overflow-hidden'>
                  <div className='text-center p-8'>
                    <Trophy className='h-24 w-24 text-cyan-400 mx-auto mb-4 opacity-50' />
                    <Image
                      src='/images/dashboard.png'
                      alt='Dashboard preview'
                      width={1200}
                      height={800}
                      priority
                      className='rounded-xl shadow-xl'
                   />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Player Features Section */}
        <section className='py-20 relative'>
          <div className='container mx-auto px-4 relative'>
            <div className='grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto'>
              <div className='relative group order-2 md:order-1'>
                <div className='absolute -inset-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity' />
                <div className='relative aspect-square rounded-2xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-xl flex items-center justify-center overflow-hidden'>
                  <div className='text-center p-8'>
                    <Swords className='h-24 w-24 text-pink-400 mx-auto mb-4 opacity-50' />
                    <p className='text-gray-600 text-sm'>[ Player Stats Dashboard ]</p>
                    {/* TODO Replace with image/gif of the game */}
                  </div>
                </div>
              </div>

              <div className='order-1 md:order-2'>
                <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-pink-400/30 bg-pink-400/5 backdrop-blur-sm mb-6'>
                  <Star className='h-4 w-4 text-pink-400' />
                  <span className='text-pink-400 text-sm font-bold tracking-wider'>FOR PLAYERS</span>
                </div>
                <h2 className='text-5xl font-black mb-6 leading-tight'>
                  <span className='text-white'>PROVE YOUR</span>
                  <br />
                  <span className='text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400'>
                    DOMINANCE
                  </span>
                </h2>
                <p className='text-gray-400 text-lg mb-8 leading-relaxed'>
                  Join tournaments, track your stats, and climb the leaderboards. 
                  Build your reputation and become a legend.
                </p>
                <div className='space-y-4'>
                  <FeatureItem icon={<TrendingUp />} text='Track your win rate & stats' color='pink' />
                  <FeatureItem icon={<Trophy />} text='Earn achievements & badges' color='pink' />
                  <FeatureItem icon={<Users />} text='Find & join teams' color='pink' />
                  <FeatureItem icon={<Crown />} text='Compete for prizes' color='pink' />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live & Upcoming */}
        <section className='py-20 relative'>
          <div className='absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent' />
          <div className='container mx-auto px-4 relative'>
            <div className='grid md:grid-cols-2 gap-8'>
              <div className='relative group'>
                <div className='absolute -inset-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl blur-xl opacity-25 group-hover:opacity-50 transition-opacity' />
                <Card className='relative bg-black/80 border-2 border-red-500/30 backdrop-blur-xl'>
                  <CardContent className='p-8'>
                    <div className='flex items-center justify-between mb-6'>
                      <h2 className='text-3xl font-black flex items-center gap-3'>
                        <div className='relative'>
                          <Zap className='h-8 w-8 text-red-400 animate-pulse' />
                          <div className='absolute inset-0 blur-xl bg-red-400 opacity-50' />
                        </div>
                        <span className='text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400'>
                          LIVE NOW
                        </span>
                      </h2>
                      <Link href='/tournaments?filter=live'>
                        <Button variant='ghost' className='text-red-400 hover:text-red-300 hover:bg-red-400/10'>
                          VIEW ALL →
                        </Button>
                      </Link>
                    </div>
                    <div className='space-y-3'>
                      {liveTournaments?.slice(0, 3).map((tournament) => (
                        <TournamentCardNeon key={tournament.id} tournament={tournament} isLive />
                      )) || (
                        <p className='text-center py-8 text-gray-500'>No live tournaments</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className='relative group'>
                <div className='absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-xl opacity-25 group-hover:opacity-50 transition-opacity' />
                <Card className='relative bg-black/80 border-2 border-cyan-500/30 backdrop-blur-xl'>
                  <CardContent className='p-8'>
                    <div className='flex items-center justify-between mb-6'>
                      <h2 className='text-3xl font-black flex items-center gap-3'>
                        <div className='relative'>
                          <Target className='h-8 w-8 text-cyan-400' />
                          <div className='absolute inset-0 blur-xl bg-cyan-400 opacity-50' />
                        </div>
                        <span className='text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400'>
                          OPEN NOW
                        </span>
                      </h2>
                      <Link href='/tournaments?filter=open'>
                        <Button variant='ghost' className='text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10'>
                          VIEW ALL →
                        </Button>
                      </Link>
                    </div>
                    <div className='space-y-3'>
                      {upcomingTournaments?.slice(0, 3).map((tournament) => (
                        <TournamentCardNeon key={tournament.id} tournament={tournament} />
                      )) || (
                        <p className='text-center py-8 text-gray-500'>No open tournaments</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Leaderboards */}
        <section className='py-20'>
          <div className='container mx-auto px-4'>
            <div className='text-center mb-12'>
              <h2 className='text-5xl font-black mb-4'>
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400'>
                  HALL OF FAME
                </span>
              </h2>
              <p className='text-gray-400'>The best of the best</p>
            </div>

            <div className='grid md:grid-cols-3 gap-6 max-w-6xl mx-auto'>
              <LeaderboardCard
                title='TOP TEAMS'
                icon={<Shield className='h-5 w-5' />}
                items={leaderboards?.topTeams?.slice(0, 5) || []}
                color='cyan'
                renderItem={(team: any, idx: number) => (
                  <div className='flex items-center gap-3 p-3 rounded-lg hover:bg-cyan-400/5 transition-all group cursor-pointer'>
                    <div className='text-2xl font-black text-gray-600 w-8'>#{idx + 1}</div>
                    <div className='h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center'>
                      <Trophy className='h-5 w-5 text-white' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='font-bold truncate text-white group-hover:text-cyan-400 transition-colors'>
                        {team.name}
                      </p>
                      <p className='text-xs text-gray-500'>{team.wins}W - {team.losses}L</p>
                    </div>
                    <div className='text-cyan-400 font-black text-lg'>{team.winRate}%</div>
                  </div>
                )}
              />

              <LeaderboardCard
                title='TOP PLAYERS'
                icon={<Crown className='h-5 w-5' />}
                items={leaderboards?.topPlayers?.slice(0, 5) || []}
                color='purple'
                renderItem={(player: any, idx: number) => (
                  <div className='flex items-center gap-3 p-3 rounded-lg hover:bg-purple-400/5 transition-all group cursor-pointer'>
                    <div className='text-2xl font-black text-gray-600 w-8'>#{idx + 1}</div>
                    <div className='h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center'>
                      <Star className='h-5 w-5 text-white' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='font-bold truncate text-white group-hover:text-purple-400 transition-colors'>
                        {player.name}
                      </p>
                      <p className='text-xs text-gray-500'>Wins</p>
                    </div>
                    <div className='text-purple-400 font-black text-lg'>{player.winCount}</div>
                  </div>
                )}
              />

              <LeaderboardCard
                title='RECENT WINNERS'
                icon={<Award className='h-5 w-5' />}
                items={leaderboards?.recentChampions?.slice(0, 5) || []}
                color='pink'
                renderItem={(champion: any) => (
                  <Link href={`/tournaments/${champion.tournamentId}`}>
                    <div className='p-3 rounded-lg hover:bg-pink-400/5 transition-all group cursor-pointer'>
                      {champion.winnerTeam && (
                        <div className='flex items-center gap-2 mb-2'>
                          <Trophy className='h-6 w-6 text-yellow-400' />
                          <span className='font-bold text-white group-hover:text-pink-400 transition-colors'>
                            {champion.winnerTeam.name}
                          </span>
                        </div>
                      )}
                      <p className='text-sm text-gray-400 truncate'>{champion.tournamentName}</p>
                      <p className='text-xs text-gray-600 mt-1'>
                        {new Date(champion.completedAt || '').toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                )}
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
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

        {/* Final CTA */}
        <section className='py-32 relative'>
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20' />
          <div className='container mx-auto px-4 text-center relative'>
            <h2 className='text-6xl md:text-7xl font-black mb-6'>
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400'>
                READY TO COMPETE?
              </span>
            </h2>
            <p className='text-2xl text-gray-400 mb-12 max-w-2xl mx-auto'>
              Join thousands of players in the arena
            </p>
            <Link href='/register'>
              <Button size='lg' className='bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white font-black text-xl px-16 py-8 shadow-2xl shadow-purple-500/50 hover:shadow-cyan-500/50 transition-all'>
                START NOW
                <ArrowRight className='ml-2 h-6 w-6' />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className='border-t border-cyan-500/20 backdrop-blur-xl bg-black/50 py-8'>
          <div className='container mx-auto px-4'>
            <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
              <div className='flex items-center gap-2'>
                <Gamepad2 className='h-6 w-6 text-cyan-400' />
                <span className='text-lg font-black'>
                  <span className='text-cyan-400'>ESPORTS</span>
                  <span className='text-pink-400'>ARENA</span>
                </span>
              </div>
              <p className='text-gray-500 text-sm'>© 2026 ESPORTSARENA. ALL RIGHTS RESERVED.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

// Components
function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: 'cyan' | 'purple' | 'pink' }) {
  const colorClasses = {
    cyan: {
      gradient: 'from-cyan-500 to-blue-500',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
    },
    purple: {
      gradient: 'from-purple-500 to-pink-500',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
    },
    pink: {
      gradient: 'from-pink-500 to-red-500',
      text: 'text-pink-400',
      border: 'border-pink-500/30',
    },
  };

  const currentColor = colorClasses[color];

  return (
    <div className='relative group'>
      <div className={`absolute -inset-1 bg-gradient-to-r ${currentColor.gradient} rounded-xl blur opacity-25 group-hover:opacity-50 transition-opacity`} />
      <Card className={`relative bg-black/80 border ${currentColor.border} backdrop-blur-xl`}>
        <CardContent className='p-6 text-center'>
          <div className={`${currentColor.text} mb-2 flex justify-center`}>{icon}</div>
          <div className='text-4xl font-black text-white'>{value}</div>
          <div className='text-xs font-bold text-gray-500 tracking-widest'>{label}</div>
        </CardContent>
      </Card>
    </div>
  )
}

function GameCard({ name, players, gradient, Image }: any) {
  return (
    <div className='relative group cursor-pointer'>
      <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-2xl blur-xl opacity-25 group-hover:opacity-50 transition-opacity`} />
      <Card className='relative bg-black/80 border-2 border-gray-800 hover:border-gray-700 backdrop-blur-xl overflow-hidden aspect-square'>
        <CardContent className='p-0 h-full flex flex-col items-center justify-center relative'>
          {/* Placeholder for game image */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20`} />
          <div className='relative z-10 text-center p-6'>
            <div className='w-24 h-24 flex items-center justify-center mx-auto'>
            <Image className='h-28 w-28 mx-auto mb-4 text-red-white' fill='currentColor'/>
            </div>
            <h3 className='text-xl font-black text-white mb-2'>{name}</h3>
            <p className='text-sm text-gray-400'>{players} Players</p>
            {/* TODO Replace with image/gif of the game */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FeatureItem({ icon, text, color = 'cyan' }: { icon: React.ReactNode; text: string; color?: 'cyan' | 'pink' }) {
  const colorClasses = {
    cyan: 'text-cyan-400',
    pink: 'text-pink-400',
  };
  
  const textColor = colorClasses[color] || colorClasses.cyan;
  
  return (
    <div className='flex items-center gap-3'>
      <div className={`${textColor}`}>{icon}</div>
      <span className='text-gray-300'>{text}</span>
    </div>
  )
}

function TournamentCardNeon({ tournament, isLive = false }: any) {
  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <div className={`p-4 rounded-xl border-2 ${isLive ? 'border-red-500/30 bg-red-500/5' : 'border-gray-800 bg-gray-900/50'} hover:bg-gray-800/50 transition-all group cursor-pointer`}>
        <div className='flex items-start justify-between mb-2'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              {tournament.game?.icon && <span className='text-lg'>{tournament.game.icon}</span>}
              {isLive && (
                <Badge className='bg-red-500 text-white text-xs font-bold'>
                  <Zap className='h-3 w-3 mr-1 animate-pulse' />
                  LIVE
                </Badge>
              )}
            </div>
            <h3 className='font-bold text-white group-hover:text-cyan-400 transition-colors leading-tight'>
              {tournament.name}
            </h3>
          </div>
        </div>
        <div className='flex items-center justify-between text-xs text-gray-500'>
          <span className='flex items-center gap-1'>
            <Users className='h-3 w-3' />
            {tournament._count?.registrations || 0} teams
          </span>
          <span className='flex items-center gap-1'>
            <Calendar className='h-3 w-3' />
            {new Date(tournament.startDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  )
}

function LeaderboardCard({ title, icon, items, color, renderItem }: { 
  title: string; 
  icon: React.ReactNode; 
  items: any[]; 
  color: 'cyan' | 'purple' | 'pink'; 
  renderItem: (item: any, idx: number) => React.ReactNode;
}) {
  const colorClasses = {
    cyan: {
      border: 'border-cyan-500/30',
      gradient1: 'from-cyan-500',
      gradient2: 'to-blue-500',
      text: 'text-cyan-400',
    },
    purple: {
      border: 'border-purple-500/30',
      gradient1: 'from-purple-500',
      gradient2: 'to-pink-500',
      text: 'text-purple-400',
    },
    pink: {
      border: 'border-pink-500/30',
      gradient1: 'from-pink-500',
      gradient2: 'to-red-500',
      text: 'text-pink-400',
    },
  };

  const currentColor = colorClasses[color];

  return (
    <div className='relative group'>
      <div className={`absolute -inset-1 bg-gradient-to-r ${currentColor.gradient1} ${currentColor.gradient2} rounded-2xl blur-xl opacity-25 group-hover:opacity-50 transition-opacity`} />
      <Card className={`relative bg-black/80 border-2 ${currentColor.border} backdrop-blur-xl`}>
        <CardContent className='p-6'>
          <div className='flex items-center gap-2 mb-6'>
            <div className={`${currentColor.text}`}>{icon}</div>
            <h3 className='text-sm font-black tracking-widest text-gray-400'>{title}</h3>
          </div>
          <div className='space-y-2'>
            {items.length > 0 ? (
              items.map((item: any, idx: number) => (
                <div key={idx}>{renderItem(item, idx)}</div>
              ))
            ) : (
              <p className='text-center py-8 text-gray-600 text-sm'>No data yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StepCard({ number, icon, title, description, color }: { 
  number: string; 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  color: 'cyan' | 'purple' | 'pink';
}) {
  const colorClasses = {
    cyan: {
      gradient1: 'from-cyan-500',
      gradient2: 'to-blue-500',
      text: 'text-cyan-400',
    },
    purple: {
      gradient1: 'from-purple-500',
      gradient2: 'to-pink-500',
      text: 'text-purple-400',
    },
    pink: {
      gradient1: 'from-pink-500',
      gradient2: 'to-red-500',
      text: 'text-pink-400',
    },
  };

  const currentColor = colorClasses[color];

  return (
    <div className='relative group'>
      <div className={`absolute -inset-1 bg-gradient-to-r ${currentColor.gradient1} ${currentColor.gradient2} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity`} />
      <Card className='relative bg-black/80 border-2 border-gray-800 hover:border-gray-700 backdrop-blur-xl transition-all'>
        <CardContent className='p-8 text-center'>
          <div className='text-6xl font-black text-gray-800 mb-4'>{number}</div>
          <div className={`${currentColor.text} mb-4 flex justify-center`}>
            {icon}
          </div>
          <h3 className='text-xl font-black text-white mb-2'>{title}</h3>
          <p className='text-sm text-gray-500'>{description}</p>
        </CardContent>
      </Card>
    </div>
  )
}
