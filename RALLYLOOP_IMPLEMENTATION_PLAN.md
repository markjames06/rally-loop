# RallyLoop --- Implementation Plan for GitHub Copilot

**Document:** `RALLYLOOP_IMPLEMENTATION_PLAN.md`\
**Product:** RallyLoop\
**Purpose:** A practical, phased implementation blueprint for building a
multi-sport queuing and court-management web application with GitHub
Copilot.

------------------------------------------------------------------------

## 1. Product vision

RallyLoop helps sports facilities and player communities organize
recreational games without confusing paper lists, group chats, or manual
player rotations.

The first release will be a responsive web application for sports such
as:

-   Pickleball
-   Badminton
-   Tennis
-   Other court-based sports that can be configured by an administrator

**Product promise:** *Every Game. One Queue.*

### Main product goals

1.  Let players find a facility/session and join its queue.
2.  Let staff manage courts, queues, and matches.
3.  Keep queue and court status synchronized for everyone in near real
    time.
4.  Support different sports and match formats without hardcoding one
    sport's rules.
5.  Give facility administrators a clear view of activity and basic
    history.

### MVP success criteria

A small group can use RallyLoop at one facility to:

-   Sign in using a supported authentication method.
-   Create and configure a sports session.
-   See available courts and session status.
-   Join and leave an open queue.
-   See their queue position and current queue.
-   Assign the next eligible players to an available court.
-   Start and complete a match.
-   See queue and court changes update on other connected devices.
-   Review recent match history.

Do not add payments, subscriptions, tournament brackets, chat, advanced
rankings, native mobile apps, or complex booking calendars to the first
MVP.

------------------------------------------------------------------------

## 2. Product assumptions and boundaries

Use these assumptions unless the product owner changes them:

-   **Platform:** Responsive web app first; mobile-friendly, but not a
    native Android/iOS app.
-   **Initial deployment:** One pilot facility or club. Design the data
    model so more facilities can be added later, but do not build
    enterprise multi-tenancy features prematurely.
-   **Users:** Player, staff, and facility administrator.
-   **Queue model:** A session has a sport, one or more courts, a queue,
    and configurable match settings.
-   **Match formats:** Support a configurable number of players per
    match (for example, singles or doubles). Do not assume every sport
    is doubles.
-   **Queue policy:** MVP uses first-in, first-out (FIFO) ordering.
    Staff can make controlled administrative adjustments, with an audit
    record.
-   **Court assignment:** Staff confirms or triggers assignment. Do not
    automatically assign players to courts until the basic flow is
    reliable.
-   **Real-time:** Realtime events improve the user experience, but the
    database remains the source of truth.
-   **Time:** Store timestamps in UTC and display them in the facility's
    configured timezone.
-   **Privacy:** Players should only see information needed to
    participate. Do not expose email addresses or private profile data
    in public queue views.

If any assumption changes, update this document and the database/feature
documentation before asking Copilot to implement the change.

------------------------------------------------------------------------

## 3. Recommended technology stack

Keep the stack intentionally small.

  -----------------------------------------------------------------------
  Area                    Technology              Responsibility
  ----------------------- ----------------------- -----------------------
  Web application         Next.js (App Router)    Pages, layouts,
                                                  server-side application
                                                  logic

  UI                      React                   Interactive interface

  Language                TypeScript              Application language
                                                  and types

  Styling                 Tailwind CSS            Responsive styling

  UI primitives           shadcn/ui               Accessible reusable
                                                  components

  Backend services        Supabase                Managed backend
                                                  platform

  Database                Supabase PostgreSQL     Persistent application
                                                  data

  Authentication          Supabase Auth           Sign-in and user
                                                  sessions

  Live updates            Supabase Realtime       Notify clients about
                                                  database changes

  File storage            Supabase Storage        Optional avatars and
                                                  facility images

  Hosting                 Vercel                  Web deployment

  Source control          GitHub                  Repository and change
                                                  history

  AI coding assistant     GitHub Copilot          Planning,
                                                  implementation, review,
                                                  and test assistance

  End-to-end tests        Playwright              Browser-based user-flow
                                                  testing

  Unit tests              Vitest                  Queue rules and other
                                                  isolated business logic
  -----------------------------------------------------------------------

