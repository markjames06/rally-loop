"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { useActionToast } from "@/components/ui/toast";
import {
  joinQueueAction,
  leaveQueueAction,
  skipQueueEntryAction,
  type QueueActionState,
} from "@/server/queue/actions";
import type {
  MyQueueEntry,
  WaitingQueueEntry,
} from "@/server/queue/queries";
import { canRejoinQueue, canWithdrawEntry } from "@/shared/queue/rules";

type QueuePanelProps = {
  sessionId: string;
  timezone: string;
  entries: WaitingQueueEntry[];
  myEntry: MyQueueEntry | null;
  signedIn: boolean;
  canJoin: boolean;
};

const initialState: QueueActionState = {};

function QueueFeedback({
  error,
  notice,
}: {
  error?: string;
  notice?: string;
}) {
  if (error) {
    return (
      <p className="queue-feedback is-error" role="alert">
        {error}
      </p>
    );
  }
  if (notice) {
    return (
      <p className="queue-feedback is-notice" role="status">
        {notice}
      </p>
    );
  }
  return null;
}

export function QueuePanel({
  sessionId,
  timezone,
  entries,
  myEntry,
  signedIn,
  canJoin,
}: QueuePanelProps) {
  const joinAction = joinQueueAction.bind(null, sessionId);
  const leaveAction = leaveQueueAction.bind(null, sessionId);
  const [joinState, joinFormAction, joining] = useActionState(
    joinAction,
    initialState,
  );
  const [leaveState, leaveFormAction, leaving] = useActionState(
    leaveAction,
    initialState,
  );
  useActionToast(joinState);
  useActionToast(leaveState);
  const myPosition =
    myEntry?.status === "waiting"
      ? entries.find((entry) => entry.entryId === myEntry.id)?.position
      : undefined;

  return (
    <section
      aria-labelledby="queue-heading"
      className="queue-panel"
    >
      <div className="queue-panel-head">
        <div>
          <h2 id="queue-heading">
            Session queue
          </h2>
          <p>Waiting order is first in, first out.</p>
        </div>
        {signedIn ? (
          <span className="queue-count">
            {entries.length} waiting
          </span>
        ) : null}
      </div>

      {myEntry && canWithdrawEntry(myEntry.status) ? (
        <div className="queue-you">
          <p>
            {myPosition
              ? `You are #${myPosition} in the queue.`
              : "You are in this queue."}
          </p>
          <form action={leaveFormAction}>
            <Button
              disabled={leaving}
              type="submit"
              variant="outline">
              {leaving ? "Leaving..." : "Leave queue"}
            </Button>
          </form>
          <QueueFeedback {...leaveState} />
        </div>
      ) : myEntry?.status === "withdrawn" ? (
        <p className="queue-status-copy" role="status">
          You left this queue.
        </p>
      ) : myEntry?.status === "skipped" ? (
        <p className="queue-status-copy is-warn" role="status">
          Your earlier queue entry was skipped
          {myEntry.admin_note ? `: ${myEntry.admin_note}` : "."}
        </p>
      ) : myEntry?.status === "assigned" ? (
        <p className="queue-status-copy" role="status">
          You have been assigned from this queue.
        </p>
      ) : myEntry?.status === "played" ? (
        <p className="queue-status-copy" role="status">
          Your match is complete. You can join the queue again when you are ready.
        </p>
      ) : null}

      {!signedIn ? (
        <p className="queue-status-copy">
          <Link
            className="player-text-link"
            href={`/login?next=${encodeURIComponent(`/sessions/${sessionId}`)}`}
          >
            Sign in
          </Link>{" "}
          to view the waiting list or join the queue.
        </p>
      ) : canJoin &&
        (!myEntry ||
          canRejoinQueue(myEntry.status)) ? (
        <form action={joinFormAction} className="queue-join">
          <Button
            className="player-primary-action"
            disabled={joining}
            type="submit"
          >
            {joining ? "Joining..." : "Join queue"}
          </Button>
          <QueueFeedback {...joinState} />
        </form>
      ) : null}

      {!signedIn ? null : entries.length ? (
        <ol
          aria-label="Players waiting in FIFO order"
          className="queue-list"
        >
          {entries.map((entry) => (
            <li
              className={`queue-row${entry.isCurrentUser ? " is-you" : ""}`}
              key={entry.entryId}
            >
              <span className="queue-position">
                {entry.position}
              </span>
              <span className="queue-name">
                {entry.playerName}
                {entry.isCurrentUser ? (
                  <span className="queue-you-mark">You</span>
                ) : null}
              </span>
              <time
                className="queue-joined"
                dateTime={entry.joinedAt}
              >
                {new Intl.DateTimeFormat("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: timezone,
                }).format(new Date(entry.joinedAt))}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <p className="queue-empty">
          No players are waiting yet. Be the first to join.
        </p>
      )}
    </section>
  );
}

export function StaffQueueManager({
  facilityId,
  sessionId,
  entries,
}: {
  facilityId: string;
  sessionId: string;
  entries: WaitingQueueEntry[];
}) {
  return (
    <section
      aria-label="Staff queue controls"
      className="staff-queue"
    >
      <h3>Waiting queue</h3>
      {entries.length ? (
        <ol className="staff-queue-list">
          {entries.map((entry) => (
            <li
              className="staff-queue-row"
              key={entry.entryId}
            >
              <span className="queue-position">{entry.position}</span>
              <span className="queue-name">{entry.playerName}</span>
              <SkipQueueForm
                entryId={entry.entryId}
                facilityId={facilityId}
                sessionId={sessionId}
              />
            </li>
          ))}
        </ol>
      ) : (
        <p className="queue-empty">No one is waiting.</p>
      )}
    </section>
  );
}

function SkipQueueForm({
  facilityId,
  sessionId,
  entryId,
}: {
  facilityId: string;
  sessionId: string;
  entryId: string;
}) {
  const action = skipQueueEntryAction.bind(
    null,
    facilityId,
    sessionId,
    entryId,
  );
  const [state, formAction, pending] = useActionState(action, initialState);
  useActionToast(state);

  return (
    <form action={formAction} className="staff-skip-form">
      <label className="sr-only" htmlFor={`skip-reason-${entryId}`}>
        Reason for skipping this player
      </label>
      <input
        className="staff-skip-input"
        id={`skip-reason-${entryId}`}
        maxLength={500}
        minLength={3}
        name="reason"
        placeholder="Reason required"
        required
      />
      <Button disabled={pending} type="submit" variant="outline">
        {pending ? "Saving..." : "Skip"}
      </Button>
      <QueueFeedback {...state} />
    </form>
  );
}
