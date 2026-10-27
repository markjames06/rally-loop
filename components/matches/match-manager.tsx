"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  assignNextMatchAction,
  cancelMatchAction,
  completeMatchAction,
  startMatchAction,
  type MatchActionState,
} from "@/lib/matches/actions";
import type {
  SessionMatchRecord,
} from "@/lib/matches/queries";
import { canStartMatch } from "@/lib/matches/rules";
import type {
  CourtStatus,
  MatchStatus,
  SessionStatus,
} from "@/types/database";

type MatchCourt = {
  id: string;
  name: string;
  status: CourtStatus;
};

const initialState: MatchActionState = {};

function MatchFeedback({ state }: { state: MatchActionState }) {
  if (state.error) {
    return (
      <p className="text-sm text-rose-200" role="alert">
        {state.error}
      </p>
    );
  }
  if (state.notice) {
    return (
      <p className="text-sm text-lime-200" role="status">
        {state.notice}
      </p>
    );
  }
  return null;
}

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

function AssignNextMatchForm({
  facilityId,
  sessionId,
  sessionStatus,
  playersPerMatch,
  courts,
}: {
  facilityId: string;
  sessionId: string;
  sessionStatus: SessionStatus;
  playersPerMatch: number;
  courts: MatchCourt[];
}) {
  const action = assignNextMatchAction.bind(null, facilityId, sessionId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const availableCourts = courts.filter((court) => court.status === "available");

  return (
    <form
      action={formAction}
      className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-4 sm:grid-cols-[1fr_1fr_auto]"
    >
      <label className="space-y-2 text-sm">
        <span className="block font-medium text-slate-200">Available court</span>
        <select
          className="h-10 w-full rounded-md border border-input bg-slate-950 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          defaultValue=""
          name="court_id"
          required
        >
          <option value="">Choose a court</option>
          {availableCourts.map((court) => (
            <option key={court.id} value={court.id}>
              {court.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2 text-sm">
        <span className="block font-medium text-slate-200">Staff notes (optional)</span>
        <input
          className="h-10 w-full rounded-md border border-input bg-slate-950 px-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          maxLength={500}
          name="notes"
          placeholder="Notes for facility staff"
        />
      </label>
      <div className="flex flex-col justify-end gap-2">
        <Button
          disabled={
            pending ||
            sessionStatus !== "open" ||
            playersPerMatch < 1 ||
            availableCourts.length === 0
          }
          type="submit"
        >
          {pending ? "Assigning..." : `Assign next ${playersPerMatch}`}
        </Button>
      </div>
      {!availableCourts.length ? (
        <p className="text-sm text-slate-400 sm:col-span-3">
          No court assigned to this session is currently available.
        </p>
      ) : null}
      {sessionStatus !== "open" ? (
        <p className="text-sm text-slate-400 sm:col-span-3">
          New matches can only be assigned while the session is open.
        </p>
      ) : null}
      <div className="sm:col-span-3">
        <MatchFeedback state={state} />
      </div>
    </form>
  );
}

function MatchControls({
  facilityId,
  sessionId,
  matchId,
  status,
  sessionStatus,
}: {
  facilityId: string;
  sessionId: string;
  matchId: string;
  status: MatchStatus;
  sessionStatus: SessionStatus;
}) {
  const startAction = startMatchAction.bind(
    null,
    facilityId,
    sessionId,
    matchId,
  );
  const completeAction = completeMatchAction.bind(
    null,
    facilityId,
    sessionId,
    matchId,
  );
  const cancelAction = cancelMatchAction.bind(
    null,
    facilityId,
    sessionId,
    matchId,
  );
  const [startState, startFormAction, starting] = useActionState(
    startAction,
    initialState,
  );
  const [completeState, completeFormAction, completing] = useActionState(
    completeAction,
    initialState,
  );
  const [cancelState, cancelFormAction, cancelling] = useActionState(
    cancelAction,
    initialState,
  );

  return (
    <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
      {canStartMatch(status, sessionStatus) ? (
        <form action={startFormAction}>
          <Button disabled={starting} type="submit">
            {starting ? "Starting..." : "Start match"}
          </Button>
          <MatchFeedback state={startState} />
        </form>
      ) : null}
      {status === "in_progress" ? (
        <form
          action={completeFormAction}
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            if (!window.confirm("Complete this match and release the court?")) {
              event.preventDefault();
            }
          }}
        >
          <label className="sr-only" htmlFor={`complete-notes-${matchId}`}>
            Completion notes
          </label>
          <input
            className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            id={`complete-notes-${matchId}`}
            maxLength={500}
            name="notes"
            placeholder="Optional result or completion notes"
          />
          <Button disabled={completing} type="submit">
            {completing ? "Completing..." : "Complete match"}
          </Button>
        </form>
      ) : null}
      {status === "assigned" || status === "in_progress" ? (
        <form
          action={cancelFormAction}
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            if (!window.confirm("Cancel this match and return players to the queue?")) {
              event.preventDefault();
            }
          }}
        >
          <label className="sr-only" htmlFor={`cancel-reason-${matchId}`}>
            Reason for cancelling this match
          </label>
          <input
            className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            id={`cancel-reason-${matchId}`}
            maxLength={500}
            minLength={3}
            name="reason"
            placeholder="Cancellation reason (required)"
            required
          />
          <Button disabled={cancelling} type="submit" variant="outline">
            {cancelling ? "Cancelling..." : "Cancel match"}
          </Button>
        </form>
      ) : null}
      <MatchFeedback state={completeState} />
      <MatchFeedback state={cancelState} />
    </div>
  );
}

function MatchCard({
  facilityId,
  sessionId,
  match,
  timezone,
  sessionStatus,
}: {
  facilityId: string;
  sessionId: string;
  match: SessionMatchRecord;
  timezone: string;
  sessionStatus: SessionStatus;
}) {
  const isActive = match.status === "assigned" || match.status === "in_progress";

  return (
    <li className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-white">{match.court_name}</p>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold capitalize text-slate-200">
          {match.status.replace("_", " ")}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-300">
        {match.player_names.join(", ") || "Players unavailable"}
      </p>
      <p className="mt-2 text-xs text-slate-400">
        Assigned {formatMatchDate(match.assigned_at, timezone)}
        {match.started_at
          ? ` · Started ${formatMatchDate(match.started_at, timezone)}`
          : ""}
        {match.completed_at
          ? ` · Completed ${formatMatchDate(match.completed_at, timezone)}`
          : ""}
        {match.cancelled_at
          ? ` · Cancelled ${formatMatchDate(match.cancelled_at, timezone)}`
          : ""}
      </p>
      {match.notes ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">
          Staff notes: {match.notes}
        </p>
      ) : null}
      {isActive ? (
        <MatchControls
          facilityId={facilityId}
          matchId={match.match_id}
          sessionId={sessionId}
          sessionStatus={sessionStatus}
          status={match.status}
        />
      ) : null}
    </li>
  );
}