### Avoid adding these at the start

-   Separate Express, NestJS, or Python backend
-   Redis or a message broker
-   Docker-based local infrastructure
-   Separate database hosting
-   GraphQL
-   Microservices
-   Native mobile frameworks
-   Multiple UI libraries
-   Multiple AI coding agents

Use a separate service only when a measured product requirement makes it
necessary.

### Important architecture rule

Next.js handles the application layer; Supabase provides managed
database, authentication, storage, and realtime capabilities. Critical
queue operations must be validated and executed on the server/database
side. Never rely on client-side state alone to decide who gets a queue
position or court assignment.

------------------------------------------------------------------------

## 4. User roles and permissions

### Player

Can:

-   Register and sign in.
-   Edit permitted profile fields.
-   View available sessions.
-   View public queue and court status.
-   Join an open queue if eligible.
-   Leave their own waiting queue entry.
-   View their own queue position and match history.

Cannot:

-   Manage facility settings.
-   Change another player's queue position.
-   Assign matches or courts.
-   View private information belonging to other players.

### Staff

Can:

-   View the facility's active sessions.
-   Open and close a session, subject to permission.
-   Manage the waiting queue.
-   Assign eligible players to an available court.
-   Start, complete, or cancel a match.
-   Record an administrative reason when overriding the normal queue
    order.

### Facility administrator

Can:

-   Do everything staff can do.
-   Manage facility details and staff access.
-   Create and configure sports, courts, and sessions.
-   Configure match size and queue settings.
-   View basic session and match history.

### Permission principles

-   Enforce permissions in database policies and trusted server-side
    code, not only by hiding buttons.
-   A player must never be able to submit another user's identity as the
    owner of a queue entry.
-   Staff permissions must be scoped to the facility they belong to.
-   Keep service-role secrets on the server only. Never expose them in
    browser code.

------------------------------------------------------------------------

## 5. Core user journeys

### Journey A --- Player joins a queue

1.  Player signs in.
2.  Player opens the available sessions page.
3.  Player selects a sport session.
4.  Player reviews session status, courts, and queue rules.
5.  Player taps **Join Queue**.
6.  Server validates that the session is open and the player is
    eligible.
7.  Database creates one waiting queue entry and assigns its position
    safely.
8.  Player sees confirmation and their current position.
9.  Connected clients receive an update.

### Journey B --- Staff starts a match

1.  Staff opens the session dashboard.
2.  Staff sees the waiting queue and available courts.
3.  Staff chooses an available court.
4.  System identifies the next eligible players based on FIFO and
    configured match size.
5.  Staff confirms the assignment.
6.  Database atomically validates the queue entries and court, creates
    the match, reserves the court, and updates queue-entry states.
7.  Players and staff see the updated queue and court status.
8.  Staff starts the match.

### Journey C --- Staff completes a match

1.  Staff opens an active match.
2.  Staff selects **Complete Match**.
3.  System records completion time and optional result/notes.
4.  Court becomes available.
5.  Match history is updated.
6.  Queue and court views refresh for connected users.

### Journey D --- Player leaves a queue

1.  Player opens their active queue entry.
2.  Player selects **Leave Queue**.
3.  Server verifies the entry belongs to the signed-in player and is
    still waiting.
4.  Entry is marked as cancelled/withdrawn rather than deleted.
5.  Queue display is recalculated from active waiting entries.
6.  Connected clients receive an update.

------------------------------------------------------------------------

## 6. Functional requirements

### MVP features

#### Authentication and profile

-   Sign up and sign in using Supabase Auth.
-   Sign out.
-   Protected pages.
-   Basic profile: display name and optional avatar.
-   Role-aware navigation.
-   Clear loading, error, and empty states.

#### Facility and sports setup

-   Facility details and timezone.
-   Supported sports.
-   Courts belonging to a facility.
-   Court name/number and active/inactive status.
-   Session creation with sport, date/time, status, match size, and
    queue policy.
-   Session statuses: `draft`, `open`, `paused`, `closed`, `completed`.

#### Queue

