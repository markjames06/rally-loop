import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { formatFacilityDateTime } from "@/shared/facilities/datetime";
import type { PlayerMatchRecord } from "@/server/matches/queries";
import { getPlayerSessionStatusLabel } from "@/shared/player/status";
import type { Database, QueueEntryStatus } from "@/shared/types/database";

type Session = Pick<
  Database["public"]["Tables"]["sessions"]["Row"],
  "id" | "name" | "status" | "starts_at"
>;
type Facility = Pick<
  Database["public"]["Tables"]["facilities"]["Row"],
  "name" | "timezone"
>;

export type PlayerActiveSession = {
  session: Session;
  facility: Facility;
  queuePosition: number | null;
  queueUnavailable: boolean;
  queueStatus: QueueEntryStatus | undefined;
  match: PlayerMatchRecord | undefined;
};

export function PlayerActiveSessions({
  sessions,
}: {
  sessions: PlayerActiveSession[];
}) {
  return (
    <section aria-labelledby="player-current-session-heading">
      <div className="player-section-heading">
        <div>
          <h2 id="player-current-session-heading">Now</h2>
          <p>Your place in line and the court you are headed to.</p>
        </div>
        <span className="player-live-label">
          <span aria-hidden="true" /> Live
        </span>
      </div>
      <ul className="player-session-list">
        {sessions.map((activeSession) => {
          const { session, facility, match } = activeSession;
          const onCourt = match?.status === "in_progress";
          const assigned = match?.status === "assigned" || activeSession.queueStatus === "assigned";
          const figure = onCourt || assigned
            ? match?.court_name ?? "Court"
            : activeSession.queueUnavailable
              ? "—"
              : activeSession.queuePosition ?? "—";
          const figureLabel = onCourt
            ? "Playing on"
            : assigned
              ? "Up next on"
              : "Place in line";

          return (
            <li className="player-session-row" key={session.id}>
              <div className="player-session-place">
                <span>{figureLabel}</span>
                <strong>{figure}</strong>
              </div>
              <div className="player-session-main">
                <p className="player-session-name">{session.name}</p>
                <p className="player-session-facility">{facility.name}</p>
                <time className="player-session-time" dateTime={session.starts_at}>
                  {formatFacilityDateTime(session.starts_at, facility.timezone)}
                </time>
                <p className="player-session-status">
                  {getPlayerSessionStatusLabel({
                    matchStatus: match?.status,
                    queueStatus: activeSession.queueStatus,
                    queuePosition: activeSession.queuePosition,
                    queueUnavailable: activeSession.queueUnavailable,
                  })}
                </p>
              </div>
              <Link
                aria-label={`View ${session.name} session`}
                className="player-session-link"
                href={`/sessions/${session.id}`}
              >
                Open session <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
