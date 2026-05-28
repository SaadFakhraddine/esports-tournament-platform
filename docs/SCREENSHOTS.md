# Screenshot checklist (portfolio README)

The README embeds captures from production (see `docs/images/`). The canonical demo host is `docs/demo-site.ts` (`LIVE_DEMO_URL`).

## Regenerate all portfolio shots

```bash
npm run screenshots:portfolio
```

Uses `player1@example.com` / `password123` for the player dashboard and `admin@example.com` / `password123` for organizer shots (Bracket Designer, My Tournaments). Override with `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_ORGANIZER_EMAIL`, and `E2E_ORGANIZER_PASSWORD` if needed.

Optional: `SCREENSHOT_BASE_URL=http://localhost:3000` to capture a local dev server instead of production.

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
| `07-tournament-detail.png` | `/tournaments/[id]` | Bracket tab (public) |
| `08-my-tournaments.png` | `/dashboard/tournaments` | Organizer list (admin) |
| `09-bracket-designer.png` | `/dashboard/tournaments/planner` | Format recommendations + AI insight |

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