-   Join queue.
-   Leave own waiting entry.
-   Display waiting players and positions.
-   Prevent duplicate active entries for the same player in the same
    session.
-   Prevent joining closed or paused sessions.
-   Prevent queue actions when a player is already assigned to an active
    match, according to the chosen session policy.
-   Staff can skip or remove an entry with a reason and audit record.
-   FIFO is the default policy.

#### Courts and matches

-   Court statuses: `available`, `occupied`, `inactive`.
-   Match statuses: `assigned`, `in_progress`, `completed`, `cancelled`.
-   Assign the next eligible group to a court.
-   Start match.
-   Complete or cancel match.
-   Keep queue entry and court state consistent with match state.
-   Show active matches and recent match history.

#### Realtime

-   Subscribe to relevant session queue, court, and match changes.
-   Refresh data from the database after relevant events.
-   Handle reconnects and missed events by refetching authoritative
    data.
-   Show a connection/reconnecting indicator when practical.

#### Administration

-   Admin can manage facility, courts, sports, sessions, and staff.
-   Staff can manage active sessions and matches.
-   Confirm destructive or consequential actions.
-   Record audit events for staff overrides and important queue/match
    actions.

### Explicitly out of scope for MVP

-   Online payments and refunds
-   Paid memberships and subscriptions
-   Tournament brackets
-   Advanced player ratings or ranking algorithms
-   In-app chat
-   Push notifications and SMS
-   Native iOS/Android apps
-   Complex recurring bookings
-   AI-generated match recommendations
-   Multi-facility enterprise reporting

------------------------------------------------------------------------

## 7. Data model

Use PostgreSQL with UUID primary keys, foreign keys, constraints, and
indexes. Use `created_at` and `updated_at` timestamps where appropriate.
Store timestamps in UTC.

The initial model should be normalized and simple.

### Tables

#### `profiles`

-   `id` --- UUID, primary key, references `auth.users.id`
-   `display_name` --- text, required
-   `avatar_url` --- text, nullable
-   `created_at`
-   `updated_at`

#### `facilities`

-   `id` --- UUID, primary key
-   `name` --- text, required
-   `slug` --- text, unique
-   `address` --- text, nullable
-   `timezone` --- text, required
-   `created_by` --- UUID, references profiles
-   `created_at`
-   `updated_at`

#### `facility_members`

-   `id` --- UUID, primary key
-   `facility_id` --- UUID, references facilities
-   `user_id` --- UUID, references profiles
-   `role` --- enum: `admin`, `staff`
-   `created_at`

Add a unique constraint on `(facility_id, user_id)`.

#### `sports`

-   `id` --- UUID, primary key
-   `name` --- text, unique
-   `slug` --- text, unique
-   `is_active` --- boolean
-   `created_at`

Seed initial sports: Pickleball, Badminton, Tennis. Admins may enable
additional sports later.

#### `courts`

-   `id` --- UUID, primary key
-   `facility_id` --- UUID, references facilities
-   `name` --- text, required
-   `sport_id` --- UUID, references sports
-   `status` --- enum: `available`, `occupied`, `inactive`
-   `created_at`
-   `updated_at`

#### `sessions`

-   `id` --- UUID, primary key
-   `facility_id` --- UUID, references facilities
-   `sport_id` --- UUID, references sports
-   `name` --- text, required
-   `starts_at` --- timestamptz
-   `ends_at` --- timestamptz, nullable
-   `status` --- enum: `draft`, `open`, `paused`, `closed`, `completed`
-   `players_per_match` --- positive integer
-   `queue_policy` --- enum, initially only `fifo`
-   `created_by` --- UUID, references profiles
-   `created_at`
-   `updated_at`

#### `session_courts`

-   `session_id` --- UUID, references sessions
-   `court_id` --- UUID, references courts
-   Composite primary key `(session_id, court_id)`

This allows a session to use one or more courts without duplicating
court records.

#### `queue_entries`

-   `id` --- UUID, primary key
-   `session_id` --- UUID, references sessions
-   `player_id` --- UUID, references profiles
-   `status` --- enum: `waiting`, `assigned`, `withdrawn`, `skipped`
-   `joined_at` --- timestamptz
-   `updated_at`
-   `handled_by` --- UUID, nullable, references profiles
-   `admin_note` --- text, nullable

