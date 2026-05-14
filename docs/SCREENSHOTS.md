# Screenshot checklist (portfolio README)

The README embeds captures from production (see `docs/images/`). The canonical demo host is `docs/demo-site.ts` (`LIVE_DEMO_URL`).

## Regenerate all portfolio shots

```bash
npm run screenshots:portfolio
```

Uses `player1@example.com` / `password123` by default for the dashboard capture. Override with `E2E_EMAIL` and `E2E_PASSWORD` if needed.

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
| `07-tournament-detail.png` | `/tournaments/[id]` | Bracket / registrations |

## Tips

- Seed the demo database first (`docs/DEMO.md`).
- **Crop** browser chrome or use a clean window; hide bookmarks bar.
- Prefer **one theme** consistently across shots.
- Full-page screenshots grow file size quickly; use viewport-only for hero pages if the PNG is too large for git.
