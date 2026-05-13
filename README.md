# Esports Tournament Platform

Full-stack tournament management app for competitive teams and organizers: registrations, brackets, matches, dashboards, and player stats. Built as a **portfolio / learning project** — Next.js 15, TypeScript, tRPC, Prisma, PostgreSQL, NextAuth.

**Live demo:** [esports-tournament-platform-2z4z.vercel.app](https://esports-tournament-platform-2z4z.vercel.app/)  
**Repository:** [github.com/SaadFakhraddine/esports-tournament-platform](https://github.com/SaadFakhraddine/esports-tournament-platform)  
**Author:** [Saad Fakhraddine](https://github.com/SaadFakhraddine)

## Screenshots

From the [live demo](https://esports-tournament-platform-2z4z.vercel.app/). Regenerate or swap images: [`docs/SCREENSHOTS.md`](./docs/SCREENSHOTS.md).

| Landing | Browse tournaments |
| --- | --- |
| ![Landing](./docs/images/01-landing.png) | ![Tournaments](./docs/images/02-tournaments.png) |

| Teams | Sign in |
| --- | --- |
| ![Teams](./docs/images/03-teams.png) | ![Login](./docs/images/04-login.png) |

| Create account |
| --- |
| ![Register](./docs/images/05-register.png) |

## Highlights

- **Tournament management** — Multiple formats: Single/Double Elimination, Round Robin, Swiss
- **Teams & rosters** — Create teams, members, invitations, game-specific squads
- **Organizer dashboard** — Create/edit tournaments, registrations, bracket workflow
- **Player experience** — Browse/join tournaments, **per-team & per-game stats**, recent match history
- **Auth** — Email/password + OAuth (Google, Discord) via NextAuth.js v5
- **Type-safe API** — tRPC + Zod end-to-end
- **Testing** — **Vitest** for unit tests (e.g. security helpers); **Playwright** for end-to-end flows

## Tech stack

| Layer        | Stack |
| ------------ | ----- |
| UI           | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui, Framer Motion |
| API & data   | tRPC, TanStack Query, Prisma, PostgreSQL |
| Auth         | NextAuth.js v5 |
| Validation   | Zod |
| Testing      | Vitest (unit), Playwright (e2e) |

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

See `.env.example` for optional OAuth, Resend, `NEXT_PUBLIC_APP_URL`, seed overrides, Playwright, and future Pusher-related variables.

3. **Database** — apply schema and generate the client:

```bash
npx prisma db push
npx prisma generate
```

4. **Optional — demo data** (⚠️ **wipes** the database at `DATABASE_URL`):

```bash
npm run db:reset
```

Default seeded admin: `admin@example.com` / `password123`. Override with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_NAME` (see `.env.example`).

To seed without resetting:

```bash
npm run db:seed
```

5. **Run dev server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Tests

- **Unit:** `npm test` · **Watch:** `npm run test:watch` · **E2E:** `npm run test:e2e` (set `E2E_*` in `.env` when needed)

## Architecture

- **Routes:** `app/(public)` — landing, browse `/tournaments` & `/teams`. `app/(dashboard)` — signed-in organizer/player UI (layouts enforce session boundaries).
- **API:** `server/api/routers/*` — tRPC procedures; clients use **`/api/trpc`** + TanStack Query with Zod inputs.
- **Data & auth:** Prisma + PostgreSQL (`server/db`); NextAuth v5 (`server/auth`).
- **Logic:** Brackets, validators, security helpers in `lib/` (e.g. redirect allowlist covered by Vitest).

## Schema (overview)

Core models: **User** (roles: Admin, Organizer, Player, Spectator), **Team** / **TeamMember**, **Tournament** / **TournamentRegistration**, **Bracket**, **Match**, **Game**, **Notification**.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server (after `build`) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm test` | Vitest unit tests (CI-friendly) |
| `npm run test:watch` | Vitest watch mode |
| `npm run db:push` | `prisma db push` — sync schema to DB |
| `npm run db:seed` | Run seed script |
| `npm run db:reset` | Force-reset DB then seed (destructive) |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run test:e2e:ui` | Playwright with UI |
| `npm run test:e2e:report` | Open last Playwright HTML report |
| `npx prisma studio` | Prisma DB GUI |
| `npx prisma migrate dev` | Create/apply migrations (when using migrate workflow) |

## Deployment (e.g. Vercel)

1. Push to GitHub and import the repo in Vercel (or similar).
2. Set **all** variables from `.env.example` in the host’s dashboard (never commit `.env`). Use your production URL for `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL`.
3. Point `DATABASE_URL` to a hosted Postgres (Neon, Supabase, Railway, Vercel Postgres, etc.).
4. Run migrations / `db push` as appropriate for your workflow.

## Security notes for public repos

- Do **not** commit `.env`, real `DATABASE_URL`, or OAuth secrets.
- Keep `.next/`, `node_modules/` gitignored.

## License

MIT
