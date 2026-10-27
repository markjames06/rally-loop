# RallyLoop Repository Instructions

## Product baseline and scope

- Read `RALLYLOOP_IMPLEMENTATION_PLAN.md` before planning or implementing product work. It is the product baseline.
- Work phase by phase and feature by feature. Implement only the task the user approved; do not build multiple phases or the whole app at once.
- The current codebase is the Phase 0 foundation. Do not add authentication flows, dashboards, database schema, queue operations, or match functionality unless a later task explicitly requests them.
- Do not add another backend, database, framework, or service without the user's approval.
- Preserve existing files and working behavior. Inspect the relevant code and instructions before editing; do not overwrite or remove user content.

## Engineering and security

- Use the existing Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, and Supabase setup. Prefer existing patterns and minimal dependencies.
- Keep TypeScript strict. Avoid `any`, unsafe casts, silent fallbacks, and broad error catches.
- Enforce authorization in trusted server-side code and Supabase RLS, not only in the UI. Never trust a client-supplied identity or role.
- Keep service-role keys server-only. Commit placeholders in `.env.example`, never real secrets.
- Critical queue and match operations must use trusted transactional database/server-side operations when those phases are approved.
- Add or update focused tests for behavior changes. Preserve accessible labels, keyboard support, responsive behavior, and clear loading/error states.

## Validation and reporting

- Run the narrowest relevant tests and checks. For foundation changes, run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- Do not claim checks passed unless they were run. Report changed files, validation results, assumptions, and remaining manual setup.
- Update product documentation when an approved change affects product behavior, data, or architecture.