Use a partial unique index to prevent more than one active entry per
player per session (active means `waiting` or `assigned`). Queue
position should be derived from the ordered waiting entries, not treated
as a permanent identity or trusted client-supplied value.

#### `matches`

-   `id` --- UUID, primary key
-   `session_id` --- UUID, references sessions
-   `court_id` --- UUID, references courts
-   `status` --- enum: `assigned`, `in_progress`, `completed`,
    `cancelled`
-   `assigned_at` --- timestamptz
-   `started_at` --- timestamptz, nullable
-   `completed_at` --- timestamptz, nullable
-   `created_by` --- UUID, references profiles
-   `notes` --- text, nullable

#### `match_players`

-   `match_id` --- UUID, references matches
-   `player_id` --- UUID, references profiles
-   `queue_entry_id` --- UUID, references queue entries
-   Composite primary key `(match_id, player_id)`

#### `audit_logs`

-   `id` --- UUID, primary key
-   `facility_id` --- UUID, references facilities
-   `actor_id` --- UUID, references profiles
-   `action` --- text
-   `entity_type` --- text
-   `entity_id` --- UUID
-   `details` --- JSONB, avoid storing unnecessary personal data
-   `created_at`

### Database integrity rules

Copilot must implement and test these rules:

1.  A player cannot have duplicate active queue entries in one session.
2.  A court cannot have more than one active match at a time.
3.  A match cannot contain more players than the session's configured
    `players_per_match`.
4.  Only a player with a valid waiting queue entry can be assigned by
    the normal queue flow.
5.  Queue assignment must be atomic; two staff members cannot assign the
    same player or court simultaneously.
6.  A player cannot withdraw an entry that is already assigned or
    belongs to a completed match.
7.  Only authorized staff/admin can modify sessions, courts, and
    matches.
8.  A facility member cannot access another facility's private
    management data.
9.  Queue positions are calculated using waiting entries ordered by
    `joined_at`, with a stable tie-breaker such as `id`.
10. Important staff overrides must create an audit log.

**Critical implementation note:** Use PostgreSQL functions/RPCs or
another trusted transactional server-side mechanism for `join_queue`,
`leave_queue`, `assign_next_match`, `start_match`, and `complete_match`.
Do not implement these as several independent browser requests. A
transaction must either complete all related changes or roll them all
back.

Before implementing the schema, have Copilot review the model for
constraints and explain any proposed changes. Do not let it silently
replace the model.

------------------------------------------------------------------------

## 8. Application structure

Keep routes, interface code, trusted backend logic, shared code, and
database assets in clearly named top-level folders. Group domain logic
inside each layer so a change can be followed by feature.

``` text
rallyloop/
├── .github/
│   └── copilot-instructions.md
├── app/                         # Next.js routes, layouts, and route handlers
├── components/                  # Reusable UI, grouped by domain
│   ├── auth/
│   ├── facilities/
│   ├── matches/
│   ├── queue/
│   ├── realtime/
│   ├── sessions/
│   └── ui/
├── server/                      # Trusted server-only application code
│   ├── auth/                    # Actions and route guards
│   ├── facilities/              # Facility actions
│   ├── matches/                 # Match actions and queries
│   ├── queue/                   # Queue actions and queries
│   ├── sessions/                # Session queries
│   └── supabase/                # Server and request-scoped clients
├── shared/                      # Browser-safe code used across layers
│   ├── auth/
│   ├── facilities/              # Validation and date/time helpers
│   ├── matches/                 # Match rules
│   ├── queue/                   # Queue rules
│   ├── lib/                     # Shared utilities
│   ├── supabase/                # Browser client
│   └── types/                   # Shared database types
├── supabase/
│   ├── migrations/
│   └── tests/database/
├── tests/
│   ├── auth/
│   ├── facilities/
│   ├── matches/
│   ├── queue/
│   ├── e2e/
├── proxy.ts
└── package.json
```

