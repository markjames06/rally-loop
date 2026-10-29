"use client";

import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CirclePlay,
  OctagonAlert,
  Trophy,
} from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useActionToast } from "@/components/ui/toast";
import {
  assignNextMatchAction,
  cancelMatchAction,
  completeMatchAction,
  startMatchAction,
  type MatchActionState,
} from "@/server/matches/actions";
import type {
  SessionMatchRecord,
} from "@/server/matches/queries";
import { canStartMatch } from "@/shared/matches/rules";
import type {
  CourtStatus,
  MatchStatus,
  SessionStatus,
} from "@/shared/types/database";

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
  return new Intl.DateTimeFormat("en-US", {
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
  useActionToast(state);

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
          {pending ? (
            "Assigning..."
          ) : (
            <>
              Assign next {playersPerMatch}
              <ArrowRight aria-hidden="true" className="size-4" />
            </>
          )}
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
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useActionToast(startState);
  useActionToast(completeState);
  useActionToast(cancelState);

  return (
    <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
      {canStartMatch(status, sessionStatus) ? (
        <form action={startFormAction}>
          <Button disabled={starting} type="submit">
            {starting ? (
              "Starting..."
            ) : (
              <>
                <CirclePlay aria-hidden="true" className="size-4" />
                Start match
              </>
            )}
          </Button>
          <MatchFeedback state={startState} />
        </form>
      ) : null}
      {status === "in_progress" ? (
        <>
          <Button
            onClick={() => setCompleteDialogOpen(true)}
            type="button"
            variant="outline"
          >
            <CheckCircle2 aria-hidden="true" className="size-4" />
            Complete match
          </Button>
          <Dialog
            description="Confirm the match is finished. The court will be released for the next players."
            onOpenChange={setCompleteDialogOpen}
            open={completeDialogOpen}
            title="Complete this match?"
          >
            <form action={completeFormAction} className="space-y-4">
              <label className="block space-y-2 text-sm font-medium text-[#36463a]">
                <span>Result or completion notes (optional)</span>
                <input
                  className="h-11 w-full rounded-lg border border-[#d6ddcd] bg-white px-3 text-sm text-[#19251e] placeholder:text-[#89948a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7eaa39]"
                  maxLength={500}
                  name="notes"
                  placeholder="Add a result or note for staff"
                />
              </label>
              <MatchFeedback state={completeState} />
              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <Button
                  onClick={() => setCompleteDialogOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Keep in play
                </Button>
                <Button disabled={completing} type="submit">
                  {completing ? "Completing..." : "Complete match"}
                </Button>
              </div>
            </form>
          </Dialog>
        </>
      ) : null}
      {status === "assigned" || status === "in_progress" ? (
        <>
          <Button
            className="border-[#e8c8bc] text-[#973f31] hover:bg-[#fff2ed] hover:text-[#87372c]"
            onClick={() => setCancelDialogOpen(true)}
            type="button"
            variant="outline"
          >
            <OctagonAlert aria-hidden="true" className="size-4" />
            Cancel match
          </Button>
          <Dialog
            description="This returns assigned players to the waiting queue. Add a reason so staff can understand why the match was cancelled."
            onOpenChange={setCancelDialogOpen}
            open={cancelDialogOpen}
            title="Cancel this match?"
          >
            <form action={cancelFormAction} className="space-y-4">
              <label className="block space-y-2 text-sm font-medium text-[#36463a]">
                <span>Cancellation reason</span>
                <input
                  className="h-11 w-full rounded-lg border border-[#d6ddcd] bg-white px-3 text-sm text-[#19251e] placeholder:text-[#89948a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7eaa39]"
                  maxLength={500}
                  minLength={3}
                  name="reason"
                  placeholder="Why is this match being cancelled?"
                  required
                />
              </label>
              <MatchFeedback state={cancelState} />
              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <Button
                  onClick={() => setCancelDialogOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Keep match
                </Button>
                <Button
                  className="bg-[#a33d31] text-white hover:bg-[#8e342b]"
                  disabled={cancelling}
                  type="submit"
                >
                  {cancelling ? "Cancelling..." : "Cancel match"}
                </Button>
              </div>
            </form>
          </Dialog>
        </>
      ) : null}
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
      <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-400">
        <CalendarClock aria-hidden="true" className="size-3.5" />
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
      className="mt-5 rounded-2xl border border-white/10 bg-[#f7f8f3] p-4"
    >
      <h3 className="inline-flex items-center gap-2 font-semibold">
        <Trophy aria-hidden="true" className="size-4 text-[#52732f]" />
        Matches and courts
      </h3>
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
