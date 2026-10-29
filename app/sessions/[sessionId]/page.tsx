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
    <main className="app-page session-detail-page mx-auto min-h-screen max-w-5xl px-1 sm:px-4">
      <div className="mt-6">
        {user ? <SessionRealtime sessionIds={[sessionId]} /> : null}
      </div>
      {result.data === null ? (
        <p
          className="mt-10 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"
          role="alert"
        >
          Session details could not be loaded. Refresh the page to try again.
        </p>
      ) : summary ? (
        <article className="session-detail">
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-[#39764d] transition hover:text-[#39764d]"
            href="/sessions"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            All open sessions
          </Link>
          <div className="session-detail-title-row">
            <div>
              <p className="session-detail-kicker">{summary.sport.name} · Open session</p>
              <h1>
            {summary.session.name}
              </h1>
            </div>
            <span className="session-detail-open"><span aria-hidden="true" /> Queue open</span>
          </div>
          <section className="session-facility-panel">
            <div className="session-facility-heading">
              <div>
                <h2 className="font-bold">{summary.facility.name}</h2>
                {summary.facility.address ? (
                  <p className="mt-0.5 text-sm text-[#657268]">
                    {summary.facility.address}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="session-facility-body">
              <p className="inline-flex items-center gap-2 text-sm text-[#46554b]">
                <CalendarClock
                  aria-hidden="true"
                  className="size-4 text-[#52732f]"
                />
                <span className="font-semibold text-[#20352a]">Starts:</span>{" "}
                <time dateTime={summary.session.starts_at}>
                  {formatFacilityDateTime(
                    summary.session.starts_at,
                    summary.facility.timezone,
                  )}
                </time>
              </p>
              {summary.session.ends_at ? (
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-[#46554b]">
                  <CalendarClock
                    aria-hidden="true"
                    className="size-4 text-[#52732f]"
                  />
                  <span className="font-semibold text-[#20352a]">Ends:</span>{" "}
                  <time dateTime={summary.session.ends_at}>
                    {formatFacilityDateTime(
                      summary.session.ends_at,
                      summary.facility.timezone,
                    )}
                  </time>
                </p>
              ) : null}
              <p className="mt-2 text-sm text-[#657268]">
                Facility timezone: {summary.facility.timezone}
              </p>
              <dl className="session-detail-facts">
                <div>
                  <dt className="text-sm font-medium text-[#657268]">
                    <span className="inline-flex items-center gap-2">
                      <UsersRound aria-hidden="true" className="size-3.5" />
                      Players per match
                    </span>
                  </dt>
                  <dd className="mt-1 text-[#20352a]">
                    {summary.session.players_per_match}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[#657268]">
                    Queue policy
                  </dt>
                  <dd className="mt-1 text-[#20352a]">First in, first out (FIFO)</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="session-courts-section">
            <h2 className="text-xl font-bold">Courts in this session</h2>
            {summary.courts.length ? (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {summary.courts.map((court) => (
                  <li
                    className="session-court-row"
                    key={court.id}
                  >
                    <p className="font-semibold text-[#20352a]">{court.name}</p>
                    <p className={`session-court-status is-${court.status}`}>
                      <span aria-hidden="true" /> {court.status}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[#657268]">
                Court information is not available for this session.
              </p>
            )}
          </section>
          {accountError ? (
            <p
              className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
              role="alert"
            >
              We could not verify your account, so the session queue is
              unavailable. Refresh the page to try again.
            </p>
          ) : queueResult?.data === null ? (
            <p
              className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
              role="alert"
            >
              The session queue could not be loaded. Refresh the page to try
              again.
            </p>
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
          {user ? (
            matchesResult?.data === null ? (
              <p
                className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
                role="alert"
              >
                Match history could not be loaded. Refresh the page to try again.
              </p>
            ) : matchesResult ? (
              <SessionMatchHistory
                matches={matchesResult.data ?? []}
                timezone={summary.facility.timezone}
              />
            ) : null
          ) : null}
        </article>
      ) : null}
    </main>
    </AppShell>
  );
}