export function MatchManager({
  facilityId,
  sessionId,
  sessionStatus,
  playersPerMatch,
  timezone,
  courts,
  matches,
}: {
  facilityId: string;
  sessionId: string;
  sessionStatus: SessionStatus;
  playersPerMatch: number;
  timezone: string;
  courts: MatchCourt[];
  matches: SessionMatchRecord[];
}) {
  const activeMatches = matches.filter(
    (match) => match.status === "assigned" || match.status === "in_progress",
  );
  const history = matches.filter(
    (match) => match.status === "completed" || match.status === "cancelled",
  );

  return (
    <section
      aria-label="Match and court management"
      className="mt-5 rounded-2xl border border-white/10 p-4"
    >
      <h3 className="font-semibold">Matches and courts</h3>
      <p className="mt-1 text-sm text-slate-400">
        Assigns the next {playersPerMatch} eligible players in FIFO order.
      </p>
      <AssignNextMatchForm
        courts={courts}
        facilityId={facilityId}
        playersPerMatch={playersPerMatch}
        sessionId={sessionId}
        sessionStatus={sessionStatus}
      />
      <div className="mt-5">
        <h4 className="text-sm font-semibold text-slate-200">Active matches</h4>
        {activeMatches.length ? (
          <ol className="mt-3 space-y-3">
            {activeMatches.map((match) => (
              <MatchCard
                facilityId={facilityId}
                key={match.match_id}
                match={match}
                sessionId={sessionId}
                sessionStatus={sessionStatus}
                timezone={timezone}
              />
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No active matches.</p>
        )}
      </div>
      <div className="mt-5 border-t border-white/10 pt-4">
        <h4 className="text-sm font-semibold text-slate-200">Recent history</h4>
        {history.length ? (
          <ol className="mt-3 space-y-3">
            {history.map((match) => (
              <MatchCard
                facilityId={facilityId}
                key={match.match_id}
                match={match}
                sessionId={sessionId}
                sessionStatus={sessionStatus}
                timezone={timezone}
              />
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No completed or cancelled matches yet.</p>
        )}
      </div>
    </section>
  );
}
