# Esports Tournament Platform

A full-stack esports tournament management platform built with Next.js 15, TypeScript, tRPC, Prisma, and PostgreSQL.

## Features

- **Tournament Management**: Create and manage tournaments with multiple formats (Single Elimination, Double Elimination, Round Robin, Swiss)
- **Team Management**: Create teams, manage rosters, and handle team registrations
- **Authentication**: Email/password and OAuth (Google, Discord) authentication with NextAuth.js
- **Bracket System**: Automated bracket generation with match progression
- **Real-time Updates**: Live match updates and notifications (optional with Pusher)
- **Role-based Access**: Admin, Organizer, Player, and Spectator roles

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS, shadcn/ui
- **Backend**: tRPC, Prisma ORM, PostgreSQL
- **Authentication**: NextAuth.js v5
- **Validation**: Zod
- **State Management**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Real-time** (optional): Pusher

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Set up your environment variables:

Copy \`.env.example\` to \`.env\` and fill in your values:

\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/esports_tournament"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

4. Initialize the database:

\`\`\`bash
npx prisma migrate dev --name init
npx prisma generate
\`\`\`

5. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes (tRPC, NextAuth)
│   ├── layout.tsx
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── tournament/       # Tournament components
│   ├── team/             # Team components
│   └── shared/           # Shared components
├── server/               # Backend logic
│   ├── api/routers/      # tRPC routers
│   ├── db/               # Prisma client
│   └── auth/             # NextAuth config
├── lib/                  # Utilities
│   ├── validators/       # Zod schemas
│   ├── bracket/          # Bracket generation algorithms
│   └── utils.ts          # Utility functions
└── types/                # TypeScript type definitions
\`\`\`

## Database Schema

The platform uses a comprehensive schema with the following main models:

- **User**: User accounts with role-based access
- **Team**: Team information and ownership
- **TeamMember**: Team roster management
- **Tournament**: Tournament details and configuration
- **TournamentRegistration**: Team registrations with approval workflow
- **Bracket**: Tournament bracket organization
- **Match**: Individual match data with progression logic
- **Notification**: User notifications

## Development

### Running Migrations

\`\`\`bash
npx prisma migrate dev
\`\`\`

### Prisma Studio

View and edit your database:

\`\`\`bash
npx prisma studio
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Set up environment variables in the Vercel dashboard
4. Deploy

### Database

Recommended PostgreSQL hosting options:
- Vercel Postgres
- Supabase
- Railway
- Neon

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
