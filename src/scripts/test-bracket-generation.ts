import { PrismaClient } from '@prisma/client'
import { generateBracket } from '../lib/bracket-generator'

async function main() {
  console.log('Testing bracket generation...')
  
  const db = new PrismaClient()
  
  try {
    // Find a tournament with at least 2 approved registrations
    const tournament = await db.tournament.findFirst({
      where: {
        registrations: {
          some: {
            status: 'APPROVED'
          }
        }
      },
      include: {
        registrations: {
          where: { status: 'APPROVED' },
          include: {
            team: {
              select: { id: true }
            }
          }
        }
      }
    })
    
    if (!tournament) {
      console.log('No tournament found with approved registrations')
      return
    }
    
    if (tournament.registrations.length < 2) {
      console.log('Tournament needs at least 2 approved teams')
      return
    }
    
    console.log(`Testing bracket generation for tournament: ${tournament.name}`)
    console.log(`Format: ${tournament.format}`)
    console.log(`Teams: ${tournament.registrations.length}`)
    
    // Generate bracket
    await generateBracket(db, tournament.id)
    
    console.log('Bracket generated successfully!')
    
    // Count created matches and brackets
    const matchCount = await db.match.count({
      where: { tournamentId: tournament.id }
    })
    
    const bracketCount = await db.bracket.count({
      where: { tournamentId: tournament.id }
    })
    
    console.log(`Created ${bracketCount} brackets and ${matchCount} matches`)
    
    // List the created matches with their details
    const matches = await db.match.findMany({
      where: { tournamentId: tournament.id },
      include: {
        bracket: {
          select: { type: true, round: true }
        },
        homeTeam: {
          select: { name: true }
        },
        awayTeam: {
          select: { name: true }
        }
      }
    })
    
    console.log('\nMatch details:')
    matches.forEach(match => {
      console.log(`- Match ${match.id}: ${match.homeTeam?.name || 'TBD'} vs ${match.awayTeam?.name || 'TBD'} (Bracket: ${match.bracket.type} Round ${match.bracket.round})`)
    })
    
  } catch (error) {
    console.error('Error generating bracket:', error)
  } finally {
    await db.$disconnect()
  }
}

main()
