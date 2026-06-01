/**
 * Ensures admin@example.com / password123 exists for Playwright captures.
 * Does not change other admin accounts.
 */
import 'dotenv/config'
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  const prisma = new PrismaClient()
  const hash = await bcrypt.hash('password123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      role: UserRole.ADMIN,
      password: hash,
      bannedAt: null,
      banReason: null,
      bannedById: null,
    },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      name: 'Admin',
      password: hash,
      role: UserRole.ADMIN,
    },
  })
  console.log('Ready: admin@example.com / password123')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
