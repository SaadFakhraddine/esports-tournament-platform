# Esports Tournament Platform

Full-stack tournament management app for competitive teams and organizers: registrations, brackets, matches, dashboards, and player stats. Built as a **portfolio / learning project** — Next.js 15, TypeScript, tRPC, Prisma, PostgreSQL, NextAuth.

<!-- Screenshots: see [docs/SCREENSHOTS.md](./docs/SCREENSHOTS.md) — drop PNGs in docs/images/ -->
<!-- ![App screenshot](./docs/images/01-landing.png) -->

**Live demo:** _add your Vercel URL here_  
**Author:** _your name / link_

**Portfolio screenshots:** checklist and README snippets → [`docs/SCREENSHOTS.md`](./docs/SCREENSHOTS.md) (save images under `docs/images/`).

## Highlights

- **Tournament management** — Multiple formats: Single/Double Elimination, Round Robin, Swiss
- **Teams & rosters** — Create teams, members, invitations, game-specific squads
- **Organizer dashboard** — Create/edit tournaments, registrations, bracket workflow
- **Player experience** — Browse/join tournaments, **per-team & per-game stats**, recent match history
- **Auth** — Email/password + OAuth (Google, Discord) via NextAuth.js v5
- **Type-safe API** — tRPC + Zod end-to-end
- **Optional real-time** — Pusher for live-style updates (if configured)

## Tech stack

| Layer        | Stack |
| ------------ | ----- |
| UI           | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui, Framer Motion |
| API & data   | tRPC, TanStack Query, Prisma, PostgreSQL |
| Auth         | NextAuth.js v5 |
| Validation   | Zod |

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm or pnpm

### Setup

1. **Clone** the repo and install dependencies:

```bash
npm install
```

2. **Environment** — copy `.env.example` to `.env` and set at least:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/esports_tournament"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

3. **Database** — apply schema and generate the client:

```bash
npx prisma db push
npx prisma generate
```

4. **Optional — demo data** (⚠️ **wipes** the database at `DATABASE_URL`):

```bash
npm run db:reset
```

Default seeded admin: `admin@example.com` / `password123`. Override with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_NAME`.

To seed without resetting:

```bash
npm run db:seed
```

5. **Run dev server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app/                 # Next.js App Router (routes, layouts)
├── components/          # UI (shadcn, tournament, team, layout, …)
├── server/
│   ├── api/routers/     # tRPC routers
│   ├── db/              # Prisma client
│   └── auth/            # NextAuth
├── lib/                 # Utils, validators, bracket logic
└── types/
```

## Schema (overview)

Core models: **User** (roles: Admin, Organizer, Player, Spectator), **Team** / **TeamMember**, **Tournament** / **TournamentRegistration**, **Bracket**, **Match**, **Game**, **Notification**.

## Scripts

| Command              | Description        |
| -------------------- | ------------------ |
| `npm run dev`        | Development server |
| `npm run build`      | Production build   |
| `npm run lint`       | ESLint             |
| `npx prisma studio`  | DB GUI             |
| `npx prisma migrate dev` | Migrations (when using migrate workflow) |

## Deployment (e.g. Vercel)

1. Push to GitHub and import the repo in Vercel (or similar).
2. Set **all** variables from `.env.example` in the host’s dashboard (never commit `.env`).
3. Point `DATABASE_URL` to a hosted Postgres (Neon, Supabase, Railway, Vercel Postgres, etc.).
4. Run migrations / `db push` as appropriate for your workflow.

## Security notes for public repos

- Do **not** commit `.env`, real `DATABASE_URL`, or OAuth secrets.
- Keep `.next/`, `node_modules/` gitignored.

## License

MIT
