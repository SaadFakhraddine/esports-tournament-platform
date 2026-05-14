# Screenshot checklist (portfolio README)

The README currently embeds **five** captures from production (see `docs/images/`). The canonical demo host is `docs/demo-site.ts` (`LIVE_DEMO_URL`).

Regenerate anytime after deploy with Playwright (from repo root):

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

## Swaps when you have seeded or prod data

Replace any file above, or add new names and update `README.md`, if you want to highlight:

| Page / view | Why |
| --- | --- |
| `/tournaments/[id]` | Bracket / registration detail |
| `/dashboard/tournaments` | Organizer hub (requires login) |
| `/dashboard/stats` | Per-team & per-game stats |

## Tips

- Use **seeded data** locally (`npm run db:reset`) before capturing dashboard shots.
- **Crop** browser chrome or use a clean window; hide bookmarks bar.
- Prefer **one theme** consistently across shots.
- Full-page screenshots grow file size quickly; use viewport-only for hero pages if the PNG is too large for git.
