# Esports Tournament Platform - Project Brief

## Project Overview
A full-stack esports tournament management platform with real-time bracket updates, team management, and match scheduling. Built for portfolio demonstration with top-notch execution focusing on clean architecture, performance, and polish.

**Developer Experience Level:** 6 years (React + Full-stack)
**Primary Goal:** Portfolio piece showcasing senior-level execution

---

## Core Features

### MVP Features (Phase 1)
- **Tournament Management**
  - Create tournaments (single elimination, double elimination, round robin, swiss format)
  - Edit/delete tournaments
  - Tournament visibility settings (public/private)
  - Tournament status (upcoming, in-progress, completed)

- **Team/Player Registration**
  - Team creation with roster management
  - Player profiles
  - Team registration for tournaments
  - Registration approval workflow (for organizers)

- **Bracket System**
  - Auto-generate brackets based on tournament type
  - Manual seeding capability
  - Match scheduling with timezone support
  - Result submission by participants
  - Admin override for disputes

- **User Authentication**
  - Email/password signup
  - OAuth (Google, Discord)
  - Role-based access (Admin, Organizer, Player, Spectator)

### Enhanced Features (Phase 2)
- **Real-time Updates**
  - Live bracket updates when matches complete
  - Real-time notifications (match starting, results posted)
  - Live participant count

- **Advanced UI/UX**
  - Drag-and-drop bracket seeding
  - Smooth animations (bracket progression, match updates)
  - Optimistic UI updates
  - Mobile-responsive design

- **Analytics & Stats**
  - Player/team statistics (wins, losses, tournaments played)
  - Tournament insights for organizers
  - Leaderboards

- **Communication**
  - Match chat rooms
  - Dispute reporting system
  - Tournament announcements

### Polish Features (Phase 3)
- **Admin Dashboard**
  - Tournament analytics
  - User management
  - Platform statistics
  - Moderation tools

- **Additional**
  - Shareable tournament pages
  - Email notifications
  - Tournament templates
  - Export brackets (PDF/PNG)

---

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** (styling)
- **Framer Motion** (animations)
- **React Query / Zustand** (state management)
- **shadcn/ui** (component library)

### Backend
- **Next.js API Routes** (Node.js)
- **tRPC** (type-safe API layer)
- **Prisma ORM** (database management)
- **PostgreSQL** (primary database)
- **NextAuth.js** (authentication)
- **Zod** (validation)

### Real-time
- **Pusher** (free tier: 200k messages/day) OR
- **Socket.io + Redis** (self-hosted alternative)

### DevOps & Tools
- **Vercel** (hosting - free tier)
- **Vercel PostgreSQL** OR **Supabase** (database hosting)
- **GitHub Actions** (CI/CD)
- **Vitest** (unit testing)
- **Playwright** (E2E testing)
- **ESLint + Prettier** (code quality)

---

## Database Schema

### Core Tables

