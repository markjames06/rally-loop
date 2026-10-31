import Link from "next/link";
import { ArrowLeft, CalendarClock, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { hasEnvVars } from "@/shared/lib/utils";
import { formatFacilityDateTime } from "@/shared/facilities/datetime";
import { isUuid } from "@/shared/facilities/validation";
import { QueuePanel } from "@/components/queue/queue-panel";
import { SessionMatchHistory } from "@/components/matches/match-history";
import { SessionRealtime } from "@/components/realtime/session-realtime";
import { canJoinQueue } from "@/shared/queue/rules";
import { loadSessionQueue } from "@/server/queue/queries";
import { loadSessionMatches } from "@/server/matches/queries";
import { createClient } from "@/server/supabase/server";
import { loadOpenSession } from "@/server/sessions/queries";
import { isFacilityRole } from "@/shared/auth/roles";

export const dynamic = "force-dynamic";

type SessionPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SessionPage({ params }: SessionPageProps) {
  const { sessionId } = await params;
  if (!isUuid(sessionId)) {
    notFound();
  }

  if (!hasEnvVars) {
    return (
      <AppShell>
        <main className="app-page session-detail-page mx-auto min-h-screen max-w-5xl px-1 sm:px-4">
          <p className="player-feedback player-feedback-warn mt-4" role="status">
            Session details are unavailable until Supabase is configured.
          </p>
        </main>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const result = await loadOpenSession(supabase, sessionId);

  if (result.notFound) {
    notFound();
  }

  const summary = result.data?.[0];
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const isUnauthenticated = authError?.name === "AuthSessionMissingError";
  const accountError = Boolean(authError && !isUnauthenticated);
  if (accountError) {
    console.warn("Could not verify the current user for the session queue.", authError?.message);
  }
  const user = accountError ? null : authData.user;
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
  const [queueResult, matchesResult] =
    summary && user
      ? await Promise.all([
          loadSessionQueue(supabase, sessionId, user.id),
          loadSessionMatches(supabase, sessionId),
        ])
      : [null, null];

  return (
    <AppShell
      managementHref={managementHref}
      managementRole={membership && isFacilityRole(membership.role) ? membership.role : null}
      user={user ? { email: user.email } : null}
    >
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          {user ? <SessionRealtime sessionIds={[sessionId]} /> : null}
        </div>
        {result.data === null ? (
          <div
            className="rounded-md border p-6 text-sm"
            style={{ borderColor: 'var(--negative)', backgroundColor: 'var(--pill-negative-bg)', color: 'var(--pill-negative-ink)' }}
            role="alert"
          >
            Session details could not be loaded. Refresh the page to try again.
          </div>
        ) : summary ? (
          <article className="space-y-8">
            {/* Header / Breadcrumb */}
            <div className="space-y-4">
              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                style={{ color: 'var(--accent-ink)' }}
                href="/sessions"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                All open sessions
              </Link>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-ink)' }}>
                      {summary.sport.name}
                    </span>
                    <span style={{ color: 'var(--control)' }}>•</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Open Session</span>
                  </div>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: 'var(--text)' }}>
                    {summary.session.name}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-ink)', borderColor: 'var(--accent-track)' }}>
                    <span className="relative flex h-2 w-2" aria-hidden="true">
                      <span aria-hidden="true" className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--accent)' }} />
                      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    </span>
                    Queue open
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content Layout: 2 Columns on Desktop */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Primary Column: Queue Operations (Fitts's Law priority) */}
              <div className="space-y-8 lg:col-span-7">
                {accountError ? (
                  <div
                    className="rounded-md border p-5 text-sm"
                    style={{ borderColor: 'var(--negative)', backgroundColor: 'var(--pill-negative-bg)', color: 'var(--pill-negative-ink)' }}
                    role="alert"
                  >
                    We could not verify your account, so the session queue is unavailable. Refresh the page to try again.
                  </div>
                ) : queueResult?.data === null ? (
                  <div
                    className="rounded-md border p-5 text-sm"
                    style={{ borderColor: 'var(--negative)', backgroundColor: 'var(--pill-negative-bg)', color: 'var(--pill-negative-ink)' }}
                    role="alert"
                  >
                    The session queue could not be loaded. Refresh the page to try again.
                  </div>
                ) : (
                  <QueuePanel
                    canJoin={canJoinQueue(summary.session.status)}
                    entries={queueResult?.data?.entries ?? []}
                    myEntry={queueResult?.data?.myEntry ?? null}
                    sessionId={sessionId}
                    signedIn={Boolean(user)}
                    timezone={summary.facility.timezone}
                  />
                )}
              </div>

              {/* Secondary Column: Facility Info, Courts, Session Facts */}
              <div className="space-y-6 lg:col-span-5">
                {/* Facility & Time Card */}
                <section className="rounded-md border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                  <div className="border-b pb-4" style={{ borderColor: 'var(--rule)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Host facility</p>
                    <h2 className="mt-1 text-lg font-bold" style={{ color: 'var(--text)' }}>{summary.facility.name}</h2>
                    {summary.facility.address ? (
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>{summary.facility.address}</p>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--muted)' }}>
                      <CalendarClock aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--accent)' }} />
                      <div>
                        <span className="font-medium" style={{ color: 'var(--text)' }}>Starts: </span>
                        <time dateTime={summary.session.starts_at}>
                          {formatFacilityDateTime(summary.session.starts_at, summary.facility.timezone)}
                        </time>
                      </div>
                    </div>

                    {summary.session.ends_at ? (
                      <div className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--muted)' }}>
                        <CalendarClock aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--accent)' }} />
                        <div>
                          <span className="font-medium" style={{ color: 'var(--text)' }}>Ends: </span>
                          <time dateTime={summary.session.ends_at}>
                            {formatFacilityDateTime(summary.session.ends_at, summary.facility.timezone)}
                          </time>
                        </div>
                      </div>
                    ) : null}

                    <div className="pt-2 text-xs" style={{ color: 'var(--control)' }}>
                      Facility timezone: {summary.facility.timezone}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4" style={{ borderColor: 'var(--rule)' }}>
                    <div className="rounded-md p-3" style={{ backgroundColor: 'var(--raised)' }}>
                      <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>
                        <UsersRound aria-hidden="true" className="size-3.5" style={{ color: 'var(--control)' }} />
                        <span>Players/match</span>
                      </div>
                      <div className="mt-1 text-lg font-bold" style={{ color: 'var(--text)' }}>
                        {summary.session.players_per_match}
                      </div>
                    </div>
                    <div className="rounded-md p-3" style={{ backgroundColor: 'var(--raised)' }}>
                      <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Queue policy</div>
                      <div className="mt-1 text-sm font-bold" style={{ color: 'var(--text)' }}>FIFO Order</div>
                    </div>
                  </div>
                </section>

                {/* Courts in Session Card */}
                <section className="rounded-md border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                  <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--rule)' }}>
                    <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Courts in this session</h2>
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-ink)' }}>
                      {summary.courts.length} {summary.courts.length === 1 ? "court" : "courts"}
                    </span>
                  </div>

                  {summary.courts.length ? (
                    <ul className="mt-4 space-y-2.5">
                      {summary.courts.map((court) => {
                        const isAvailable = court.status === "available";
                        const isInUse = court.status === "occupied";
                        return (
                          <li
                            key={court.id}
                            className="flex items-center justify-between rounded-md border px-3.5 py-2.5 transition hover:bg-white"
                            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)' }}
                          >
                            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{court.name}</span>
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                              style={{
                                backgroundColor: isAvailable
                                  ? 'var(--pill-positive-bg)'
                                  : isInUse
                                    ? 'var(--pill-warning-bg)'
                                    : 'var(--pill-neutral-bg)',
                                color: isAvailable
                                  ? 'var(--pill-positive-ink)'
                                  : isInUse
                                    ? 'var(--pill-warning-ink)'
                                    : 'var(--pill-neutral-ink)'
                              }}
                            >
                              {court.status.replace("_", " ")}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                      Court information is not available for this session.
                    </p>
                  )}
                </section>
              </div>
            </div>

            {/* Match History Row below if user signed in */}
            {user ? (
              matchesResult?.data === null ? (
                <div
                  className="rounded-md border p-4 text-sm"
                  style={{ borderColor: 'var(--negative)', backgroundColor: 'var(--pill-negative-bg)', color: 'var(--pill-negative-ink)' }}
                  role="alert"
                >
                  Match history could not be loaded. Refresh the page to try again.
                </div>
              ) : matchesResult ? (
                <div className="pt-4 border-t" style={{ borderColor: 'var(--rule)' }}>
                  <SessionMatchHistory
                    matches={matchesResult.data ?? []}
                    timezone={summary.facility.timezone}
                  />
                </div>
              ) : null
            ) : null}
          </article>
        ) : null}
      </main>
    </AppShell>
  );
}
