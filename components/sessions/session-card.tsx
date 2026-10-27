import Link from "next/link";

import { formatFacilityDateTime } from "@/shared/facilities/datetime";
import type { SessionSummary } from "@/server/sessions/queries";

export function SessionCard({ summary }: { summary: SessionSummary }) {
  const { session, facility, sport, courts } = summary;

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 transition hover:border-lime-300/30 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-lime-300">
            {sport.name}
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">{session.name}</h2>
          <p className="mt-1 text-sm text-slate-400">{facility.name}</p>
        </div>
        <span className="rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-xs font-bold text-lime-200">
          Open
        </span>
      </div>
      <p className="mt-5 text-sm text-slate-300">
        <time dateTime={session.starts_at}>
          {formatFacilityDateTime(session.starts_at, facility.timezone)}
        </time>
        <span className="text-slate-500"> · {facility.timezone}</span>
      </p>
      <p className="mt-2 text-sm text-slate-400">
        {courts.length} {courts.length === 1 ? "court" : "courts"} ·{" "}
        {session.players_per_match} players per match · FIFO queue
      </p>
      {facility.address ? (
        <p className="mt-2 text-sm text-slate-400">{facility.address}</p>
      ) : null}
      <Link
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-lime-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        href={`/sessions/${session.id}`}
      >
        View session
      </Link>
    </article>
  );
}