Keep Next.js App Router files in `app/`. Place trusted server actions,
queries, guards, and server-side Supabase clients in `server/`; do not
import server-only modules into browser components. Keep browser-safe
rules, validation, types, and utilities in `shared/`. Store database
changes and database contract tests under `supabase/`.

Do not create a generic abstraction until at least two real use cases
need it.

------------------------------------------------------------------------

## 9. Security and reliability requirements

Security is part of the implementation, not a final polish task.

### Authentication and authorization

-   Use Supabase Auth.
-   Use the official Supabase SSR approach for Next.js server/client
    clients.
-   Protect management routes on the server.
-   Verify the current user and facility membership in trusted
    server-side code.
-   Never trust a role, user ID, facility ID, or permission supplied by
    the browser without checking it.

### Row Level Security (RLS)

Enable RLS on every table exposed through the Supabase API.

Policies must ensure:

-   Players can read and update only permitted profile fields.
-   Players can read public session/queue information needed to
    participate.
-   Players can create or withdraw only their own eligible queue entries
    through trusted operations.
-   Staff/admin can manage only facilities where they have the required
    membership.
-   Users cannot promote themselves to staff/admin.
-   Private audit data is visible only to authorized management users.

Prefer explicit policies and tests over broad policies such as
`using (true)`.

### Secrets

-   Keep Supabase service-role keys and other secrets on the server.
-   Only expose intended public configuration variables using the
    framework's public environment-variable convention.
-   Commit `.env.example`, never real `.env` files.
-   Do not paste secrets into Copilot chat or commit them to GitHub.

### Reliability

-   Use database constraints for invariants.
-   Use transactions for multi-step queue/match operations.
-   Make actions safe against accidental double submission.
-   Show understandable error messages.
-   Refetch authoritative data after realtime reconnects.
-   Log important server errors without logging passwords, tokens, or
    unnecessary personal information.

------------------------------------------------------------------------

## 10. UI and UX direction

### Brand

-   Product name: RallyLoop
-   Tagline: Every Game. One Queue.
-   Personality: energetic, organized, welcoming, modern.
-   Avoid a design that looks like a complex enterprise administration
    tool.

### Design principles

-   Mobile-first responsive layouts.
-   Clear visual distinction between waiting, assigned, playing,
    completed, and available.
-   Queue position should be easy to understand at a glance.
-   Large, accessible actions for joining and leaving a queue.
-   Staff dashboard optimized for quick decisions.
-   Consistent spacing, typography, colors, and component behavior.
-   Accessible labels, keyboard focus, and sufficient color contrast.
-   Use status text/icons in addition to color.

### Main screens

#### Public/authentication

-   Landing page
-   Sign in
-   Sign up

#### Player

-   Player home
-   Available sessions
-   Session details
-   My queue status
-   My match history
-   Profile

#### Staff/admin

-   Management dashboard
-   Facility settings
-   Sports management
-   Court management
-   Session management
-   Live queue management
-   Active matches
-   Match history
-   Staff management (admin only)

Do not build every screen at once. Implement only the screens needed for
the current phase.

------------------------------------------------------------------------

## 11. Implementation phases and definition of done

Work in the order below. Each phase must be reviewed and tested before
starting the next.

### Phase 0 --- Repository and project foundation

Tasks:

1.  Create the GitHub repository.
2.  Create the Next.js app with TypeScript, Tailwind CSS, and App
    Router.
3.  Connect the project to Supabase.
4.  Configure environment variables.
5.  Add shadcn/ui.
6.  Configure linting and formatting using the starter's existing tools.
7.  Add the initial project documentation and Copilot instructions.
8.  Create a basic responsive RallyLoop shell and landing page.

Definition of done:

-   App runs locally.
-   No TypeScript or lint errors.
-   Environment variables are documented.
-   No secrets are committed.
-   GitHub repository contains the working baseline.

### Phase 1 --- Authentication and roles

Tasks:

1.  Configure Supabase Auth.
2.  Add sign-up, sign-in, and sign-out.
3.  Create profile records.
4.  Add protected player and management routes.
5.  Add facility membership and role checks.
6.  Configure and test RLS.

Definition of done:

-   A user can register, sign in, and sign out.
-   Protected routes reject unauthenticated users.
-   A player cannot access staff/admin actions.
-   Users cannot change their own role.
-   RLS is enabled and tested.

