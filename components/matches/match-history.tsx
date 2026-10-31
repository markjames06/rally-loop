import { CalendarClock, CircleCheck, CircleDot, CirclePlay, CircleX, Trophy } from "lucide-react";
import type {
  PlayerMatchRecord,
  SessionMatchRecord,
} from "@/server/matches/queries";

function formatMatchDate(value: string | null, timezone: string): string {
  if (!value) {
    return "Not recorded";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

function MatchStatus({ status }: { status: string }) {
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";
  const isInProgress = status === "in_progress";

  const StatusIcon = isCompleted
    ? CircleCheck
    : isCancelled
      ? CircleX
      : isInProgress
        ? CirclePlay
        : CircleDot;

  const style = isCompleted
    ? { borderColor: 'var(--border)', backgroundColor: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-ink)' }
    : isCancelled
      ? { borderColor: 'var(--negative)', backgroundColor: 'var(--pill-negative-bg)', color: 'var(--pill-negative-ink)' }
      : isInProgress
        ? { borderColor: 'var(--accent-track)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-ink)' }
        : { borderColor: 'var(--warning)', backgroundColor: 'var(--pill-warning-bg)', color: 'var(--pill-warning-ink)' };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize" style={style}>
      <StatusIcon aria-hidden="true" className="size-3.5" />
      {status.replace("_", " ")}
    </span>
  );
}

export function SessionMatchHistory({
  matches,
  timezone,
}: {
  matches: SessionMatchRecord[];
  timezone: string;
}) {
  return (
    <section
      aria-labelledby="session-match-history-heading"
      className="mt-8 rounded-md border p-5"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--rule)' }}>
        <h2
          className="inline-flex items-center gap-2 text-base font-bold"
          style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}
          id="session-match-history-heading"
        >
          <Trophy aria-hidden="true" className="size-4.5" style={{ color: 'var(--accent)' }} />
          Session Match History
        </h2>
        <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
          {matches.length} {matches.length === 1 ? "match" : "matches"}
        </span>
      </div>

      {matches.length ? (
        <ol className="mt-4 space-y-3">
          {matches.map((match) => (
            <li
              className="rounded-md border p-4 transition"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)' }}
              key={match.match_id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{match.court_name}</span>
                <MatchStatus status={match.status} />
              </div>
              <p className="mt-2 text-xs font-medium" style={{ color: 'var(--text)' }}>
                {match.player_names.join(", ") || "Players unavailable"}
              </p>
              <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                {match.status === "completed"
                  ? `Completed ${formatMatchDate(match.completed_at, timezone)}`
                  : match.status === "cancelled"
                    ? `Cancelled ${formatMatchDate(match.cancelled_at, timezone)}`
                    : `Assigned ${formatMatchDate(match.assigned_at, timezone)}`}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-4 rounded-md border p-6 text-center text-xs" style={{ borderColor: 'var(--border)', borderStyle: 'dashed', backgroundColor: 'var(--surface)', color: 'var(--muted)' }}>
          No matches have been assigned in this session yet.
        </div>
      )}
    </section>
  );
}

export function PlayerMatchHistory({
  matches,
}: {
  matches: PlayerMatchRecord[];
}) {
  return (
    <section
      aria-labelledby="player-match-history-heading"
      className="player-history mt-10"
    >
      <div className="player-section-heading">
        <h2 id="player-match-history-heading">Match history</h2>
        <p>{matches.length} {matches.length === 1 ? "match" : "matches"}</p>
      </div>
      {matches.length ? (
        <ol className="player-history-list">
          {matches.map((match) => (
            <li
              className="player-history-row"
              key={match.match_id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>{match.session_name}</h3>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                    {match.facility_name} · <span className="font-semibold" style={{ color: 'var(--text)' }}>{match.court_name}</span>
                  </p>
                </div>
                <MatchStatus status={match.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                  {match.player_names.join(", ") || "Players unavailable"}
                </p>
                <p className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--muted)' }}>
                  <CalendarClock aria-hidden="true" className="size-4" />
                  {match.status === "completed"
                    ? formatMatchDate(
                        match.completed_at,
                        match.facility_timezone,
                      )
                    : match.status === "cancelled"
                      ? formatMatchDate(
                          match.cancelled_at,
                          match.facility_timezone,
                        )
                      : formatMatchDate(
                          match.assigned_at,
                          match.facility_timezone,
                        )}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="py-6 text-sm" style={{ color: 'var(--muted)' }}>
          Your match history will appear here after you are assigned to a match.
        </div>
      )}
    </section>
  );
}
