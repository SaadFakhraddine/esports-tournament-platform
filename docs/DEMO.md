# Production demo data

The public portfolio demo at [`LIVE_DEMO_URL`](./demo-site.ts) should use the same PostgreSQL database as your Vercel deployment. Run the seed against that database so landing stats, tournaments, teams, and login accounts look real.

## Accounts (default seed)

| Role | Email | Password |
| --- | --- | --- |
| Admin / organizer | `admin@example.com` | `password123` (after `npm run db:reset` on the demo database) |
| Sample players | `player1@example.com` … `player10@example.com` | `password123` |

Override admin credentials with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_USERNAME`, and `SEED_ADMIN_NAME` (see `.env.example`).

## What gets created

- **10 games** (Valorant, League of Legends, CS2, and others)
- **8 teams** with rosters across multiple titles
- **3 tournaments** — live single-elimination Valorant event, open LoL registration, and a Valorant circuit in seeding
- **Bracket + sample matches** for the in-progress tournament (one completed match, others scheduled)
- **Notifications** for the admin user

## Seed production (one-time or refresh)

1. In Vercel, copy **`DATABASE_URL`** (Supabase **transaction pooler**, with `pgbouncer=true`) and **`DIRECT_URL`** (direct `:5432` host) into a local `.env` used only for this step.
2. Apply schema if needed: `npx prisma db push`
3. **Fresh demo (wipes data):** `npm run db:reset`
4. **Seed without reset:** `npm run db:seed` (safe to re-run for users/games/teams; tournaments are created again on each run — prefer `db:reset` for a clean story)

5. Redeploy or open the live site and confirm `/` shows non-zero stats and `/tournaments` lists events.

## Admin console

Sign in as `admin@example.com` and open **Admin** in the sidebar (`/dashboard/admin`):

- **Overview** — user, game, tournament, and suspension counts
- **Games** — add, hide, or remove unused games (used by tournament/team forms)
- **Users** — change roles or suspend accounts (blocked at sign-in and on API calls)

After schema changes, run `npx prisma db push` on your database before using suspend features.

## Verify quickly

- Open `/` — platform stats and live/upcoming sections should not be empty.
- Sign in as `player1@example.com` / `password123` — `/dashboard` loads with activity and stats.
- Open **Valorant Champions Series 2026** from `/tournaments` — bracket and match rows visible.