### Phase 2 --- Facility, sports, courts, and sessions

Tasks:

1.  Create the database migrations.
2.  Seed the initial sports.
3.  Build facility setup.
4.  Build court CRUD for admins.
5.  Build session creation and editing.
6.  Associate courts with sessions.
7.  Build session list and session detail views.
8.  Add validation and empty/loading/error states.

Definition of done:

-   Admin can create and manage courts.
-   Admin can create a session for a sport.
-   A session can use multiple compatible courts.
-   Players can view open sessions.
-   Unauthorized users cannot manage facility data.

### Phase 3 --- Queue engine

Tasks:

1.  Implement queue database functions.
2.  Implement join queue.
3.  Implement leave queue.
4.  Calculate queue position from active waiting entries.
5.  Prevent duplicate active entries.
6.  Handle closed/paused sessions.
7.  Add staff skip/remove actions with reasons and audit logs.
8.  Add unit tests for queue rules.

Definition of done:

-   Eligible players can join and leave.
-   Queue ordering is FIFO.
-   Duplicate joins are rejected safely.
-   Concurrent join attempts do not create duplicate active entries or
    incorrect ordering.
-   Staff overrides are authorized and audited.
-   Queue state remains correct after refresh.

### Phase 4 --- Court and match lifecycle

Tasks:

1.  Implement atomic next-match assignment.
2.  Validate available court and eligible queue entries.
3.  Create match and match-player records.
4.  Update queue entries and court status in the same transaction.
5.  Implement start match.
6.  Implement complete and cancel match.
7.  Release courts correctly.
8.  Add match history.

Definition of done:

-   Staff can assign the next eligible players to an available court.
-   A court cannot be assigned to two active matches.
-   A player cannot be assigned to two active matches under the MVP
    policy.
-   Starting/completing a match updates all related records
    consistently.
-   Failure during a transaction does not leave partial updates.

### Phase 5 --- Realtime experience

Tasks:

1.  Subscribe to queue changes for the current session.
2.  Subscribe to court and match changes.
3.  Update visible UI when relevant events arrive.
4.  Handle reconnects and stale state.
5.  Add a manual refresh fallback.
6.  Test with multiple browser sessions.

Definition of done:

-   Two or more clients see relevant changes without manually refreshing
    under normal connectivity.
-   Reconnecting clients reload authoritative state.
-   Realtime is not treated as the source of truth.
-   No duplicate queue entries or matches are created due to repeated
    events.

### Phase 6 --- QA, accessibility, and hardening

Tasks:

1.  Add Playwright tests for critical user journeys.
2.  Test player/staff/admin permissions.
3.  Test queue edge cases and concurrent actions.
4.  Test mobile and desktop layouts.
5.  Test loading, empty, error, and offline/reconnect states.
6.  Check keyboard navigation and labels.
7.  Review RLS policies and secrets.
8.  Fix high-priority defects.
9.  Prepare production environment configuration.

Definition of done:

-   Critical end-to-end journeys pass.
-   No known critical/high security defects remain.
-   Queue and match invariants pass tests.
-   No major mobile layout blockers remain.
-   Production secrets are configured outside source control.

### Phase 7 --- Deployment and pilot

Tasks:

1.  Create the Vercel project.
2.  Configure production environment variables.
3.  Apply reviewed database migrations to production.
4.  Configure Supabase Auth redirect URLs.
5.  Deploy the app.
6.  Create the pilot facility and administrator.
7.  Run a small real-world pilot.
8.  Collect feedback and prioritize fixes.

Definition of done:

-   Production app is reachable over HTTPS.
-   Authentication works on the deployed domain.
-   Database policies are active.
-   Pilot staff can run a session from opening the queue to completing
    matches.
-   A rollback/recovery approach is documented.

------------------------------------------------------------------------

## 12. Testing strategy

Treat RallyLoop as a real product, not just a UI demo.

### Unit tests

Focus on isolated rules:

-   FIFO ordering
-   Eligibility to join
-   Eligibility to leave
-   Match player count
-   Session status validation
-   Queue position calculation
-   Match/court state transitions

