# Interface Requirements

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS

**Design Inspiration:**
- Battlefy.com - tournament cards and layout
- Liquipedia - bracket visualization
- Linear.app - clean, modern dashboard aesthetic
- Dark mode with purple/cyan gaming accents
- Smooth transitions like Vercel's website

---

## 1. TypeScript Type Interfaces

### Core Type Definitions (`src/types/index.ts`)
- [ ] `Tournament` - Extended tournament type with relations
- [ ] `Team` - Extended team type with members
- [ ] `Match` - Extended match type with teams
- [ ] `BracketNode` - Bracket tree structure
- [ ] `RegistrationWithTeam` - Registration with team details
- [ ] `UserProfile` - Extended user type
- [ ] `Notification` - Notification type

### Component Props Interfaces
- [ ] `TournamentCardProps`
- [ ] `BracketViewProps`
- [ ] `MatchCardProps`
- [ ] `TeamCardProps`
- [ ] Define all other component prop types

---

## 2. Layout Components

### Dashboard Layout (`src/components/layout/`)
- [ ] **`DashboardLayout.tsx`** - Main dashboard wrapper
  - Sidebar navigation
  - Header with user menu
  - Breadcrumbs
  - Mobile responsive

- [ ] **`Sidebar.tsx`** - Navigation sidebar (Linear.app style)
  - Clean, minimal design
  - Active state indicators
  - Icons for each section
  - Collapsible on mobile

- [ ] **`Navbar.tsx`** - Top navigation bar
  - Logo
  - User avatar/menu
  - Notifications dropdown
  - Dark mode toggle (optional)

- [ ] **`Footer.tsx`** - Footer component
  - Links
  - Social media
  - Copyright info

---

## 3. Tournament Components

### Tournament Cards (`src/components/tournament/`)
- [ ] **`TournamentCard.tsx`** - Battlefy-inspired card
  - Tournament name & game
  - Status badge (upcoming/live/completed)
  - Team count & max teams
  - Start date
  - Format indicator
  - Hover effects
  - Join/View button

- [ ] **`TournamentList.tsx`** - Grid of tournament cards
  - Responsive grid layout
  - Filters (game, format, status)
  - Search functionality
  - Pagination
  - Empty state

- [ ] **`TournamentForm.tsx`** - Create/Edit tournament
  - Name, description, game
  - Format selection (dropdown)
  - Max teams, dates
  - Visibility settings
  - Form validation
  - Loading states

- [ ] **`TournamentDetails.tsx`** - Full tournament view
  - Header with status
  - Tabs: Overview, Bracket, Teams, Matches
  - Registration button/status
  - Organizer info
  - Share button

### Tournament Pages (`src/app/`)
- [ ] **`/tournaments/[id]/page.tsx`** - View tournament
- [ ] **`/dashboard/tournaments/create/page.tsx`** - Create tournament
- [ ] **`/dashboard/tournaments/[id]/edit/page.tsx`** - Edit tournament

---

## 4. Bracket Components

### Bracket Visualization (`src/components/bracket/`)
- [ ] **`BracketView.tsx`** - Main bracket component (Liquipedia style)
  - SVG-based bracket lines
  - Responsive layout
  - Match cards positioned correctly
  - Zoom/pan controls
  - Mobile-friendly view

- [ ] **`BracketMatch.tsx`** - Individual match in bracket
  - Team names & logos
  - Scores
  - Status indicator
  - Click to view details
  - Winner highlighting

- [ ] **`BracketRound.tsx`** - Round container
  - Round label
  - Matches in round
  - Vertical spacing

- [ ] **`SeedingInterface.tsx`** - Drag-and-drop seeding
  - Team list with drag handles
  - Seed positions
  - Save/cancel buttons

---

## 5. Team Components

### Team Management (`src/components/team/`)
- [ ] **`TeamCard.tsx`** - Team display card
  - Team name & logo
  - Tag/abbreviation
  - Member count
  - Owner info
  - View button

- [ ] **`TeamList.tsx`** - Grid of team cards
  - Search functionality
  - Pagination
  - Empty state

- [ ] **`TeamForm.tsx`** - Create/Edit team
  - Name, tag, logo upload
  - Form validation

- [ ] **`TeamDetails.tsx`** - Full team view
  - Header with logo
  - Roster list
  - Tournament history
  - Stats

- [ ] **`RosterManager.tsx`** - Manage team members
  - Member list with roles
  - Add member (search users)
  - Remove member
  - Role assignment

### Team Pages (`src/app/`)
- [ ] **`/teams/[id]/page.tsx`** - View team
- [ ] **`/dashboard/teams/create/page.tsx`** - Create team

---

## 6. Match Components

### Match Display (`src/components/match/`)
- [ ] **`MatchCard.tsx`** - Match summary card
  - Team names & logos
  - Scores
  - Status badge
  - Scheduled time
  - Actions (submit result, dispute)

- [ ] **`MatchResultForm.tsx`** - Submit match result
  - Score inputs
  - Confirmation
  - Loading state

- [ ] **`MatchDetails.tsx`** - Full match view
  - Team details
  - Match info (round, time)
  - Result submission
  - Dispute button
  - Match history

---

## 7. Shared/UI Components

