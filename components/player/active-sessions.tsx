import Link from "next/link";
import {
  ArrowRight,
  Bolt,
  CircleHelp,
  CirclePlay,
  Clock3,
  ListOrdered,
  MapPin,
} from "lucide-react";

import { formatFacilityDateTime } from "@/shared/facilities/datetime";
import type { PlayerMatchRecord } from "@/server/matches/queries";
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
    <ul className="player-session-list">
      {sessions.map(({ session, facility, match, queuePosition, queueStatus, queueUnavailable }) => {
        const onCourt = match?.status === "in_progress";
        const assigned = match?.status === "assigned" || queueStatus === "assigned";
        const status = onCourt
          ? "On court"
          : assigned
            ? "Up next"
            : queueUnavailable
              ? "Unavailable"
              : queuePosition !== null
                ? `#${queuePosition}`
                : "In queue";
        const StatusIcon = onCourt
          ? CirclePlay
          : assigned
            ? Bolt
            : queueUnavailable
              ? CircleHelp
              : ListOrdered;

        return (
          <li className="player-session-row" key={session.id}>
            <div className="player-session-main">
              <h3 className="player-session-name">{session.name}</h3>
              <p className="player-session-facility">
                <MapPin aria-hidden="true" className="size-4" />
                <span>{facility.name}</span>
              </p>
            </div>
            <div className="player-session-detail">
              <p
                aria-label={queuePosition !== null && !assigned && !onCourt
                  ? `Queue position ${queuePosition}`
                  : status}
                className={`player-session-status${onCourt ? " is-playing" : assigned ? " is-assigned" : ""}`}
              >
                <StatusIcon aria-hidden="true" className="size-4" />
                <strong>{status}</strong>
                {(onCourt || assigned) && match?.court_name ? <span>{match.court_name}</span> : null}
              </p>
              <p className="player-session-time">
                <Clock3 aria-hidden="true" className="size-4" />
                <span>{formatFacilityDateTime(session.starts_at, facility.timezone)}</span>
              </p>
            </div>
            <Link
              aria-label={`View ${session.name} session`}
              className="player-session-link"
              href={`/sessions/${session.id}`}
            >
              <span className="sr-only">Open session</span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