```prisma
// User Management
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  role          Role      @default(PLAYER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  ownedTeams    Team[]    @relation("TeamOwner")
  teamMembers   TeamMember[]
  tournaments   Tournament[]
  matches       Match[]   @relation("MatchParticipant")
  notifications Notification[]
}

enum Role {
  ADMIN
  ORGANIZER
  PLAYER
  SPECTATOR
}

// Team Management
model Team {
  id          String   @id @default(cuid())
  name        String
  tag         String?
  logo        String?
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  owner       User     @relation("TeamOwner", fields: [ownerId], references: [id])
  members     TeamMember[]
  registrations TournamentRegistration[]
  matches     Match[]  @relation("MatchTeam")
}

model TeamMember {
  id        String   @id @default(cuid())
  teamId    String
  userId    String
  role      String   @default("member") // owner, member
  joinedAt  DateTime @default(now())
  
  // Relations
  team      Team     @relation(fields: [teamId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  
  @@unique([teamId, userId])
}

// Tournament Management
model Tournament {
  id              String      @id @default(cuid())
  name            String
  description     String?
  game            String
  format          TournamentFormat
  maxTeams        Int
  startDate       DateTime
  endDate         DateTime?
  status          TournamentStatus @default(UPCOMING)
  visibility      Visibility  @default(PUBLIC)
  organizerId     String
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  organizer       User        @relation(fields: [organizerId], references: [id])
  registrations   TournamentRegistration[]
  matches         Match[]
  brackets        Bracket[]
}

enum TournamentFormat {
  SINGLE_ELIMINATION
  DOUBLE_ELIMINATION
  ROUND_ROBIN
  SWISS
}

enum TournamentStatus {
  UPCOMING
  REGISTRATION_OPEN
  REGISTRATION_CLOSED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum Visibility {
  PUBLIC
  PRIVATE
  UNLISTED
}

// Registration
model TournamentRegistration {
  id            String   @id @default(cuid())
  tournamentId  String
  teamId        String
  status        RegistrationStatus @default(PENDING)
  seed          Int?
  registeredAt  DateTime @default(now())
  
  // Relations
  tournament    Tournament @relation(fields: [tournamentId], references: [id])
  team          Team       @relation(fields: [teamId], references: [id])
  
  @@unique([tournamentId, teamId])
}

enum RegistrationStatus {
  PENDING
  APPROVED
  REJECTED
  WITHDRAWN
}

// Bracket & Match System
model Bracket {
  id            String   @id @default(cuid())
  tournamentId  String
  round         Int
  position      Int
  createdAt     DateTime @default(now())
  
  // Relations
  tournament    Tournament @relation(fields: [tournamentId], references: [id])
  matches       Match[]
}

model Match {
  id            String      @id @default(cuid())
  tournamentId  String
  bracketId     String?
  round         Int
  matchNumber   Int
  scheduledAt   DateTime?
  status        MatchStatus @default(SCHEDULED)
  team1Id       String?
  team2Id       String?
  winnerId      String?
  team1Score    Int         @default(0)
  team2Score    Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  // Relations
  tournament    Tournament  @relation(fields: [tournamentId], references: [id])
  bracket       Bracket?    @relation(fields: [bracketId], references: [id])
  team1         Team?       @relation("MatchTeam", fields: [team1Id], references: [id])
  team2         Team?       @relation("MatchTeam", fields: [team2Id], references: [id])
  participants  User[]      @relation("MatchParticipant")
}

enum MatchStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  DISPUTED
  CANCELLED
}

// Notifications
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  title     String
  message   String
  read      Boolean  @default(false)
  link      String?
  createdAt DateTime @default(now())
  
  // Relations
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## Project Structure

```
esports-tournament-platform/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/              # Protected routes
│   │   │   ├── tournaments/
│   │   │   │   ├── page.tsx          # List tournaments
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx      # View tournament
│   │   │   │   │   ├── bracket/
│   │   │   │   │   ├── teams/
│   │   │   │   │   └── matches/
│   │   │   │   └── create/
│   │   │   ├── teams/
│   │   │   ├── profile/
│   │   │   └── admin/                # Admin dashboard
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # NextAuth routes
│   │   │   └── trpc/[trpc]/          # tRPC endpoints
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Landing page
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── tournament/
│   │   │   ├── TournamentCard.tsx
│   │   │   ├── BracketView.tsx
│   │   │   ├── MatchCard.tsx
│   │   │   └── TournamentForm.tsx
│   │   ├── team/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── shared/
│   │
│   ├── server/                       # Backend logic
│   │   ├── api/
│   │   │   ├── routers/              # tRPC routers
│   │   │   │   ├── tournament.ts
│   │   │   │   ├── team.ts
│   │   │   │   ├── match.ts
│   │   │   │   └── user.ts
│   │   │   ├── root.ts               # Root router
│   │   │   └── trpc.ts               # tRPC setup
│   │   ├── db/
│   │   │   └── client.ts             # Prisma client
│   │   └── auth/
│   │       └── config.ts             # NextAuth config
│   │
│   ├── lib/                          # Utilities
│   │   ├── utils.ts
│   │   ├── validators/               # Zod schemas
│   │   ├── bracket/                  # Bracket algorithms
│   │   │   ├── single-elimination.ts
│   │   │   ├── double-elimination.ts
│   │   │   └── round-robin.ts
│   │   └── constants.ts
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-tournament.ts
│   │   ├── use-realtime.ts
│   │   └── use-auth.ts
│   │
│   └── types/                        # TypeScript types
│       ├── index.ts
│       └── api.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                       # Database seeding
│
├── public/                           # Static assets
│   ├── images/
│   └── icons/
│
├── tests/                            # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Key Implementation Details

