import Link from "next/link";
import {
  ArrowUpRight,
} from "lucide-react";

import { formatFacilityDateTime } from "@/shared/facilities/datetime";
import type { SessionSummary } from "@/server/sessions/queries";

export function SessionCard({ summary }: { summary: SessionSummary }) {
  const { session, facility, sport, courts } = summary;

  return (
    <article className="session-card">
      <div className="session-card-top">
        <p>{sport.name}<span aria-hidden="true"> / </span> Open play</p>
        <span className="session-card-status"><span aria-hidden="true" /> Open</span>
      </div>
      <div className="session-card-main">
        <div>
          <h2>{session.name}</h2>
          <p className="session-card-facility">{facility.name}{facility.address ? ` · ${facility.address}` : ""}</p>
        </div>
        <time dateTime={session.starts_at}>
          {formatFacilityDateTime(session.starts_at, facility.timezone)}
          <span>{facility.timezone}</span>
        </time>
      </div>
      <div className="session-card-meta">
        <span>{session.players_per_match} players per match</span>
        <span>{courts.length} {courts.length === 1 ? "court" : "courts"}</span>
        <span>First in, first out</span>
      </div>
      <Link className="session-card-link" href={`/sessions/${session.id}`}>
        View session <ArrowUpRight aria-hidden="true" className="size-4" />
      </Link>
    </article>
  );
}
