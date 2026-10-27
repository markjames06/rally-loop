# RallyLoop Repository Instructions

## Product baseline and scope

- Read `RALLYLOOP_IMPLEMENTATION_PLAN.md` before planning or implementing product work. It is the product baseline.
- Work phase by phase and feature by feature. Implement only the task the user approved; do not build multiple phases or the whole app at once.
- The current approved scope includes Phases 1–6: authentication and roles, facility settings/sports/courts/sessions, transactional queue operations, court/match lifecycle, session-scoped Realtime updates, and QA/accessibility/security hardening. Do not start Phase 7 deployment or pilot work without approval.
- Do not add another backend, database, framework, or service without the user's approval.
- Preserve existing files and working behavior. Inspect the relevant code and instructions before editing; do not overwrite or remove user content.

## Engineering and security

- Use the existing Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, and Supabase setup. Prefer existing patterns and minimal dependencies.
- Keep TypeScript strict. Avoid `any`, unsafe casts, silent fallbacks, and broad error catches.
- Enforce authorization in trusted server-side code and Supabase RLS, not only in the UI. Never trust a client-supplied identity or role.
- Facility roles are granted only through trusted administrative provisioning. Never add a user-facing path that lets an account assign or change its own `facility_members.role`.
- Keep service-role keys server-only. Commit placeholders in `.env.example`, never real secrets.
- Critical queue and match operations must use trusted transactional database/server-side operations when those phases are approved.
- Treat Supabase Realtime only as an invalidation signal: broadcast minimal session/table/operation metadata, then reload authoritative data through existing server queries and RPCs. Keep session channel authorization scoped to open sessions or the facility's staff/admin members; never expose match rows or staff notes in event payloads.
- Run end-to-end tests only against an isolated Supabase project with dedicated test accounts and disposable session data. Never use production credentials or real player data in automated tests.
- Add or update focused tests for behavior changes. Preserve accessible labels, keyboard support, responsive behavior, and clear loading/error states.

## Validation and reporting

- Run the narrowest relevant tests and checks. For foundation changes, run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- Do not claim checks passed unless they were run. Report changed files, validation results, assumptions, and remaining manual setup.
- Update product documentation when an approved change affects product behavior, data, or architecture.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