### Integration/database tests

Verify:

-   Database constraints
-   Queue RPC behavior
-   Transaction rollback
-   Duplicate join prevention
-   Court assignment conflicts
-   RLS access by role
-   Facility isolation

### End-to-end tests

Critical scenarios:

1.  Player registers and signs in.
2.  Player joins an open session.
3.  Player sees their queue position.
4.  Player leaves the waiting queue.
5.  Staff assigns the next group to a court.
6.  Staff starts and completes a match.
7.  Another browser sees live queue/court updates.
8.  Player cannot access management functions.
9.  Player cannot manipulate another player's queue entry.
10. Two users attempt a conflicting action at nearly the same time.

### Manual QA checklist

-   [ ] Correct UI on desktop and mobile.
-   [ ] Forms validate required fields.
-   [ ] Buttons show loading/disabled states during actions.
-   [ ] Errors are understandable.
-   [ ] Empty states explain what to do next.
-   [ ] Refresh does not corrupt queue state.
-   [ ] Realtime reconnect recovers current state.
-   [ ] Unauthorized requests are rejected server-side.
-   [ ] Queue order remains correct after withdrawals/skips.
-   [ ] Court is released after match completion/cancellation.

------------------------------------------------------------------------

## 13. GitHub Copilot working rules

Use Copilot as a coding partner, not as an unrestricted developer.

### General rules for Copilot

1.  Read `AGENTS.md`, `.github/copilot-instructions.md`, and the
    relevant docs before making changes.
2.  Inspect the existing code before proposing edits.
3.  Work on one feature or small task at a time.
4.  State which files will change and why before a multi-file
    implementation.
5.  Do not rewrite unrelated code.
6.  Do not add dependencies without explaining the need.
7.  Do not invent database columns, roles, or business rules.
8.  Do not put secrets in code.
9.  Do not bypass TypeScript with `any` just to silence errors.
10. Do not use client-side checks as the only security control.
11. Do not use mock data in production paths.
12. Add or update tests for business logic changes.
13. Run relevant tests, lint, and type checks after changes.
14. Report what changed, what was tested, and anything not verified.
15. If requirements are unclear or conflict with the data model, ask
    before implementing.

### Required implementation response from Copilot

For each task, Copilot should report:

-   **Understanding:** What it believes the task requires.
-   **Plan:** Small steps it will take.
-   **Files:** Expected files to create/change.
-   **Implementation:** What it changed.
-   **Validation:** Commands/tests run and their results.
-   **Risks:** Any assumptions, limitations, or follow-up work.

### Avoid oversized prompts

Do not say: "Build the entire RallyLoop application."

Instead say: "Implement the player join-queue flow only. First inspect
the existing queue schema and instructions. Explain the plan and
affected files. Implement the server-side operation, UI state, error
handling, and tests. Do not modify match assignment or unrelated
features."

------------------------------------------------------------------------

## 14. Starter prompt for GitHub Copilot

Paste this into GitHub Copilot Chat after adding this plan to the
repository:

> You are the senior full-stack engineer helping me build RallyLoop, a
> multi-sport queuing and court-management web application.
>
> First, read `RALLYLOOP_IMPLEMENTATION_PLAN.md` and all applicable
> repository instructions. Treat the implementation plan as the product
> baseline.
>
> My stack is Next.js App Router, React, TypeScript, Tailwind CSS,
> shadcn/ui, Supabase (PostgreSQL, Auth, Realtime, Storage), Vercel, and
> GitHub.
>
> I am building this incrementally and want to keep the architecture and
> dependencies minimal. Do not introduce another backend, database,
> framework, or service unless you explain why it is necessary and get
> my approval.
>
> **Do not implement the whole app in one response.**
>
> Start by inspecting the repository and reporting:
>
> 1.  What is already configured.
> 2.  What is missing for Phase 0.
> 3.  Any conflicts between the current repository and the
>     implementation plan.
> 4.  The smallest safe next task.
>
> Do not edit files yet. Wait for my approval before implementing the
> first task.
>
> For every later task, inspect before editing, work only within the
> requested scope, preserve existing working behavior, add appropriate
> tests, run validation commands, and summarize changed files and test
> results.
>
> Treat database integrity, server-side authorization, Supabase RLS, and
> transactional queue operations as mandatory. Never trust
> client-supplied roles or queue positions.