### Bracket Generation Algorithm

**Single Elimination:**
```typescript
// Pseudocode for single elimination bracket
function generateSingleElimination(teams: Team[]) {
  const rounds = Math.ceil(Math.log2(teams.length));
  const totalMatches = Math.pow(2, rounds) - 1;
  
  // Create bracket structure
  // Assign teams to first round
  // Create bye matches if needed
  // Link matches (winner of match X goes to match Y)
}
```

**Key considerations:**
- Handle byes (odd number of teams)
- Seeding logic
- Match progression (winner advancement)

### Real-time Updates Strategy

**Using Pusher:**
```typescript
// On match update
pusher.trigger(`tournament-${tournamentId}`, 'match-updated', {
  matchId,
  team1Score,
  team2Score,
  status
});

// Client subscription
const channel = pusher.subscribe(`tournament-${tournamentId}`);
channel.bind('match-updated', (data) => {
  // Update UI optimistically
  queryClient.invalidateQueries(['tournament', tournamentId]);
});
```

### Permission System

**Role-based access control:**
- ADMIN: Full access
- ORGANIZER: Manage own tournaments
- PLAYER: Join teams, register for tournaments
- SPECTATOR: View only

**Implementation:**
```typescript
// Middleware check
const canEditTournament = (userId: string, tournamentId: string) => {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId }
  });
  return tournament.organizerId === userId || userRole === 'ADMIN';
};
```

---

## Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Initialize Next.js project with TypeScript
- [ ] Setup Tailwind CSS + shadcn/ui
- [ ] Configure Prisma + PostgreSQL
- [ ] Setup NextAuth.js
- [ ] Create database schema
- [ ] Setup tRPC
- [ ] Create basic layout components

### Phase 2: Core Features (Week 2-3)
- [ ] User authentication flows
- [ ] Tournament CRUD operations
- [ ] Team management
- [ ] Tournament registration system
- [ ] Basic bracket generation (single elimination)
- [ ] Match result submission

### Phase 3: Advanced Features (Week 4)
- [ ] Implement other bracket types
- [ ] Real-time updates (Pusher integration)
- [ ] Drag-and-drop seeding
- [ ] Match scheduling
- [ ] Notification system

### Phase 4: Polish & Deploy (Week 5)
- [ ] UI/UX refinement
- [ ] Animations with Framer Motion
- [ ] Admin dashboard
- [ ] Testing (unit + E2E)
- [ ] Performance optimization
- [ ] Deploy to Vercel
- [ ] Documentation

---

## Testing Strategy

### Unit Tests (Vitest)
- Bracket generation algorithms
- Validation schemas (Zod)
- Utility functions
- tRPC procedures

### Integration Tests
- API routes
- Database operations
- Auth flows

### E2E Tests (Playwright)
- User registration → tournament creation → bracket generation → match completion
- Team creation → tournament registration → match participation
- Admin workflows

---

## Performance Considerations

1. **Database Optimization**
   - Proper indexing on frequently queried fields
   - Use Prisma's `select` to avoid over-fetching
   - Implement cursor-based pagination for large lists

