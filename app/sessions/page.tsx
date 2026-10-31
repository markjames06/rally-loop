import { AppShell } from "@/components/layout/app-shell";
import { SessionCard } from "@/components/sessions/session-card";
import { hasEnvVars } from "@/shared/lib/utils";
import { createClient } from "@/server/supabase/server";
import { loadOpenSessions } from "@/server/sessions/queries";
import { isFacilityRole } from "@/shared/auth/roles";
import { CircleDot } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  if (!hasEnvVars) {
    return (
      <AppShell>
        <main className="app-page mx-auto min-h-screen max-w-6xl px-1 sm:px-4">
          <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">
            Open sessions will appear here after Supabase is configured and the
            Phase 2 migration is applied.
          </p>
        </main>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.warn("Could not verify the current user for session navigation.", authError.message);
  }
  const user = authError ? null : authData.user;
  const membershipResult = user
    ? await supabase
        .from("facility_members")
        .select("facility_id, role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()
    : null;
  if (membershipResult?.error) {
    console.error("Could not load facility navigation access.", membershipResult.error.code);
  }
  const membership = membershipResult?.data;
  const managementHref = membership && isFacilityRole(membership.role)
    ? `/management/${membership.facility_id}`
    : null;
  const result = await loadOpenSessions(supabase);

  return (
    <AppShell
      managementHref={managementHref}
      managementRole={membership && isFacilityRole(membership.role) ? membership.role : null}
      user={user ? { email: user.email } : null}
    >
      <main className="app-page open-sessions-page mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-8">
        <section className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 pb-6 border-b sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: 'var(--rule)' }}>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ borderColor: 'var(--accent-track)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-ink)' }}>
                  <span aria-hidden="true" className="size-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                  Community Play
                </span>
                <span style={{ color: 'var(--control)' }}>·</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Open sessions</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: 'var(--text)' }}>
                Find your next game
              </h1>
              <p className="mt-1 text-sm max-w-xl" style={{ color: 'var(--muted)' }}>
                Browse active sessions, find a game, and follow queue and match updates as they happen.
              </p>
            </div>
            {result.data && result.data.length > 0 ? (
              <span className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-ink)' }}>
                {result.data.length} {result.data.length === 1 ? "active session" : "active sessions"}
              </span>
            ) : null}
          </div>

          {result.data === null ? (
            <div className="rounded-md border p-5 text-sm" style={{ borderColor: 'var(--negative)', backgroundColor: 'var(--pill-negative-bg)', color: 'var(--pill-negative-ink)' }} role="alert">
              Open sessions could not be loaded. Refresh the page to try again.
            </div>
          ) : result.data.length === 0 ? (
            <div className="rounded-md border p-12 text-center" style={{ borderColor: 'var(--border)', borderStyle: 'dashed', backgroundColor: 'var(--surface)' }}>
              <div className="mx-auto flex size-12 items-center justify-center rounded-md" style={{ backgroundColor: 'var(--raised)', color: 'var(--control)' }}>
                <CircleDot aria-hidden="true" className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-bold" style={{ color: 'var(--text)' }}>No open sessions right now</h2>
              <p className="mt-1 text-sm max-w-sm mx-auto" style={{ color: 'var(--muted)' }}>
                Check back later or ask your facility administrator about the next session.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
                  Open For Play
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {result.data.map((summary) => (
                  <SessionCard key={summary.session.id} summary={summary} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
