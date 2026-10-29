import Link from "next/link";
import { ArrowRight, CircleDot, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PlayerMatchHistory } from "@/components/matches/match-history";
import { SessionRealtime } from "@/components/realtime/session-realtime";
import { requireAuthenticatedUser } from "@/server/auth/guards";
import { loadMyMatchHistory } from "@/server/matches/queries";
import { isFacilityRole } from "@/shared/auth/roles";

export const dynamic = "force-dynamic";

type PlayerPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function PlayerPage({ searchParams }: PlayerPageProps) {
  const { user, supabase } = await requireAuthenticatedUser("/player");
  const { reason } = await searchParams;
  const [
    { data: profile, error: profileError },
    { data: memberships, error: membershipError },
    { data: activeQueueEntries, error: activeQueueEntriesError },
    matchHistoryResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("facility_members")
      .select("facility_id, role")
      .eq("user_id", user.id),
    supabase
      .from("queue_entries")
      .select("session_id")
      .eq("player_id", user.id)
      .in("status", ["waiting", "assigned"]),
    loadMyMatchHistory(supabase),
  ]);

  if (profileError) {
    console.error("Could not load the current profile.", profileError.code);
  }
  if (membershipError) {
    console.error(
      "Could not load the current user's facility memberships.",
      membershipError.code,
    );
  }
  if (activeQueueEntriesError) {
    console.error(
      "Could not load the current user's active queue sessions.",
      activeQueueEntriesError.code,
    );
  }

  const visibleMemberships =
    memberships?.filter((membership) => isFacilityRole(membership.role)) ?? [];

  return (
    <AppShell
      managementHref={visibleMemberships[0] ? `/management/${visibleMemberships[0].facility_id}` : null}
      user={{ name: profile?.display_name, email: user.email }}
    >
    <main className="app-page mx-auto min-h-screen max-w-5xl px-1 sm:px-4">
      <section className="py-12">
        <p className="inline-flex items-center gap-2 rounded-md bg-[#eaf3e7] px-3 py-1.5 text-xs font-semibold text-[#285b3a]">
          <CircleDot aria-hidden="true" className="size-3.5" />
          Player space
        </p>
        <h1 className="mt-3">
          {profile?.display_name
            ? `Good to see you, ${profile.display_name}`
            : "Your RallyLoop account"}
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Signed in as {user.email ?? "your account"}.
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-lime-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-lime-200"
          href="/sessions"
        >
          Browse open sessions
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        <div className="mt-6">
          <SessionRealtime
            sessionIds={
              [
                ...(activeQueueEntries ?? []).map((entry) => entry.session_id),
                ...(matchHistoryResult.data
                  ?.filter(
                    (match) =>
                      match.status === "assigned" ||
                      match.status === "in_progress",
                  )
                  .map((match) => match.session_id) ?? []),
              ]
            }
          />
        </div>

        {activeQueueEntriesError ? (
          <p
            className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            Live updates could not be configured for your active queues.
            Refresh this page to try again.
          </p>
        ) : null}

        {profileError || !profile ? (
          <p
            className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            We could not load your profile. Refresh the page or contact the
            facility administrator.
          </p>
        ) : null}
        {membershipError ? (
          <p
            className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            We could not check your facility access. Refresh the page to try
            again.
          </p>
        ) : null}
        {matchHistoryResult.data === null ? (
          <p
            className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            We could not load your match history. Refresh the page to try again.
          </p>
        ) : (
          <PlayerMatchHistory matches={matchHistoryResult.data} />
        )}
        {reason === "forbidden" ? (
          <p
            className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
            role="status"
          >
            You do not have staff or administrator access to that facility.
          </p>
        ) : null}
        {reason === "authorization" ? (
          <p
            className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            Facility access could not be verified. Please try again.
          </p>
        ) : null}
        {reason === "signout" ? (
          <p
            className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            Sign-out did not complete. Please try again.
          </p>
        ) : null}

        {visibleMemberships.length > 0 ? (
          <div className="mt-10">
            <h2 className="inline-flex items-center gap-2 text-lg font-bold text-white">
              <ShieldCheck aria-hidden="true" className="size-5 text-[#52732f]" />
              Facility access
            </h2>
            <ul className="mt-4 space-y-3">
              {visibleMemberships.map(({ facility_id, role }) => (
                <li
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:flex-row sm:items-center"
                  key={facility_id}
                >
                  <span className="text-sm text-slate-300">
                    {role === "admin" ? "Administrator" : "Staff"} access
                  </span>
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-bold text-lime-300 hover:text-lime-200"
                    href={`/management/${facility_id}`}
                  >
                    Open management access
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
    </AppShell>
  );
}
