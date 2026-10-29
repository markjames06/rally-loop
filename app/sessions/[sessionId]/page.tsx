import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CircleDot,
  MapPin,
  UsersRound,
} from "lucide-react";
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
        <main className="app-page mx-auto min-h-screen max-w-5xl px-1 sm:px-4">
          <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">
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
  if (authError) {
    console.error("Could not verify the current user for the session queue.", authError.code);
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
  const [queueResult, matchesResult] =
    summary && authData.user
      ? await Promise.all([
          loadSessionQueue(supabase, sessionId, authData.user.id),
          loadSessionMatches(supabase, sessionId),
        ])
      : [null, null];

  return (
    <AppShell
      managementHref={managementHref}
      user={authData.user ? { email: authData.user.email } : null}
    >
    <main className="app-page mx-auto min-h-screen max-w-5xl px-1 sm:px-4">
      <div className="mt-6">
        <SessionRealtime
          sessionIds={authData.user && !authError ? [sessionId] : []}
        />
      </div>
      {result.data === null ? (
        <p
          className="mt-10 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-5 text-sm text-rose-100"
          role="alert"
        >
          Session details could not be loaded. Refresh the page to try again.
        </p>
      ) : summary ? (
        <article className="py-10">
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-lime-300 transition hover:text-lime-200"
            href="/sessions"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            All open sessions
          </Link>
          <p className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#eaf3e7] px-3 py-1.5 text-xs font-semibold text-[#285b3a]">
            <CircleDot aria-hidden="true" className="size-3.5" />
            {summary.sport.name} · Open session
          </p>
          <h1 className="mt-4">
            {summary.session.name}
          </h1>
          <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70">
            <div className="flex items-center gap-3 border-b border-white/10 bg-[#f3f5ef] px-5 py-4 sm:px-7">
              <span className="grid size-10 place-items-center rounded-xl bg-[#e3edd2] text-[#45602c]">
                <MapPin aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="font-bold">{summary.facility.name}</h2>
                {summary.facility.address ? (
                  <p className="mt-0.5 text-sm text-slate-400">
                    {summary.facility.address}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="p-5 sm:p-7">
              <p className="inline-flex items-center gap-2 text-sm text-slate-300">
                <CalendarClock
                  aria-hidden="true"
                  className="size-4 text-[#52732f]"
                />
                <span className="font-semibold text-white">Starts:</span>{" "}
                <time dateTime={summary.session.starts_at}>
                  {formatFacilityDateTime(
                    summary.session.starts_at,
                    summary.facility.timezone,
                  )}
                </time>
              </p>
              {summary.session.ends_at ? (
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-300">
                  <CalendarClock
                    aria-hidden="true"
                    className="size-4 text-[#52732f]"
                  />
                  <span className="font-semibold text-white">Ends:</span>{" "}
                  <time dateTime={summary.session.ends_at}>
                    {formatFacilityDateTime(
                      summary.session.ends_at,
                      summary.facility.timezone,
                    )}
                  </time>
                </p>
              ) : null}
              <p className="mt-2 text-sm text-slate-400">
                Facility timezone: {summary.facility.timezone}
              </p>
              <dl className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
                <div className="rounded-xl bg-[#f3f5ef] p-4">
                  <dt className="text-sm font-medium text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <UsersRound aria-hidden="true" className="size-3.5" />
                      Players per match
                    </span>
                  </dt>
                  <dd className="mt-1 text-white">
                    {summary.session.players_per_match}
                  </dd>
                </div>
                <div className="rounded-xl bg-[#f3f5ef] p-4">
                  <dt className="text-sm font-medium text-slate-400">
                    Queue policy
                  </dt>
                  <dd className="mt-1 text-white">First in, first out (FIFO)</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Courts in this session</h2>
            {summary.courts.length ? (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {summary.courts.map((court) => (
                  <li
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                    key={court.id}
                  >
                    <p className="font-semibold text-white">{court.name}</p>
                    <p className="inline-flex items-center gap-2 text-sm text-slate-400">
                      <span className="size-2 rounded-full bg-[#7ea43c]" />
                      Status: {court.status}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                Court information is not available for this session.
              </p>
            )}
          </section>
          {authError ? (
            <p
              className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100"
              role="alert"
            >
              We could not verify your account, so the session queue is
              unavailable. Refresh the page to try again.
            </p>
          ) : queueResult?.data === null ? (
            <p
              className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100"
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
              signedIn={Boolean(authData.user)}
            />
          )}
          {authData.user && !authError ? (
            matchesResult?.data === null ? (
              <p
                className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100"
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
