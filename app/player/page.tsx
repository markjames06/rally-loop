import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { AdminFacilityOverview } from "@/components/facilities/admin-overview";
import { PlayerMatchHistory } from "@/components/matches/match-history";
import { PlayerActiveSessions } from "@/components/player/active-sessions";
import { SessionRealtime } from "@/components/realtime/session-realtime";
import { requireAuthenticatedUser } from "@/server/auth/guards";
import { loadMyMatchHistory } from "@/server/matches/queries";
import { loadSessionQueue } from "@/server/queue/queries";
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
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("queue_entries")
      .select("session_id, status")
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
  const adminMembership = visibleMemberships.find(
    (membership) => membership.role === "admin",
  );
  if (adminMembership) {
    const [facilityResult, sessionsResult, courtsResult] = await Promise.all([
      supabase
        .from("facilities")
        .select("id, name, address, timezone")
        .eq("id", adminMembership.facility_id)
        .maybeSingle(),
      supabase
        .from("sessions")
        .select("id, name, status, starts_at")
        .eq("facility_id", adminMembership.facility_id)
        .in("status", ["open", "paused"])
        .order("starts_at", { ascending: true }),
      supabase
        .from("courts")
        .select("id, status")
        .eq("facility_id", adminMembership.facility_id),
    ]);
    if (facilityResult.error) {
      console.error("Could not load the admin facility overview.", facilityResult.error.code);
    }
    if (sessionsResult.error) {
      console.error("Could not load sessions for the admin overview.", sessionsResult.error.code);
    }
    if (courtsResult.error) {
      console.error("Could not load courts for the admin overview.", courtsResult.error.code);
    }
    return (
      <AppShell
        facilityName={facilityResult.data?.name}
        managementHref={`/management/${adminMembership.facility_id}`}
        managementRole="admin"
        user={{ name: profile?.display_name, email: user.email }}
      >
        <AdminFacilityOverview
          courts={courtsResult.data ?? []}
          facility={facilityResult.data}
          loadError={Boolean(facilityResult.error || sessionsResult.error || courtsResult.error)}
          reason={reason}
          sessions={sessionsResult.data ?? []}
        />
      </AppShell>
    );
  }
  const activeSessionIds = [
    ...new Set((activeQueueEntries ?? []).map((entry) => entry.session_id)),
  ];
  const [activeSessionsResult, waitingQueueResults] = await Promise.all([
    activeSessionIds.length
      ? supabase
          .from("sessions")
          .select("id, name, status, starts_at, facility_id")
          .in("id", activeSessionIds)
      : Promise.resolve({ data: [], error: null }),
    Promise.all(
      (activeQueueEntries ?? [])
        .filter((entry) => entry.status === "waiting")
        .map(async (entry) => ({
          sessionId: entry.session_id,
          result: await loadSessionQueue(supabase, entry.session_id, user.id),
        })),
    ),
  ]);
  if (activeSessionsResult.error) {
    console.error(
      "Could not load the current user's active session details.",
      activeSessionsResult.error.code,
    );
  }

  const activeSessions = activeSessionsResult.data ?? [];
  const facilityIds = [...new Set(activeSessions.map((session) => session.facility_id))];
  const facilitiesResult = facilityIds.length
    ? await supabase
        .from("facilities")
        .select("id, name, timezone")
        .in("id", facilityIds)
    : { data: [], error: null };
  if (facilitiesResult.error) {
    console.error(
      "Could not load facility details for the current user's active sessions.",
      facilitiesResult.error.code,
    );
  }
  const facilitiesById = new Map(
    (facilitiesResult.data ?? []).map((facility) => [facility.id, facility]),
  );
  const activeSessionDetailsUnavailable =
    activeSessionsResult.error !== null ||
    activeSessions.length !== activeSessionIds.length ||
    activeSessions.some((session) => !facilitiesById.has(session.facility_id));
  const waitingQueueBySessionId = new Map(
    waitingQueueResults.map(({ sessionId, result }) => [
      sessionId,
      result.data,
    ]),
  );
  const activeMatchBySessionId = new Map(
    (matchHistoryResult.data ?? [])
      .filter(
        (match) =>
          match.status === "assigned" || match.status === "in_progress",
      )
      .map((match) => [match.session_id, match]),
  );
  const activeSessionCards = activeSessions.flatMap((session) => {
    const facility = facilitiesById.get(session.facility_id);
    if (!facility) return [];
    const queue = waitingQueueBySessionId.get(session.id);
    const match = activeMatchBySessionId.get(session.id);
    const queueEntry = (activeQueueEntries ?? []).find(
      (entry) => entry.session_id === session.id,
    );
    return [{
      session,
      facility,
      queuePosition:
        queue?.entries.find((entry) => entry.isCurrentUser)?.position ?? null,
      queueUnavailable:
        queueEntry?.status === "waiting" &&
        (queue === null || queue === undefined),
      queueStatus: queueEntry?.status,
      match,
    }];
  }).sort((left, right) => {
    const leftPriority = left.match?.status === "in_progress"
      ? 0
      : left.match?.status === "assigned" || left.queueStatus === "assigned"
        ? 1
        : 2;
    const rightPriority = right.match?.status === "in_progress"
      ? 0
      : right.match?.status === "assigned" || right.queueStatus === "assigned"
        ? 1
        : 2;
    return leftPriority - rightPriority;
  });

  return (
    <AppShell
      managementHref={visibleMemberships[0] ? `/management/${visibleMemberships[0].facility_id}` : null}
      managementRole={visibleMemberships[0] && isFacilityRole(visibleMemberships[0].role) ? visibleMemberships[0].role : null}
      user={{ name: profile?.display_name, email: user.email }}
    >
    <main className="app-page player-page mx-auto min-h-screen max-w-5xl px-1 sm:px-4">
      <section className="player-overview">
        <div className="player-heading">
          <div>
            <h1>
              {profile?.display_name ? `${profile.display_name}’s court` : "Your court"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Find a game, follow your place in line, and get back on court.
            </p>
            <p className="player-account-meta mt-2">
              Signed in as {user.email ?? "your account"}.
            </p>
          </div>
          <Link className="player-primary-action" href="/sessions">
            Browse open sessions
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="player-live-area">
          {activeQueueEntriesError ||
          activeSessionDetailsUnavailable ||
          facilitiesResult.error ? (
            <p className="player-feedback player-feedback-error" role="alert">
              Your session status could not load. Refresh this page or open
              Sessions to find your session.
            </p>
          ) : activeSessionCards.length ? (
            <PlayerActiveSessions sessions={activeSessionCards} />
          ) : (
            <div className="player-next-session">
              <div>
                <h2>No active session yet</h2>
                <p>Choose an open session to see the courts and join its queue.</p>
              </div>
              <Link className="player-text-link" href="/sessions">
                Find a session <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          )}
        </div>

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
            className="player-feedback player-feedback-error mt-6"
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
          <section aria-labelledby="player-facility-access-heading" className="player-secondary-section mt-10">
            <h2 className="inline-flex items-center gap-2 text-lg font-bold" id="player-facility-access-heading">
              <ShieldCheck aria-hidden="true" className="size-5 text-[#52732f]" />
              Facility access
            </h2>
            <ul className="player-access-list mt-4">
              {visibleMemberships.map(({ facility_id, role }) => (
                <li
                  className="player-access-row"
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
          </section>
        ) : null}
      </section>
    </main>
    </AppShell>
  );
}
