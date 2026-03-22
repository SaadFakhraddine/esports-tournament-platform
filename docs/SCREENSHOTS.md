# Screenshot checklist (portfolio README)

Use **3–5** images max so the README stays scannable. PNG or WebP, ~1200–1600px wide is enough.

Save files in `docs/images/` (create the folder) and link from `README.md`, for example:

```md
![Landing](./docs/images/01-landing.png)
```

## Recommended captures

| # | Page / view | Why |
|---|-------------|-----|
| 1 | **Landing** (`/`) | First impression, branding, hero |
| 2 | **Public tournaments** (`/tournaments`) | Core discovery / browse experience |
| 3 | **Tournament detail** (`/tournaments/[id]`) | Registration, format, dates, bracket teaser |
| 4 | **Organizer: My tournaments** (`/dashboard/tournaments`) | Log in as seeded admin/organizer — shows “I built dashboards” |
| 5 | **Player stats** (`/dashboard/stats`) | Per-team + per-game stats — differentiator |

## Optional extras (swap one in if it shows your work better)

- **Bracket / manage tournament** — organizer match or bracket view
- **Team page** (`/teams/[id]`) — roster + game
- **Create tournament** flow — form + validation story in interviews

## Tips

- Use **seeded data** (`npm run db:reset`) so names and scores look real.
- **Crop** browser chrome or use a clean window; hide bookmarks bar.
- Prefer **light mode** or **one theme** consistently across shots.
- If you deploy, you can use **production URLs** in captions (“Live demo”).

## README snippet (paste under the title)

After you add images, uncomment and adjust in `README.md`:

```md
## Screenshots

| Landing | Tournaments |
|--------|---------------|
| ![Landing](./docs/images/01-landing.png) | ![Tournaments](./docs/images/02-tournaments.png) |

| Tournament detail | Player stats |
|-------------------|---------------|
| ![Detail](./docs/images/03-tournament-detail.png) | ![Stats](./docs/images/05-player-stats.png) |
```

Or a simple vertical stack:

```md
![Dashboard](./docs/images/04-dashboard-tournaments.png)
```
