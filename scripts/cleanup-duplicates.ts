import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Checking for duplicate tournaments...\n');

  // Get all tournaments grouped by name
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: 'asc' }
  });

  const tournamentsByName = new Map<string, typeof tournaments>();

  for (const tournament of tournaments) {
    if (!tournamentsByName.has(tournament.name)) {
      tournamentsByName.set(tournament.name, []);
    }
    tournamentsByName.get(tournament.name)!.push(tournament);
  }

  // Find duplicates
  let duplicateCount = 0;
  for (const [name, tourneys] of tournamentsByName) {
    if (tourneys.length > 1) {
      console.log(`Found ${tourneys.length} tournaments named "${name}":`);
      tourneys.forEach((t, i) => {
        console.log(`  ${i + 1}. ID: ${t.id}, Created: ${t.createdAt}`);
      });

      // Keep the first one, delete the rest
      const toDelete = tourneys.slice(1);
      console.log(`  Deleting ${toDelete.length} duplicate(s)...`);

      for (const t of toDelete) {
        await prisma.tournament.delete({ where: { id: t.id } });
        duplicateCount++;
      }
      console.log();
    }
  }

  if (duplicateCount === 0) {
    console.log('✅ No duplicates found!');
  } else {
    console.log(`✅ Deleted ${duplicateCount} duplicate tournament(s)`);
  }

  // Check for duplicate teams
  console.log('\n🧹 Checking for duplicate teams...\n');

  const teams = await prisma.team.findMany({
    orderBy: { createdAt: 'asc' }
  });

  const teamsByName = new Map<string, typeof teams>();

  for (const team of teams) {
    if (!teamsByName.has(team.name)) {
      teamsByName.set(team.name, []);
    }
    teamsByName.get(team.name)!.push(team);
  }

  let teamDuplicateCount = 0;
  for (const [name, teamList] of teamsByName) {
    if (teamList.length > 1) {
      console.log(`Found ${teamList.length} teams named "${name}":`);
      teamList.forEach((t, i) => {
        console.log(`  ${i + 1}. ID: ${t.id}, Created: ${t.createdAt}`);
      });

      const toDelete = teamList.slice(1);
      console.log(`  Deleting ${toDelete.length} duplicate(s)...`);

      for (const t of toDelete) {
        await prisma.team.delete({ where: { id: t.id } });
        teamDuplicateCount++;
      }
      console.log();
    }
  }

  if (teamDuplicateCount === 0) {
    console.log('✅ No duplicate teams found!');
  } else {
    console.log(`✅ Deleted ${teamDuplicateCount} duplicate team(s)`);
  }

  console.log('\n🎉 Cleanup complete!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
