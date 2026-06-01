# Screenshot checklist (portfolio README)

The README embeds captures from production (see `docs/images/`). The canonical demo host is `docs/demo-site.ts` (`LIVE_DEMO_URL`).

## Regenerate all portfolio shots

```bash
npm run screenshots:portfolio
```

Uses `player1@example.com` / `password123` for the player dashboard and `admin@example.com` / `password123` for organizer shots (Bracket Designer, My Tournaments). Override with `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_ORGANIZER_EMAIL`, and `E2E_ORGANIZER_PASSWORD` if needed.

Optional: `SCREENSHOT_BASE_URL=http://localhost:3000` to capture a local dev server instead of production.

Sign-in uses the **Auth.js API** (not the login form), so React hydration timing no longer breaks captures.

Browse pages (`/tournaments`, `/teams`) wait for loaded cards (count text / “View Team” buttons), not skeleton placeholders.

### If local capture fails

1. **Port stuck / timeouts** — Something on `:3000` may be hung while Next runs on `:3002`. Stop all `node` dev servers, free the port, then `npm run dev` and set `SCREENSHOT_BASE_URL` to the URL Next prints.
2. **Configuration error** — The dev server’s `DATABASE_URL` is wrong or unreachable. Fix `.env`, restart `npm run dev`.
3. **Invalid credentials / suspended** — Run `npx tsx scripts/ensure-screenshot-users.ts` (also runs automatically via `npm run screenshots:*`).
4. **Fastest path** — Omit `SCREENSHOT_BASE_URL` to capture the live demo on Vercel (default).

## Public pages only (manual)

```bash
npx playwright screenshot "https://esports-tournament-platform-giq9.vercel.app/" docs/images/01-landing.png --viewport-size=1400,900 --wait-for-timeout=4000
npx playwright screenshot "https://esports-tournament-platform-giq9.vercel.app/tournaments" docs/images/02-tournaments.png --full-page --viewport-size=1400,900 --wait-for-timeout=4000
npx playwright screenshot "https://esports-tournament-platform-giq9.vercel.app/teams" docs/images/03-teams.png --full-page --viewport-size=1400,900 --wait-for-timeout=4000
npx playwright screenshot "https://esports-tournament-platform-giq9.vercel.app/login" docs/images/04-login.png --viewport-size=1400,900 --wait-for-timeout=3000
npx playwright screenshot "https://esports-tournament-platform-giq9.vercel.app/register" docs/images/05-register.png --viewport-size=1400,900 --wait-for-timeout=3000
```

| File | Route | Notes |
| --- | --- | --- |
| `01-landing.png` | `/` | Hero / first impression |
| `02-tournaments.png` | `/tournaments` | Public browse |
| `03-teams.png` | `/teams` | Team discovery |
| `04-login.png` | `/login` | Auth UI |
| `05-register.png` | `/register` | Sign-up |
| `06-dashboard.png` | `/dashboard` | Signed-in home |
| `13-player-stats.png` | `/dashboard/stats` | Player stats with charts (also copied to `public/images/dashboard-stats.png` for landing) |
| `07-tournament-detail.png` | `/tournaments/[id]` | Bracket tab (public) |
| `08-my-tournaments.png` | `/dashboard/tournaments` | Organizer list (admin) |
| `09-bracket-designer.png` | `/dashboard/tournaments/planner` | Format recommendations + AI insight |
| `10-admin-overview.png` | `/dashboard/admin` | Platform KPIs and moderation queue |
| `11-admin-users.png` | `/dashboard/admin/users` | User search, roles, account suspension |
| `12-admin-audit.png` | `/dashboard/admin/audit` | Admin action audit trail |

## Admin shots (10–12)

Sign in as **`admin@example.com`** / `password123`. Stage data before capture so tables are not empty:

1. **Users** — change `player2@example.com` to Organizer (creates audit row).
2. **Users** — suspend `player3@example.com` with reason `Demo: policy violation`.
3. **Games** — add or edit a game (creates audit row).
4. Open **Audit** and confirm several rows appear (newest first).
5. Open **Overview** and confirm the suspended-user panel is populated.

Manual capture (local dev, after `npm run dev` and staging above):

```bash
npx playwright screenshot "http://localhost:3000/dashboard/admin" docs/images/10-admin-overview.png --viewport-size=1400,900 --wait-for-timeout=4000
npx playwright screenshot "http://localhost:3000/dashboard/admin/users" docs/images/11-admin-users.png --full-page --viewport-size=1400,900 --wait-for-timeout=4000
npx playwright screenshot "http://localhost:3000/dashboard/admin/audit" docs/images/12-admin-audit.png --full-page --viewport-size=1400,900 --wait-for-timeout=4000
```

Requires an authenticated admin session in the browser profile Playwright uses, or extend `scripts/capture-organizer-screenshots.ts` to visit admin routes after sign-in.

## Organizer shots (08–09)

Production must include **`admin@example.com`** / `password123` (run `npm run db:reset` against the **demo** `DATABASE_URL` — see `docs/DEMO.md`). If admin login fails on the live URL, capture locally:

```bash
npm run dev
# in another terminal, after local DB is seeded:
npm run screenshots:organizer
```

Or point at production once admin exists:

```bash
set SCREENSHOT_BASE_URL=https://esports-tournament-platform-giq9.vercel.app
npm run screenshots:organizer
```

## Tips

- Seed the demo database first (`docs/DEMO.md`).
- **Crop** browser chrome or use a clean window; hide bookmarks bar.
- Prefer **one theme** consistently across shots.
- Full-page screenshots grow file size quickly; use viewport-only for hero pages if the PNG is too large for git.
