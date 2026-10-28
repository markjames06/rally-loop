import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  MapPin,
  UsersRound,
} from "lucide-react";

import { formatFacilityDateTime } from "@/shared/facilities/datetime";
import type { SessionSummary } from "@/server/sessions/queries";

export function SessionCard({ summary }: { summary: SessionSummary }) {
  const { session, facility, sport, courts } = summary;

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_12px_34px_rgba(27,45,31,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-lime-300/30 hover:shadow-[0_18px_44px_rgba(27,45,31,0.1)] sm:p-6">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#9bbf3d] via-[#d7eb75] to-transparent"
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-lime-300">
            <span className="size-2 rounded-full bg-[#9bbf3d]" />
            {sport.name}
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-white">
            {session.name}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{facility.name}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1.5 text-xs font-bold text-lime-200">
          <span className="size-1.5 rounded-full bg-[#70973a]" />
          Open
        </span>
      </div>
      <div className="mt-5 grid gap-2.5 rounded-2xl bg-[#f3f5ef] p-4 text-sm sm:grid-cols-2">
        <p className="inline-flex items-start gap-2 text-slate-300">
          <CalendarClock
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-[#52732f]"
          />
          <span>
            <time dateTime={session.starts_at}>
              {formatFacilityDateTime(session.starts_at, facility.timezone)}
            </time>
            <span className="mt-0.5 block text-xs text-slate-500">
              {facility.timezone}
            </span>
          </span>
        </p>
        <p className="inline-flex items-start gap-2 text-slate-300">
          <UsersRound
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-[#52732f]"
          />
          <span>
            {session.players_per_match} players per match
            <span className="mt-0.5 block text-xs text-slate-500">
              {courts.length} {courts.length === 1 ? "court" : "courts"} · FIFO
            </span>
          </span>
        </p>
      </div>
      {facility.address ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400">
          <MapPin aria-hidden="true" className="size-4 shrink-0" />
          {facility.address}
        </p>
      ) : null}
      <Link
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-lime-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        href={`/sessions/${session.id}`}
      >
        View session
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </Link>
    </article>
  );
}
