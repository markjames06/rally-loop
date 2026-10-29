import { AppShell } from "@/components/layout/app-shell";
import { SessionCard } from "@/components/sessions/session-card";
import { hasEnvVars } from "@/shared/lib/utils";
import { createClient } from "@/server/supabase/server";
import { loadOpenSessions } from "@/server/sessions/queries";
import { isFacilityRole } from "@/shared/auth/roles";

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
    <main className="app-page open-sessions-page mx-auto min-h-screen max-w-6xl px-1 sm:px-4">
      <section className="open-sessions-content">
        <div className="open-sessions-heading">
          <div>
            <p className="open-sessions-kicker">RallyLoop · Community play</p>
            <h1>Find your next game</h1>
          </div>
          <p className="open-sessions-intro">
          Browse active sessions, find a game, and follow queue and match
          updates as they happen.
          </p>
        </div>

        {result.data === null ? (
          <p
            className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-5 text-sm text-rose-100"
            role="alert"
          >
            Open sessions could not be loaded. Refresh the page to try again.
          </p>
        ) : result.data.length === 0 ? (
          <div className="open-sessions-empty">
            <h2>No open sessions right now</h2>
            <p className="mt-2 text-sm text-slate-400">
              Check back later or ask your facility administrator about the
              next session.
            </p>
          </div>
        ) : (
          <>
            <div className="open-sessions-list-heading">
              <h2>Playing soon</h2>
              <span>{result.data.length} {result.data.length === 1 ? "session" : "sessions"}</span>
            </div>
            <ul className="open-sessions-list">
            {result.data.map((summary) => (
              <li key={summary.session.id}>
                <SessionCard summary={summary} />
              </li>
            ))}
          </ul>
          </>
        )}
      </section>
    </main>
    </AppShell>
  );
}
