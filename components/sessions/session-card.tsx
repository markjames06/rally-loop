import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CircleDot,
  MapPin,
  Users,
} from "lucide-react";

import { formatFacilityDateTime } from "@/shared/facilities/datetime";
import type { SessionSummary } from "@/server/sessions/queries";

export function SessionCard({ summary }: { summary: SessionSummary }) {
  const { session, facility, sport, courts } = summary;

  return (
    <article className="rounded-md border p-5 sm:p-6 transition flex flex-col justify-between gap-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="space-y-3">
        {/* Top badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-ink)' }}>
            {sport.name}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ borderColor: 'var(--accent-track)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-ink)' }}>
            <span aria-hidden="true" className="size-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
            Open play
          </span>
        </div>

        {/* Title & Facility */}
        <div>
          <h2 className="text-lg font-bold tracking-tight hover:underline" style={{ color: 'var(--text)' }}>
            {session.name}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" style={{ color: 'var(--control)' }} />
            <span className="truncate">{facility.name}{facility.address ? ` · ${facility.address}` : ""}</span>
          </p>
        </div>

        {/* Start Time */}
        <div className="flex items-center gap-2 rounded-md border p-3 text-xs" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)', color: 'var(--muted)' }}>
          <CalendarClock aria-hidden="true" className="size-4 shrink-0" style={{ color: 'var(--accent)' }} />
          <div className="min-w-0">
            <span className="font-semibold" style={{ color: 'var(--text)' }}>Starts: </span>
            <time dateTime={session.starts_at}>
              {formatFacilityDateTime(session.starts_at, facility.timezone)}
            </time>
            <span className="ml-1" style={{ color: 'var(--control)' }}>({facility.timezone})</span>
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)', color: 'var(--muted)' }}>
            <Users aria-hidden="true" className="size-3" style={{ color: 'var(--control)' }} />
            {session.players_per_match} players / match
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)', color: 'var(--muted)' }}>
            <CircleDot aria-hidden="true" className="size-3" style={{ color: 'var(--control)' }} />
            {courts.length} {courts.length === 1 ? "court" : "courts"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)', color: 'var(--muted)' }}>
            FIFO queue
          </span>
        </div>
      </div>

      {/* Action button */}
      <Link
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs font-semibold text-white transition active:scale-[0.98]"
        style={{ backgroundColor: 'var(--accent)' }}
        href={`/sessions/${session.id}`}
      >
        <span>View session</span>
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </Link>
    </article>
  );
}
