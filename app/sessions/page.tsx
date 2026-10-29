import { CircleDot } from "lucide-react";

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
    console.error("Could not verify the current user for session navigation.", authError.code);
  }
  const membershipResult = authData.user
    ? await supabase
        .from("facility_members")
        .select("facility_id, role")
        .eq("user_id", authData.user.id)
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
      user={authData.user ? { email: authData.user.email } : null}
    >
    <main className="app-page mx-auto min-h-screen max-w-6xl px-1 sm:px-4">
      <section className="py-10 sm:py-12">
        <p className="inline-flex items-center gap-2 rounded-md bg-[#eaf3e7] px-3 py-1.5 text-xs font-semibold text-[#285b3a]">
          <CircleDot aria-hidden="true" className="size-3.5" />
          Find your next game
        </p>
        <h1 className="mt-4">Open sessions</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Browse active sessions, find a game, and follow queue and match
          updates as they happen.
        </p>

        {result.data === null ? (
          <p
            className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-5 text-sm text-rose-100"
            role="alert"
          >
            Open sessions could not be loaded. Refresh the page to try again.
          </p>
        ) : result.data.length === 0 ? (
          <div className="mt-8 rounded-xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="font-semibold text-white">No open sessions right now</h2>
            <p className="mt-2 text-sm text-slate-400">
              Check back later or ask your facility administrator about the
              next session.
            </p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-5 md:grid-cols-2">
            {result.data.map((summary) => (
              <li key={summary.session.id}>
                <SessionCard summary={summary} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
    </AppShell>
  );
}
