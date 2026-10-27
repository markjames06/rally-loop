# RallyLoop

**Every Game. One Queue.**

RallyLoop is a responsive web app foundation for recreational court sports. Its product direction and phased delivery baseline are in [RALLYLOOP_IMPLEMENTATION_PLAN.md](./RALLYLOOP_IMPLEMENTATION_PLAN.md).

## Phase 0 foundation

This repository currently contains the responsive landing page and the project foundation only. It uses Next.js App Router, React, TypeScript, Tailwind CSS, the shadcn/ui setup provided by the official Supabase Next.js starter, and Supabase SSR client helpers.

There are no sign-in flows, dashboards, database schema, queue operations, or match features yet. Implement later phases one approved feature at a time.

## Requirements

- Node.js 20.9 or newer
- npm

## Local development

Install dependencies:

```powershell
npm ci
```

Optional: copy the environment example for future Supabase configuration:

```powershell
Copy-Item .env.example .env.local
```

The landing page and its build do not require Supabase credentials. When connecting a Supabase project, set:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

These are public client configuration values, not service-role secrets. Never put a service-role key in a `NEXT_PUBLIC_` variable or commit real credentials.

Start the development server:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```powershell
npm run lint
npx tsc --noEmit
npm run build
```

## Project map

- `app/` — App Router layout, landing page, and global styles
- `components/ui/` — initialized shadcn/ui components
- `lib/supabase/` — server, browser, and request-session Supabase SSR clients
- `AGENTS.md` — repository-wide development rules
- `.github/copilot-instructions.md` — Copilot-specific entry point to those rules

## Supabase and shadcn/ui

The app was scaffolded from the official Supabase `with-supabase` Next.js starter. It includes the official `@supabase/ssr` client pattern and initialized shadcn/ui configuration in `components.json`. Supabase session refresh is skipped until both public environment variables are set.

See the [Supabase Next.js SSR guide](https://supabase.com/docs/guides/auth/server-side/nextjs) and the [shadcn/ui Next.js guide](https://ui.shadcn.com/docs/installation/next) for future configuration or component additions.
