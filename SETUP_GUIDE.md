# Quick Start Guide - Esports Tournament Platform

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher (or use a cloud service)
- npm or pnpm package manager

## Step-by-Step Setup

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Setup PostgreSQL Database

#### Option A: Local PostgreSQL

1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Create a new database:

\`\`\`bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE esports_tournament;

# Exit psql
\q
\`\`\`

3. Your connection string will be:
\`\`\`
postgresql://postgres:your_password@localhost:5432/esports_tournament
\`\`\`

#### Option B: Cloud PostgreSQL (Recommended for Quick Start)

**Supabase (Free Tier):**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the "Connection string" (URI mode)

**Neon (Free Tier):**
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

**Railway (Free Trial):**
1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the connection string from variables

### 3. Configure Environment Variables

1. Copy the example file:
\`\`\`bash
cp .env.example .env
\`\`\`

2. Edit `.env` and update:
\`\`\`env
DATABASE_URL="your-postgresql-connection-string-here"
NEXTAUTH_SECRET="generate-a-random-string-here"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

To generate a secure secret:
\`\`\`bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or using OpenSSL
openssl rand -base64 32
\`\`\`

### 4. Initialize Database

Run the Prisma migration to create all tables:

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

This will:
- Create all database tables
- Generate the Prisma Client
- Apply the complete schema

### 5. (Optional) Seed Demo Data

Create a seed file to populate the database with sample data:

\`\`\`bash
# We'll create this together if needed
npx prisma db seed
\`\`\`

### 6. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

### View Database with Prisma Studio

Prisma Studio provides a visual interface for your database:

\`\`\`bash
npx prisma studio
\`\`\`

Opens at: [http://localhost:5555](http://localhost:5555)

### Reset Database (Careful!)

To clear all data and reapply migrations:

\`\`\`bash
npx prisma migrate reset
\`\`\`

### Generate Prisma Client After Schema Changes

If you modify `prisma/schema.prisma`:

\`\`\`bash
npx prisma generate
\`\`\`

## OAuth Setup (Optional)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`:
\`\`\`env
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
\`\`\`

### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 section
4. Add redirect: `http://localhost:3000/api/auth/callback/discord`
5. Copy Client ID and Secret to `.env`:
\`\`\`env
DISCORD_CLIENT_ID="your-client-id"
DISCORD_CLIENT_SECRET="your-client-secret"
\`\`\`

## Troubleshooting

### Database Connection Issues

**Error: "Can't reach database server"**
- Check if PostgreSQL is running
- Verify connection string format
- Check firewall settings
- Ensure database exists

**Error: "Authentication failed"**
- Verify username and password in connection string
- Check user permissions

### Prisma Issues

**Error: "Schema does not match the database"**
\`\`\`bash
npx prisma migrate reset
npx prisma migrate dev
\`\`\`

**Error: "Client not generated"**
\`\`\`bash
npx prisma generate
\`\`\`

### Next.js Issues

**Error: "Port 3000 is already in use"**
\`\`\`bash
# Use a different port
PORT=3001 npm run dev
\`\`\`

**Error: "Module not found"**
\`\`\`bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
\`\`\`

## Testing Your Setup

### 1. Create a User Account

1. Go to [http://localhost:3000/register](http://localhost:3000/register)
2. Fill in the form and create an account
3. Login at [http://localhost:3000/login](http://localhost:3000/login)

### 2. View Database

Open Prisma Studio to see your new user:
\`\`\`bash
npx prisma studio
\`\`\`

### 3. Test tRPC API

The tRPC API is accessible at:
- Endpoint: `http://localhost:3000/api/trpc`
- Test in browser dev tools or using the UI

## Project Structure

\`\`\`
esports-tournament-platform/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js pages
│   │   ├── (auth)/           # Login, register
│   │   ├── (dashboard)/      # Protected routes
│   │   └── api/              # API routes
│   ├── components/           # React components
│   ├── server/               # Backend logic
│   │   ├── api/routers/     # tRPC routers
│   │   ├── auth/            # NextAuth config
│   │   └── db/              # Prisma client
│   └── lib/                 # Utilities
├── .env                      # Environment variables (create this)
├── .env.example             # Template
└── package.json
\`\`\`

## Next Steps After Setup

1. **Create Your First Tournament**
   - Login to your account
   - Navigate to tournaments
   - Click "Create Tournament"

2. **Create a Team**
   - Go to teams section
   - Create a new team
   - Add team members

3. **Register for Tournament**
   - Browse tournaments
   - Register your team
   - Wait for approval

4. **Explore the Code**
   - Check out `src/server/api/routers/` for backend logic
   - Look at `src/app/` for frontend pages
   - Review `prisma/schema.prisma` for database structure

## Need Help?

- Check `IMPLEMENTATION_STATUS.md` for current progress
- Review `README.md` for project overview
- Open an issue on GitHub
- Review the plan in `esports-tournament-platform-brief.md`

## Development Tips

- Use Prisma Studio to inspect and modify data
- Check browser console for tRPC errors
- Use React DevTools to inspect component state
- Monitor terminal for backend errors
- Use TypeScript errors as guidance

---

**You're all set!** The foundation is solid and ready for building out the UI components.
