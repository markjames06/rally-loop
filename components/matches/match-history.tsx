import { CalendarClock, CircleCheck, CircleDot, CircleX, Trophy } from "lucide-react";
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
  const StatusIcon =
    status === "completed"
      ? CircleCheck
      : status === "cancelled"
        ? CircleX
        : CircleDot;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#f3f5ef] px-2.5 py-1 text-xs font-semibold capitalize text-slate-200">
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
      className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-5 sm:p-6"
    >
      <h2
        className="inline-flex items-center gap-2 text-xl font-bold"
        id="session-match-history-heading"
      >
        <Trophy aria-hidden="true" className="size-5 text-[#52732f]" />
        Match history
      </h2>
      {matches.length ? (
        <ol className="mt-4 space-y-3">
          {matches.map((match) => (
            <li
              className="rounded-2xl border border-white/10 bg-[#fbfcf8] p-4"
              key={match.match_id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-white">{match.court_name}</p>
                <MatchStatus status={match.status} />
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {match.player_names.join(", ") || "Players unavailable"}
              </p>
              <p className="mt-2 text-xs text-slate-400">
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
        <p className="mt-3 rounded-xl border border-dashed border-white/10 bg-[#f7f8f3] p-4 text-sm text-slate-400">
          No matches have been assigned in this session yet.
        </p>
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
      <h2
        className="inline-flex items-center gap-2 text-lg font-bold text-white"
        id="player-match-history-heading"
      >
        <Trophy aria-hidden="true" className="size-5 text-[#52732f]" />
        My match history
      </h2>
      {matches.length ? (
        <ol className="player-history-list mt-4">
          {matches.map((match) => (
            <li
              className="player-history-row"
              key={match.match_id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-white">{match.session_name}</p>
                <MatchStatus status={match.status} />
              </div>
              <p className="mt-1 text-sm text-slate-300">
                {match.facility_name} · {match.court_name}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {match.player_names.join(", ") || "Players unavailable"}
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-400">
                <CalendarClock aria-hidden="true" className="size-3.5" />
                {match.status === "completed"
                  ? `Completed ${formatMatchDate(
                      match.completed_at,
                      match.facility_timezone,
                    )}`
                  : match.status === "cancelled"
                    ? `Cancelled ${formatMatchDate(
                        match.cancelled_at,
                        match.facility_timezone,
                      )}`
                    : `Assigned ${formatMatchDate(
                        match.assigned_at,
                        match.facility_timezone,
                      )}`}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          Your match history will appear here after you are assigned to a match.
        </p>
      )}
    </section>
  );
}
