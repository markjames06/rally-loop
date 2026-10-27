import Link from "next/link";
import { notFound } from "next/navigation";

import { hasEnvVars } from "@/lib/utils";
import { formatFacilityDateTime } from "@/lib/facilities/datetime";
import { isUuid } from "@/lib/facilities/validation";
import { createClient } from "@/lib/supabase/server";
import { loadOpenSession } from "@/lib/sessions/queries";

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
      <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-8">
        <PageHeader />
        <p className="mt-10 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">
          Session details are unavailable until Supabase is configured.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const result = await loadOpenSession(supabase, sessionId);

  if (result.notFound) {
    notFound();
  }

  const summary = result.data?.[0];

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-8">
      <PageHeader />
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
            className="text-sm font-bold text-lime-300 hover:text-lime-200"
            href="/sessions"
          >
            ← All open sessions
          </Link>
          <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.2em] text-lime-300">
            {summary.sport.name} · Open session
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {summary.session.name}
          </h1>
          <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-lg font-bold">{summary.facility.name}</h2>
            {summary.facility.address ? (
              <p className="mt-2 text-sm text-slate-300">
                {summary.facility.address}
              </p>
            ) : null}
            <p className="mt-5 text-sm text-slate-300">
              <span className="font-semibold text-white">Starts:</span>{" "}
              <time dateTime={summary.session.starts_at}>
                {formatFacilityDateTime(
                  summary.session.starts_at,
                  summary.facility.timezone,
                )}
              </time>
            </p>
            {summary.session.ends_at ? (
              <p className="mt-2 text-sm text-slate-300">
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
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Players per match
                </dt>
                <dd className="mt-1 text-white">
                  {summary.session.players_per_match}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Queue policy
                </dt>
                <dd className="mt-1 text-white">First in, first out (FIFO)</dd>
              </div>
            </dl>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Courts in this session</h2>
            {summary.courts.length ? (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {summary.courts.map((court) => (
                  <li
                    className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                    key={court.id}
                  >
                    <p className="font-semibold text-white">{court.name}</p>
                    <p className="mt-1 text-sm text-slate-400">
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
          <p className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
            Queue registration is not available yet. This page is for session
            discovery only.
          </p>
        </article>
      ) : null}
    </main>
  );
}

function PageHeader() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 pb-6">
      <Link className="text-xl font-extrabold tracking-tight" href="/">
        Rally<span className="text-lime-300">Loop</span>
      </Link>
      <Link
        className="text-sm font-bold text-lime-300 hover:text-lime-200"
        href="/sessions"
      >
        Open sessions
      </Link>
    </header>
  );
}