------------------------------------------------------------------------

## 15. Reusable prompts for each development task

### A. Planning a feature

> Read the RallyLoop implementation plan and relevant repository
> instructions. I want to implement: **\[FEATURE\]**.
>
> Do not edit files yet. Inspect the existing implementation and
> explain: - Current behavior - Expected behavior - Files likely to
> change - Database/API implications - Security and permission
> implications - Test cases - Smallest implementation steps
>
> Identify unclear requirements before coding.

### B. Implementing a feature

> Implement only the approved **\[FEATURE/TASK\]**.
>
> Follow the existing architecture and RallyLoop documentation. Keep
> changes focused. Include loading, empty, success, and error states
> where relevant. Validate authorization on the server and preserve
> database integrity. Add or update tests.
>
> Run the relevant type check, lint, and tests. Report changed files,
> results, and remaining risks. Do not start another feature.

### C. Fixing a bug

> Fix this RallyLoop bug:
>
> **Expected:** \[EXPECTED BEHAVIOR\]\
> **Actual:** \[ACTUAL BEHAVIOR\]\
> **Steps to reproduce:** \[STEPS\]
>
> First investigate the root cause. Do not immediately rewrite the
> component or change unrelated files. Explain the cause and proposed
> fix, then implement a focused correction with a regression test. Run
> relevant checks and report the results.

### D. Reviewing code

> Review the current RallyLoop changes as a senior engineer and QA
> reviewer.
>
> Focus on correctness, authorization, RLS, queue concurrency, database
> consistency, TypeScript safety, accessibility, responsiveness, and
> maintainability.
>
> Report findings by severity with file references. Do not modify code
> until I approve the fixes.

### E. Improving UI

> Improve the UI of **\[SCREEN/COMPONENT\]** while preserving its
> existing behavior and data flow.
>
> Follow RallyLoop's design direction: modern, energetic, welcoming,
> clean, and mobile-first. Reuse existing shadcn/ui components and
> design patterns. Do not introduce another UI library. Include
> responsive and accessible states.
>
> Avoid changing backend behavior unless explicitly requested.

------------------------------------------------------------------------

## 16. Environment variables

Create `.env.example` with placeholders only:

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Use the exact environment variable names expected by the selected
Supabase Next.js starter/template. If the starter uses a publishable key
name instead of the legacy anon-key name, follow the starter
consistently.

Never commit real credentials. Keep any service-role or secret key
server-only and out of `NEXT_PUBLIC_` variables.

------------------------------------------------------------------------

## 17. Definition of a successful MVP

RallyLoop is ready for a pilot when:

-   [ ] A player can create an account and sign in.
-   [ ] An admin can configure a facility, sport, courts, and session.
-   [ ] A player can view and join an open session.
-   [ ] Queue order is FIFO and safely maintained.
-   [ ] A player can leave their own waiting entry.
-   [ ] Staff can assign the next eligible players to an available
    court.
-   [ ] Staff can start, complete, and cancel a match.
-   [ ] Court and queue state remain consistent.
-   [ ] Connected users receive live updates.
-   [ ] RLS and server-side permissions prevent unauthorized access.
-   [ ] Critical user journeys have automated tests.
-   [ ] The app is deployed and usable on mobile and desktop.

------------------------------------------------------------------------

## 18. Final advice: build in small, reviewable increments

The best way to use GitHub Copilot on RallyLoop is:

1.  Give it the product plan and repository instructions.
2.  Ask it to inspect the project before editing.
3.  Approve one small implementation task.
4.  Review the code and database changes.
5.  Run the app and test the feature yourself.
6.  Ask Copilot to fix issues with a focused bug report.
7.  Commit the working change to GitHub.
8.  Move to the next task only when the current one is stable.

**Do not optimize for the fastest amount of generated code. Optimize for
a working, secure, testable product.**

RallyLoop should begin as a reliable queue-management MVP. Add advanced
features only after real players and staff have used the basic workflow.
