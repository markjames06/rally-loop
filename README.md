# RallyLoop

**Every Game. One Queue.**

RallyLoop is a responsive web app foundation for recreational court sports. Its product direction and phased delivery baseline are in [RALLYLOOP_IMPLEMENTATION_PLAN.md](./RALLYLOOP_IMPLEMENTATION_PLAN.md).

## Current phase

Phase 1 includes email/password sign-up, sign-in, email confirmation, sign-out, profile creation, protected player routes, facility-scoped staff/admin checks, and RLS for profiles, facilities, and facility memberships. Facility management tools, queues, and matches are not implemented yet.

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
2. Apply [`supabase/migrations/20261027000000_phase1_auth_and_roles.sql`](./supabase/migrations/20261027000000_phase1_auth_and_roles.sql) to the Supabase project using the Supabase SQL Editor. To use the CLI instead, first initialize and link a Supabase CLI project.
3. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` locally, then start the app. New accounts receive a profile through a database trigger; email confirmation follows the project’s Supabase Auth settings.
4. The first facility and administrator membership must be provisioned by a trusted project owner in the Supabase SQL Editor until the facility setup feature is implemented. Authenticated application users cannot insert, change, or delete facility roles. Create the facility, then grant `admin` to the confirmed account’s profile using the owner’s SQL access; never grant a role based on client-submitted data.

The migration enables RLS on all Phase 1 tables. Profiles are private to their owner; facility reads and updates are membership-scoped; membership records are readable by their owner and facility admins but cannot be written through the client API.

Run the RLS contract tests against a Supabase database with pgTAP available by executing [`supabase/tests/database/phase1_auth_rls.test.sql`](./supabase/tests/database/phase1_auth_rls.test.sql). Unit tests cover role and redirect validation.

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

- `app/` — App Router landing page, auth pages/callback, player page, and protected management route
- `components/ui/` — initialized shadcn/ui components
- `lib/auth/` — auth actions, role/redirect validation, and server-side route guards
- `lib/supabase/` — typed server, browser, and request-session Supabase SSR clients
- `supabase/migrations/` — version-controlled database schema and RLS policies
- `supabase/tests/database/` — pgTAP RLS contract tests
- `tests/auth/` — isolated auth/role validation tests
- `AGENTS.md` — repository-wide development rules
- `.github/copilot-instructions.md` — Copilot-specific entry point to those rules

## Supabase and shadcn/ui

The app was scaffolded from the official Supabase `with-supabase` Next.js starter. It uses the official `@supabase/ssr` cookie-based client pattern and initialized shadcn/ui configuration in `components.json`. Supabase session refresh is skipped until the public URL and publishable key are set.

See the [Supabase Next.js SSR guide](https://supabase.com/docs/guides/auth/server-side/nextjs) and the [shadcn/ui Next.js guide](https://ui.shadcn.com/docs/installation/next) for future configuration or component additions.
