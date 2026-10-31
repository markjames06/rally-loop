"use client";

import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CirclePlay,
  OctagonAlert,
  Trophy,
  Users,
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
import type { SessionMatchRecord } from "@/server/matches/queries";
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
      <div className="rounded-md border p-3 text-xs font-medium" style={{ borderColor: 'var(--negative)', backgroundColor: 'var(--pill-negative-bg)', color: 'var(--pill-negative-ink)' }} role="alert">
        {state.error}
      </div>
    );
  }
  if (state.notice) {
    return (
      <div className="rounded-md border p-3 text-xs font-medium" style={{ borderColor: 'var(--positive)', backgroundColor: 'var(--pill-positive-bg)', color: 'var(--pill-positive-ink)' }} role="status">
        {state.notice}
      </div>
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
      className="rounded-md border p-5 transition"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)' }}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <label className="space-y-1.5 text-sm">
          <span className="block font-semibold" style={{ color: 'var(--text)' }}>Available court</span>
          <select
            className="h-10 w-full rounded-md border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
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
        <label className="space-y-1.5 text-sm">
          <span className="block font-semibold" style={{ color: 'var(--text)' }}>Staff notes (optional)</span>
          <input
            className="h-10 w-full rounded-md border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
            maxLength={500}
            name="notes"
            placeholder="Notes for facility staff"
          />
        </label>
        <div className="flex flex-col justify-end">
          <Button
            className="h-10 rounded-md px-5 font-semibold text-white transition disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
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
                <ArrowRight aria-hidden="true" className="ml-1.5 size-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {!availableCourts.length ? (
        <p className="mt-3 text-xs font-medium" style={{ color: 'var(--warning)' }}>
          No court assigned to this session is currently available.
        </p>
      ) : null}
      {sessionStatus !== "open" ? (
        <p className="mt-3 text-xs font-medium" style={{ color: 'var(--warning)' }}>
          New matches can only be assigned while the session is open.
        </p>
      ) : null}
      <div className="mt-3">
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
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-3" style={{ borderColor: 'var(--rule)' }}>
      {canStartMatch(status, sessionStatus) ? (
        <form action={startFormAction} className="inline-block">
          <Button
            className="rounded-md font-semibold text-white transition"
            style={{ backgroundColor: 'var(--accent)' }}
            disabled={starting}
            size="sm"
            type="submit"
          >
            {starting ? (
              "Starting..."
            ) : (
              <>
                <CirclePlay aria-hidden="true" className="mr-1.5 size-4" />
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
            className="rounded-md transition"
            style={{ color: 'var(--accent-ink)', borderColor: 'var(--accent-track)' }}
            onClick={() => setCompleteDialogOpen(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <CheckCircle2 aria-hidden="true" className="mr-1.5 size-4" style={{ color: 'var(--accent)' }} />
            Complete match
          </Button>
          <Dialog
            description="Confirm the match is finished. The court will be released for the next players."
            onOpenChange={setCompleteDialogOpen}
            open={completeDialogOpen}
            title="Complete this match?"
          >
            <form action={completeFormAction} className="space-y-4">
              <label className="block space-y-1.5 text-sm font-medium" style={{ color: 'var(--text)' }}>
                <span>Result or completion notes (optional)</span>
                <input
                  className="h-10 w-full rounded-md border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
                  maxLength={500}
                  name="notes"
                  placeholder="Add a result or note for staff"
                />
              </label>
              <MatchFeedback state={completeState} />
              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <Button
                  className="rounded-md"
                  onClick={() => setCompleteDialogOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Keep in play
                </Button>
                <Button
                  className="rounded-md text-white transition"
                  style={{ backgroundColor: 'var(--accent)' }}
                  disabled={completing}
                  type="submit"
                >
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
            className="rounded-md transition"
            style={{ color: 'var(--negative)', borderColor: 'var(--negative)' }}
            onClick={() => setCancelDialogOpen(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <OctagonAlert aria-hidden="true" className="mr-1.5 size-4" style={{ color: 'var(--negative)' }} />
            Cancel match
          </Button>
          <Dialog
            description="This returns assigned players to the waiting queue. Add a reason so staff can understand why the match was cancelled."
            onOpenChange={setCancelDialogOpen}
            open={cancelDialogOpen}
            title="Cancel this match?"
          >
            <form action={cancelFormAction} className="space-y-4">
              <label className="block space-y-1.5 text-sm font-medium" style={{ color: 'var(--text)' }}>
                <span>Cancellation reason</span>
                <input
                  className="h-10 w-full rounded-md border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
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
                  className="rounded-md"
                  onClick={() => setCancelDialogOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Keep match
                </Button>
                <Button
                  className="rounded-md text-white transition"
                  style={{ backgroundColor: 'var(--negative)' }}
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
  const isAssigned = match.status === "assigned";
  const isInProgress = match.status === "in_progress";
  const isCompleted = match.status === "completed";

  return (
    <li className="rounded-md border p-5 transition" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-bold" style={{ color: 'var(--text)' }}>{match.court_name}</span>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
          style={{
            backgroundColor: isAssigned
              ? 'var(--pill-accent-bg)'
              : isInProgress
                ? 'var(--pill-positive-bg)'
                : isCompleted
                  ? 'var(--pill-neutral-bg)'
                  : 'var(--pill-negative-bg)',
            color: isAssigned
              ? 'var(--pill-accent-ink)'
              : isInProgress
                ? 'var(--pill-positive-ink)'
                : isCompleted
                  ? 'var(--pill-neutral-ink)'
                  : 'var(--pill-negative-ink)'
          }}
        >
          {match.status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-3 flex items-start gap-2 text-sm" style={{ color: 'var(--muted)' }}>
        <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--control)' }} />
        <span className="font-medium" style={{ color: 'var(--text)' }}>
          {match.player_names.join(", ") || "Players unavailable"}
        </span>
      </div>

      <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
        <CalendarClock aria-hidden="true" className="size-3.5" style={{ color: 'var(--control)' }} />
        <span>Assigned {formatMatchDate(match.assigned_at, timezone)}</span>
        {match.started_at ? (
          <>
            <span>·</span>
            <span>Started {formatMatchDate(match.started_at, timezone)}</span>
          </>
        ) : null}
        {match.completed_at ? (
          <>
            <span>·</span>
            <span>Completed {formatMatchDate(match.completed_at, timezone)}</span>
          </>
        ) : null}
        {match.cancelled_at ? (
          <>
            <span>·</span>
            <span>Cancelled {formatMatchDate(match.cancelled_at, timezone)}</span>
          </>
        ) : null}
      </p>

      {match.notes ? (
        <div className="mt-2.5 rounded-md p-2.5 text-xs" style={{ backgroundColor: 'var(--raised)', color: 'var(--muted)' }}>
          <span className="font-semibold" style={{ color: 'var(--text)' }}>Staff notes: </span>
          {match.notes}
        </div>
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
      className="space-y-6 rounded-md border p-6"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <Trophy aria-hidden="true" className="size-4" />
          </span>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Matches and courts</h3>
        </div>
        <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          Assigns the next {playersPerMatch} eligible players in FIFO order.
        </p>
      </div>

      <AssignNextMatchForm
        courts={courts}
        facilityId={facilityId}
        playersPerMatch={playersPerMatch}
        sessionId={sessionId}
        sessionStatus={sessionStatus}
      />

      <div>
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--rule)' }}>
          <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Active matches</h4>
          <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-ink)' }}>
            {activeMatches.length}
          </span>
        </div>
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
          <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>No active matches.</p>
        )}
      </div>

      <div className="pt-2 border-t" style={{ borderColor: 'var(--rule)' }}>
        <div className="flex items-center justify-between pb-2">
          <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Recent history</h4>
          <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-ink)' }}>
            {history.length}
          </span>
        </div>
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
          <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>No completed or cancelled matches yet.</p>
        )}
      </div>
    </section>
  );
}
