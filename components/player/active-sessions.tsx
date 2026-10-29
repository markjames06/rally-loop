import Link from "next/link";
import { ArrowRight, Clock3, MapPin, UsersRound } from "lucide-react";

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
          <h2 id="player-current-session-heading">Your current sessions</h2>
          <p>Queue and court updates for sessions you have joined.</p>
        </div>
        <span className="player-live-label">
          <span aria-hidden="true" /> Live status
        </span>
      </div>
      <ul className="player-session-list">
        {sessions.map((activeSession) => {
          const { session, facility, match } = activeSession;
          return (
            <li className="player-session-row" key={session.id}>
              <div className="player-session-main">
                <p className="player-session-name">{session.name}</p>
                <p className="player-session-facility">
                  <MapPin aria-hidden="true" className="size-4" />
                  {facility.name}
                </p>
                <time className="player-session-time" dateTime={session.starts_at}>
                  <Clock3 aria-hidden="true" className="size-4" />
                  {formatFacilityDateTime(session.starts_at, facility.timezone)}
                </time>
              </div>
              <div className="player-session-detail">
                <p className="player-session-status">
                  {match?.status === "in_progress" ? (
                    <span className="player-status-dot is-active" aria-hidden="true" />
                  ) : match?.status === "assigned" ? (
                    <span className="player-status-dot is-assigned" aria-hidden="true" />
                  ) : (
                    <UsersRound aria-hidden="true" className="size-4 text-[#39764d]" />
                  )}
                  {getPlayerSessionStatusLabel({
                    matchStatus: match?.status,
                    queueStatus: activeSession.queueStatus,
                    queuePosition: activeSession.queuePosition,
                    queueUnavailable: activeSession.queueUnavailable,
                  })}
                </p>
                {match ? (
                  <p className="player-session-court">
                    {match.status === "in_progress" ? "Playing on" : "Up next on"} {match.court_name}
                  </p>
                ) : activeSession.queueStatus === "assigned" ? (
                  <p className="player-session-court">
                    Open the session to check your court assignment.
                  </p>
                ) : activeSession.queueUnavailable ? (
                  <p className="player-session-court">
                    Open the session to check your queue position.
                  </p>
                ) : (
                  <p className="player-session-court">
                    Waiting order follows first in, first out.
                  </p>
                )}
              </div>
              <Link
                aria-label={`View ${session.name} session`}
                className="player-session-link"
                href={`/sessions/${session.id}`}
              >
                View session <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
