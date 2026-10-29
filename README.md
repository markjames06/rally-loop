# RallyLoop

**Every Game. One Queue.**

RallyLoop is a responsive web app foundation for recreational court sports. Its product direction and phased delivery baseline are in [RALLYLOOP_IMPLEMENTATION_PLAN.md](./RALLYLOOP_IMPLEMENTATION_PLAN.md).

## Current phase

Phase 6 includes authentication, facility/session management, transactional FIFO queue operations, match assignment and lifecycle, session-scoped live updates, and QA/accessibility/security hardening. Signed-in participants and facility staff receive minimal change notifications and reload authoritative queue, court, and match data. A manual refresh remains available, and reconnects trigger a fresh load.

## Requirements

- Node.js 20.9 or newer
- npm

## Local development

Install dependencies:

```powershell
npm ci
```

Create a local environment file from the placeholders if one does not already exist:

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Set these values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Use your project URL root, not its `/rest/v1` endpoint. The Supabase URL and publishable key are intended for public client configuration; never put a service-role/secret key in a `NEXT_PUBLIC_` variable. Keep `.env.local` private and untracked.

## Supabase setup

1. In Supabase **Authentication → URL Configuration**, set the local Site URL to `http://localhost:3000` and allow the redirect URL `http://localhost:3000/auth/confirm`. Add the production URL and its `/auth/confirm` callback before deploying.
2. Apply migrations in filename order using the Supabase SQL Editor: [`20261027000000_phase1_auth_and_roles.sql`](./supabase/migrations/20261027000000_phase1_auth_and_roles.sql), [`20261028000000_phase2_facilities_courts_sessions.sql`](./supabase/migrations/20261028000000_phase2_facilities_courts_sessions.sql), [`20261029000000_phase3_queue_engine.sql`](./supabase/migrations/20261029000000_phase3_queue_engine.sql), [`20261030000000_phase4_queue_played_status.sql`](./supabase/migrations/20261030000000_phase4_queue_played_status.sql), [`20261030000100_phase4_match_lifecycle.sql`](./supabase/migrations/20261030000100_phase4_match_lifecycle.sql), [`20261030000200_match_updated_at.sql`](./supabase/migrations/20261030000200_match_updated_at.sql), and [`20261031000000_phase5_realtime_broadcasts.sql`](./supabase/migrations/20261031000000_phase5_realtime_broadcasts.sql). Apply the queue status migration before the match lifecycle migration. To use the CLI instead, first initialize and link a Supabase CLI project.
3. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` locally, then start the app. New accounts receive a profile through a database trigger; email confirmation follows the project’s Supabase Auth settings.
4. The first facility and administrator membership must be provisioned by a trusted project owner in the Supabase SQL Editor. Authenticated application users cannot insert, change, or delete facility roles. Create the facility, then grant `admin` to the confirmed account’s profile using the owner’s SQL access; never grant a role based on client-submitted data. Once provisioned, admins can update facility settings and manage courts/sessions in the app.

RLS protects profiles, facility memberships, courts, sessions, queue entries, and match tables. Admin-only writes are enforced by policies or the transactional `save_session` RPC; queue and match mutations use authenticated, role-checked database functions. Open sessions and the facility/sport/court details needed to discover them are readable without signing in; draft and closed sessions and unassigned courts remain private to facility members. Authenticated users can see display names and positions in open-session queues and match history, but never player email addresses or staff-only notes. Realtime uses private, session-scoped Broadcast channels and sends only table/operation metadata; the UI refetches all displayed data through existing server queries and RPCs. Authenticated users can subscribe to open sessions, while non-open sessions are limited to facility admins/staff. No direct match-table access or Realtime payload includes match/player rows or staff notes.

Run the RLS contract tests against a Supabase database with pgTAP available: [`phase1_auth_rls.test.sql`](./supabase/tests/database/phase1_auth_rls.test.sql), [`phase2_facilities_sessions.test.sql`](./supabase/tests/database/phase2_facilities_sessions.test.sql), [`phase3_queue.test.sql`](./supabase/tests/database/phase3_queue.test.sql), [`phase4_matches.test.sql`](./supabase/tests/database/phase4_matches.test.sql), and [`phase5_realtime.test.sql`](./supabase/tests/database/phase5_realtime.test.sql). Unit tests cover auth, facility input, queue rules, and match lifecycle rules.

### End-to-end testing

Install the Playwright browser once with `npx playwright install chromium`, then run `npm run test:e2e`. The default run starts a local app on port 3100 with Supabase disabled and isolated build output; it exercises public-page responsiveness, authentication form labels, and keyboard navigation without accessing configured `.env.local` services. Authenticated tests are skipped unless the `E2E_*` variables are configured.

For authenticated journeys, configure the Playwright process with a **separate, disposable Supabase test project**, its URL/publishable key, two confirmed player accounts, a facility staff account, a facility administrator account, and the IDs of a facility, an open session, and an available court linked to that session. The session must use exactly two players per match, have an empty queue, and have no active matches. Set `E2E_PLAYER_EMAIL`, `E2E_PLAYER_PASSWORD`, `E2E_SECOND_PLAYER_EMAIL`, `E2E_SECOND_PLAYER_PASSWORD`, `E2E_STAFF_EMAIL`, `E2E_STAFF_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_SESSION_ID`, `E2E_FACILITY_ID`, and `E2E_COURT_ID`. The staff account must have the `staff` role (not `admin`) so the suite can verify the configuration boundary. These tests intentionally mutate queue and match state; never point them at production or a facility containing real player activity. Apply the Phase 1–5 migrations in the test project first. Use CI secret storage or process environment variables for test credentials; do not commit them.

`E2E_BASE_URL` can target an already-running test deployment instead of starting the local app. In that case, configure that deployment with the same isolated test Supabase project. The browser suite covers player queue join/leave, concurrent duplicate joins, player denial from facility management, staff match assignment/start/completion, live updates across two browsers, reconnects, and manual refresh.

### Production configuration preparation

In the hosting provider's environment settings, configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` for each environment. Use the Supabase publishable key only; this app does not require a service-role key. Configure Supabase Auth's site URL and redirect allowlist for the corresponding deployed domain. Keep production credentials in Vercel's environment settings, never in `.env.example`, source files, browser tests, or commits. The `.env.local` file is ignored by Git.

Start the development server:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

## Project map

- `app/` — Next.js App Router pages, layouts, route handlers, and global styles
- `components/` — reusable interface components; `components/ui/` contains shadcn/ui primitives
- `server/` — trusted backend code, grouped by domain: server actions, data queries, route guards, and server-side Supabase clients
- `shared/` — browser-safe domain validation/rules, shared utilities and types, and the browser Supabase client
- `supabase/migrations/` — version-controlled PostgreSQL schema, functions, and RLS policies
- `supabase/tests/database/` — pgTAP database and RLS contract tests
- `tests/` — unit and Playwright end-to-end tests, grouped by domain
- `AGENTS.md` — repository-wide development rules
- `.github/copilot-instructions.md` — Copilot-specific entry point to those rules

## Supabase and shadcn/ui

The app was scaffolded from the official Supabase `with-supabase` Next.js starter. It uses the official `@supabase/ssr` cookie-based client pattern, refreshes sessions through the Next.js `proxy.ts` request hook when Supabase is configured, and includes initialized shadcn/ui configuration in `components.json`. Session refresh is skipped until the public URL and publishable key are set.

See the [Supabase Next.js SSR guide](https://supabase.com/docs/guides/auth/server-side/nextjs) and the [shadcn/ui Next.js guide](https://ui.shadcn.com/docs/installation/next) for future configuration or component additions.