2. **Caching Strategy**
   - React Query for client-side caching
   - Redis for server-side caching (match results, brackets)
   - Static page generation for public tournament pages

3. **Real-time Optimization**
   - Throttle bracket updates (debounce rapid changes)
   - Use optimistic updates for instant UI feedback
   - Implement reconnection logic for WebSocket drops

4. **Code Splitting**
   - Lazy load heavy components (bracket visualizer)
   - Route-based code splitting (Next.js automatic)
   - Dynamic imports for admin features

---

## Deployment Checklist

- [ ] Environment variables configured (Vercel)
- [ ] Database migrations run (production)
- [ ] Seed data for demo tournaments
- [ ] Error tracking setup (Sentry)
- [ ] Analytics integration (Vercel Analytics)
- [ ] Custom domain configured
- [ ] SSL certificate
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Lighthouse score 90+ on all metrics

---

## Documentation Requirements

### README.md
- Project overview
- Tech stack
- Setup instructions (local development)
- Environment variables
- Database setup
- Running tests
- Deployment guide
- Architecture overview with diagrams

### Code Documentation
- JSDoc for complex functions
- Type definitions for all entities
- Inline comments for bracket algorithms
- API documentation (tRPC automatically generates types)

---

## Portfolio Presentation

### Live Demo Features
- Pre-populated demo tournaments
- Sample teams and matches
- Admin account for full access
- Public tournament page showcase

### GitHub Repository
- Professional README with screenshots
- Clear contribution guidelines
- Issue templates
- Clean commit history
- Proper .gitignore

### Case Study / Blog Post
- Technical challenges solved
- Architecture decisions
- Performance optimizations
- Lessons learned
- Future improvements

---

## Future Enhancements (Post-MVP)

- Multi-game support
- Stream integration (Twitch embeds)
- Sponsor management
- Prize pool tracking
- Tournament templates
- Mobile app (React Native)
- API for third-party integrations
- Automated tournament scheduling
- Machine learning for match predictions
- Live scoreboard widgets

---

## Success Metrics

### Technical
- Lighthouse Performance: 90+
- Test Coverage: 80%+
- TypeScript strict mode: 100%
- Zero console errors in production

### Portfolio Impact
- Professional live demo
- Clean, documented codebase
- Demonstrates full-stack capabilities
- Shows senior-level architecture decisions
- Highlights real-time and complex algorithm implementation

---

## Notes for Claude Code

**Project Initialization Command:**
```bash
npx create-next-app@latest esports-tournament-platform --typescript --tailwind --app --src-dir --import-alias "@/*"
cd esports-tournament-platform
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query
npm install @prisma/client
npm install -D prisma
npm install next-auth @auth/prisma-adapter
npm install zod
npm install framer-motion
npm install pusher pusher-js
npx shadcn-ui@latest init
```

**First Steps:**
1. Initialize Prisma: `npx prisma init`
2. Copy schema from this document to `prisma/schema.prisma`
3. Create `.env.local` with database connection
4. Run migrations: `npx prisma migrate dev`
5. Setup tRPC structure in `/src/server`
6. Configure NextAuth in `/src/server/auth`

**Development Approach:**
- Start with authentication flow
- Build tournament CRUD next
- Implement bracket generation (single elimination first)
- Add real-time features last
- Test each feature before moving to next

**Code Quality Standards:**
- Use TypeScript strict mode
- Follow Next.js best practices
- Implement proper error handling
- Use server components where possible
- Optimize for Core Web Vitals

---

## Questions to Answer During Development

1. Which game(s) to focus on initially? (valorant, league, cs2, etc.)
2. Manual or automatic match scheduling?
3. Should teams have multiple rosters for different games?
4. Check-in system before matches?
5. Integration with Discord for notifications?

---

**This document should provide Claude Code with everything needed to scaffold and build the esports tournament platform. Refer back to this for architecture decisions, feature priorities, and technical implementation details.**