### Additional shadcn/ui Components Needed
- [ ] `Select` - Dropdowns
- [ ] `Textarea` - Descriptions
- [ ] `Dialog` - Modals
- [ ] `Badge` - Status indicators
- [ ] `Avatar` - User/team images
- [ ] `Tabs` - Tabbed interfaces
- [ ] `Dropdown Menu` - User menu
- [ ] `Toast` - Notifications
- [ ] `Skeleton` - Loading states
- [ ] `Alert` - Error/success messages
- [ ] `Popover` - Tooltips/popovers

### Custom Shared Components (`src/components/shared/`)
- [ ] **`StatusBadge.tsx`** - Tournament/match status
  - Color-coded (purple/cyan accents)
  - Animated for "LIVE"

- [ ] **`EmptyState.tsx`** - No data placeholder
  - Icon
  - Message
  - Action button

- [ ] **`LoadingSpinner.tsx`** - Loading indicator
  - Smooth animation
  - Various sizes

- [ ] **`PageHeader.tsx`** - Page title section
  - Title, description
  - Action buttons
  - Breadcrumbs

- [ ] **`DataTable.tsx`** - Reusable table
  - Sorting
  - Pagination
  - Search

- [ ] **`FilterBar.tsx`** - Filter controls
  - Dropdowns, search
  - Clear filters button

---

## 8. User/Profile Components

### User Interface (`src/components/user/`)
- [ ] **`UserMenu.tsx`** - Dropdown user menu
  - Profile link
  - Settings
  - Logout

- [ ] **`UserProfile.tsx`** - Profile display
  - Avatar, name, email
  - Stats (tournaments played, wins)
  - Teams

- [ ] **`ProfileForm.tsx`** - Edit profile
  - Name, avatar upload
  - Save button

### Profile Page
- [ ] **`/profile/page.tsx`** - User profile page

---

## 9. Admin Components

### Admin Dashboard (`src/components/admin/`)
- [ ] **`AdminDashboard.tsx`** - Admin overview
  - Statistics cards
  - Recent activity
  - Charts (optional)

- [ ] **`UserManagement.tsx`** - User list/management
  - User table
  - Role assignment
  - Ban/unban actions

- [ ] **`TournamentModeration.tsx`** - Tournament management
  - Approve/reject
  - Featured tournaments

### Admin Pages
- [ ] **`/admin/page.tsx`** - Admin dashboard
- [ ] **`/admin/users/page.tsx`** - User management
- [ ] **`/admin/tournaments/page.tsx`** - Tournament moderation

---

## 10. Home & Landing Pages

### Public Pages
- [ ] **`/page.tsx`** - Landing page redesign
  - Hero section
  - Featured tournaments
  - How it works
  - CTA buttons

- [ ] **`/about/page.tsx`** - About page (optional)

---

## 11. Registration & Authentication

### Registration Components (`src/components/tournament/`)
- [ ] **`RegistrationButton.tsx`** - Register team button
  - Team selection dropdown
  - Loading state
  - Success/error feedback

- [ ] **`RegistrationList.tsx`** - List of registrations (for organizers)
  - Approve/reject buttons
  - Seeding inputs

### Auth Improvements
- [ ] **Enhance `/login/page.tsx`** - Better UI with Vercel-style design
- [ ] **Enhance `/register/page.tsx`** - Improved registration form

---

## 12. Notification System

### Notification Components (`src/components/notifications/`)
- [ ] **`NotificationBell.tsx`** - Bell icon with badge
  - Unread count
  - Dropdown list

- [ ] **`NotificationList.tsx`** - List of notifications
  - Mark as read
  - Click to navigate

- [ ] **`ToastProvider.tsx`** - Toast notification system
  - Success, error, info types
  - Auto-dismiss

---

## Design System Guidelines

### Color Palette (Dark Mode)
- Background: `#0a0a0a` - `#1a1a1a`
- Surface: `#1e1e1e` - `#2a2a2a`
- Primary (Purple): `#8b5cf6` - `#a78bfa`
- Accent (Cyan): `#06b6d4` - `#22d3ee`
- Text: `#e5e5e5` - `#a3a3a3`
- Success: `#10b981`
- Error: `#ef4444`
- Warning: `#f59e0b`

### Typography
- Headings: `font-bold` with `tracking-tight`
- Body: `font-normal` with good line-height
- Code/Tags: `font-mono`

### Spacing & Layout
- Consistent padding: `p-4`, `p-6`, `p-8`
- Card borders: `border border-neutral-800`
- Rounded corners: `rounded-lg`, `rounded-xl`
- Shadows: Subtle with `shadow-lg` and purple/cyan glow

### Animations (Framer Motion)
- Page transitions: Fade + slide
- Card hover: Scale + glow effect
- Button clicks: Scale down
- Loading: Smooth spinner/skeleton
- Bracket updates: Smooth position changes

### Responsive Breakpoints
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

---

## Priority Order

### Phase 1 (High Priority) - Core UI
1. Dashboard Layout (Sidebar, Navbar)
2. Tournament Cards & List
3. Tournament Form & Create Page
4. Basic Bracket View
5. Match Cards

### Phase 2 (Medium Priority) - Teams & Details
6. Team Cards & List
7. Team Form & Create Page
8. Tournament Details Page
9. Match Details & Result Submission
10. User Profile

### Phase 3 (Lower Priority) - Advanced
11. Advanced Bracket Features (zoom, drag-and-drop seeding)
12. Admin Dashboard
13. Notifications
14. Animations & Polish
15. Landing Page Redesign

---

**Ready to implement?** Let me know which components you'd like me to start with, or I can begin with Phase 1 (Dashboard Layout + Tournament Components).
