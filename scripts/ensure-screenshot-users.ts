/**
 * Ensures demo accounts used by screenshot scripts exist and can sign in.
 */
import 'dotenv/config'
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const users = [
  {
    email: 'admin@example.com',
    username: 'admin',
    name: 'Admin',
    role: UserRole.ADMIN,
  },
  {
    email: 'player1@example.com',
    username: 'player1',
    name: 'Player One',
    role: UserRole.PLAYER,
  },
] as const

async function main() {
  const prisma = new PrismaClient()
  const hash = await bcrypt.hash('password123', 10)

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role: user.role,
        password: hash,
        bannedAt: null,
        banReason: null,
        bannedById: null,
      },
      create: {
        email: user.email,
        username: user.username,
        name: user.name,
        password: hash,
        role: user.role,
      },
    })
    console.log(`Ready: ${user.email} / password123`)
  }

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
