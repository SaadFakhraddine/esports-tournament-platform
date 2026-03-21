/**
 * Demo / local seed. After a fresh DB reset, run: `npm run db:seed` (or `npm run db:reset`).
 *
 * Optional env:
 *   SEED_ADMIN_EMAIL     (default: admin@example.com)
 *   SEED_ADMIN_PASSWORD  (default: password123)
 *   SEED_ADMIN_USERNAME  (default: admin)
 *   SEED_ADMIN_NAME      (default: Admin)
 */
import {
  PrismaClient,
  UserRole,
  TournamentFormat,
  TournamentStatus,
  MatchStatus,
  RegistrationStatus,
  TeamRole,
  NotificationType,
} from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...\n')

  // Create games
  console.log('Creating games...');
  const games = [];
  const gameData = [
    { name: 'Valorant', slug: 'valorant', description: 'A tactical first-person shooter by Riot Games', icon: '🎯' },
    { name: 'League of Legends', slug: 'league-of-legends', description: 'A multiplayer online battle arena game by Riot Games', icon: '⚔️' },
    { name: 'Counter-Strike 2', slug: 'counter-strike-2', description: 'A tactical first-person shooter by Valve', icon: '🔫' },
    { name: 'Dota 2', slug: 'dota-2', description: 'A multiplayer online battle arena game by Valve', icon: '🛡️' },
    { name: 'Rocket League', slug: 'rocket-league', description: 'A vehicular soccer video game by Psyonix', icon: '🚗' },
    { name: 'Rainbow Six Siege', slug: 'rainbow-six-siege', description: 'A tactical shooter by Ubisoft', icon: '🎮' },
    { name: 'Overwatch 2', slug: 'overwatch-2', description: 'A team-based first-person shooter by Blizzard', icon: '🦸' },
    { name: 'Apex Legends', slug: 'apex-legends', description: 'A battle royale game by Respawn Entertainment', icon: '👑' },
    { name: 'Fortnite', slug: 'fortnite', description: 'A battle royale game by Epic Games', icon: '🏆' },
    { name: 'Call of Duty: Warzone', slug: 'call-of-duty-warzone', description: 'A battle royale game by Activision', icon: '💣' }
  ];

  for (const gameInfo of gameData) {
    const game = await prisma.game.upsert({
      where: { slug: gameInfo.slug },
      update: {},
      create: {
        name: gameInfo.name,
        slug: gameInfo.slug,
        description: gameInfo.description,
        icon: gameInfo.icon
      }
    });
    games.push(game);
  }
  console.log(`✅ Created ${games.length} games`);

  // Admin (required for seeded tournaments / organizer)
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'password123'
  console.log('Creating admin user...')
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10)
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: UserRole.ADMIN,
    },
    create: {
      email: adminEmail,
      username: process.env.SEED_ADMIN_USERNAME ?? 'admin',
      name: process.env.SEED_ADMIN_NAME ?? 'Admin',
      password: adminPasswordHash,
      role: UserRole.ADMIN,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  })
  console.log('✅ Admin:', admin.email, `(${admin.role})`)
  console.log()

  // Create players
  console.log('Creating players...');
  const players = [];
  const hashedPassword = await bcrypt.hash('password123', 10);

  for (let i = 1; i <= 10; i++) {
    const player = await prisma.user.upsert({
      where: { email: `player${i}@example.com` },
      update: {},
      create: {
        email: `player${i}@example.com`,
        username: `player${i}`,
        name: `Player ${i}`,
        password: hashedPassword,
        role: UserRole.PLAYER,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=player${i}`
      }
    });
    players.push(player);
  }
  console.log(`✅ Created ${players.length} players`);

  // Create teams
  console.log('Creating teams...');
  const teams = [];
  const teamData = [
    { name: 'Team Phoenix', tag: 'PHX', game: 'Valorant', description: 'Rising from the ashes' },
    { name: 'Dragons Gaming', tag: 'DRG', game: 'Valorant', description: 'Fierce competitors' },
    { name: 'Nova Esports', tag: 'NOVA', game: 'Valorant', description: 'Stellar performance' },
    { name: 'Titan Force', tag: 'TTN', game: 'Valorant', description: 'Unstoppable power' },
    { name: 'Legends United', tag: 'LEG', game: 'League of Legends', description: 'Legendary plays' },
    { name: 'Storm Riders', tag: 'STM', game: 'League of Legends', description: 'Riding the storm' },
    { name: 'Apex Predators', tag: 'APX', game: 'League of Legends', description: 'Top of the food chain' },
    { name: 'Cyber Wolves', tag: 'CYW', game: 'Counter-Strike 2', description: 'Pack hunters' }
  ];

  for (let i = 0; i < teamData.length; i++) {
    const teamInfo = teamData[i];
    const owner = players[i % players.length];

    // Find game by name
    const game = games.find(g => g.name === teamInfo.game || g.slug === teamInfo.game.toLowerCase().replace(/\s+/g, '-'));
    if (!game) {
      console.log(`⚠️  Game not found for team ${teamInfo.name}: ${teamInfo.game}`);
      continue;
    }

    const team = await prisma.team.upsert({
      where: { name: teamInfo.name },
      update: {},
      create: {
        name: teamInfo.name,
        tag: teamInfo.tag,
        gameId: game.id,
        description: teamInfo.description,
        logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${teamInfo.tag}`,
        ownerId: owner.id
      }
    });
    teams.push(team);

    // Add team members
    for (let j = 0; j < 5; j++) {
      const player = players[(i * 5 + j) % players.length];
      try {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: player.id,
            role: j === 0 ? TeamRole.CAPTAIN : j === 4 ? TeamRole.SUBSTITUTE : TeamRole.PLAYER
          }
        });
      } catch (e) {
        // Skip if exists
      }
    }
  }
  console.log(`✅ Created ${teams.length} teams`);

  // Create tournaments
  console.log('Creating tournaments...');
  const tournaments = [];
  const tournamentData = [
    {
      name: 'Valorant Champions Series 2026',
      game: 'Valorant',
      format: TournamentFormat.SINGLE_ELIMINATION,
      status: TournamentStatus.IN_PROGRESS,
      maxTeams: 8,
      prizePool: '$10,000'
    },
    {
      name: 'Spring Split League of Legends',
      game: 'League of Legends',
      format: TournamentFormat.ROUND_ROBIN,
      status: TournamentStatus.REGISTRATION,
      maxTeams: 6,
      prizePool: '$5,000'
    },
    {
      name: 'Valorant Pro Circuit',
      game: 'Valorant',
      format: TournamentFormat.DOUBLE_ELIMINATION,
      status: TournamentStatus.SEEDING,
      maxTeams: 16,
      prizePool: '$15,000'
    }
  ];

  for (const data of tournamentData) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);

    // Find game by name
    const game = games.find(g => g.name === data.game);
    if (!game) {
      console.log(`⚠️  Game not found for tournament ${data.name}: ${data.game}`);
      continue;
    }

    const tournament = await prisma.tournament.create({
      data: {
        name: data.name,
        gameId: game.id,
        format: data.format,
        status: data.status,
        maxTeams: data.maxTeams,
        prizePool: data.prizePool,
        description: `${data.name} tournament`,
        startDate: startDate,
        registrationStart: new Date(),
        registrationEnd: new Date(startDate.getTime() - 86400000),
        organizerId: admin.id,
        banner: `https://api.dicebear.com/7.x/shapes/svg?seed=${data.name}`
      }
    });
    tournaments.push(tournament);

    // Register teams - filter by gameId now
    const eligibleTeams = teams.filter(t => t.gameId === game.id);
    for (let i = 0; i < Math.min(eligibleTeams.length, data.maxTeams); i++) {
      await prisma.tournamentRegistration.create({
        data: {
          tournamentId: tournament.id,
          teamId: eligibleTeams[i].id,
          status: data.status === TournamentStatus.REGISTRATION ? RegistrationStatus.PENDING : RegistrationStatus.APPROVED,
          seed: data.status !== TournamentStatus.REGISTRATION ? i + 1 : null
        }
      });
    }
  }
  console.log(`✅ Created ${tournaments.length} tournaments`);

  // Create matches for in-progress tournament
  const inProgressTournament = tournaments.find(t => t.status === TournamentStatus.IN_PROGRESS);
  if (inProgressTournament) {
    const regs = await prisma.tournamentRegistration.findMany({
      where: { tournamentId: inProgressTournament.id, status: RegistrationStatus.APPROVED },
      include: { team: true }
    });

    const bracket = await prisma.bracket.create({
      data: {
        tournamentId: inProgressTournament.id,
        round: 1
      }
    });

    for (let i = 0; i < Math.floor(regs.length / 2); i++) {
      const scheduledDate = new Date(inProgressTournament.startDate);
      scheduledDate.setHours(14 + i * 2);

      await prisma.match.create({
        data: {
          tournamentId: inProgressTournament.id,
          bracketId: bracket.id,
          homeTeamId: regs[i * 2].team.id,
          awayTeamId: regs[i * 2 + 1].team.id,
          status: i === 0 ? MatchStatus.COMPLETED : MatchStatus.SCHEDULED,
          scheduledAt: scheduledDate,
          homeScore: i === 0 ? 2 : null,
          awayScore: i === 0 ? 1 : null,
          winnerTeamId: i === 0 ? regs[i * 2].team.id : null,
          completedAt: i === 0 ? new Date() : null,
          bestOf: 3
        }
      });
    }
    console.log('✅ Created matches');
  }

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: NotificationType.TOURNAMENT_STARTING,
      title: 'Tournament Starting Soon',
      message: 'Valorant Champions Series 2026 starts in 7 days!',
      link: '/tournaments'
    }
  });

  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
