"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Check } from "lucide-react";

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
      <p className="rounded-md border p-3 text-xs font-medium" style={{ borderColor: 'var(--negative)', backgroundColor: 'var(--pill-negative-bg)', color: 'var(--pill-negative-ink)' }} role="alert">
        {error}
      </p>
    );
  }
  if (notice) {
    return (
      <p className="rounded-md border p-3 text-xs font-medium" style={{ borderColor: 'var(--positive)', backgroundColor: 'var(--pill-positive-bg)', color: 'var(--pill-positive-ink)' }} role="status">
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
      className="rounded-md border p-5 sm:p-6 space-y-6"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--rule)' }}>
        <div>
          <h2 id="queue-heading" className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            Session queue
          </h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Waiting order is first in, first out.</p>
        </div>
        {signedIn ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: 'var(--accent-track)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-ink)' }}>
            {entries.length} waiting
          </span>
        ) : null}
      </div>

      {myEntry && canWithdrawEntry(myEntry.status) ? (
        <div className="rounded-md border p-4 space-y-3" style={{ borderColor: 'var(--accent-track)', backgroundColor: 'var(--accent-soft)' }}>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md font-bold text-sm" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
              {myPosition ? `#${myPosition}` : <Check aria-label="In queue" className="size-4" />}
            </span>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--accent-ink)' }}>
                {myPosition
                  ? `You are #${myPosition} in the queue.`
                  : "You are in this queue."}
              </p>
              <p className="text-xs" style={{ color: 'var(--accent-ink)' }}>
                Keep an eye on courts. You will be assigned as soon as a court opens.
              </p>
            </div>
          </div>
          <form action={leaveFormAction} className="pt-1">
            <Button
              className="w-full sm:w-auto h-9 rounded-md text-xs font-semibold transition"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              disabled={leaving}
              type="submit"
              variant="outline"
            >
              {leaving ? "Leaving..." : "Leave queue"}
            </Button>
          </form>
          <QueueFeedback {...leaveState} />
        </div>
      ) : myEntry?.status === "withdrawn" ? (
        <div className="rounded-md border p-3.5 text-xs font-medium" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)', color: 'var(--muted)' }} role="status">
          You left this queue.
        </div>
      ) : myEntry?.status === "skipped" ? (
        <div className="rounded-md border p-3.5 text-xs font-medium" style={{ borderColor: 'var(--warning)', backgroundColor: 'var(--pill-warning-bg)', color: 'var(--pill-warning-ink)' }} role="status">
          Your earlier queue entry was skipped
          {myEntry.admin_note ? `: ${myEntry.admin_note}` : "."}
        </div>
      ) : myEntry?.status === "assigned" ? (
        <div className="rounded-md border p-3.5 text-xs font-semibold" style={{ borderColor: 'var(--accent-track)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-ink)' }} role="status">
          You have been assigned from this queue. Head to your assigned court!
        </div>
      ) : myEntry?.status === "played" ? (
        <div className="rounded-md border p-3.5 text-xs font-medium" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)', color: 'var(--muted)' }} role="status">
          Your match is complete. You can join the queue again when you are ready.
        </div>
      ) : null}

      {!signedIn ? (
        <div className="rounded-md border p-5 text-center" style={{ borderColor: 'var(--border)', borderStyle: 'dashed', backgroundColor: 'var(--raised)' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            <Link
              className="font-bold hover:underline"
              style={{ color: 'var(--accent-ink)' }}
              href={`/login?next=${encodeURIComponent(`/sessions/${sessionId}`)}`}
            >
              Sign in
            </Link>{" "}
            to view the waiting list or join the queue.
          </p>
        </div>
      ) : canJoin &&
        (!myEntry ||
          canRejoinQueue(myEntry.status)) ? (
        <form action={joinFormAction} className="queue-join">
          <Button
            className="w-full min-h-[48px] rounded-md text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--accent)' }}
            disabled={joining}
            type="submit"
          >
            {joining ? "Joining..." : "Join queue"}
          </Button>
          <QueueFeedback {...joinState} />
        </form>
      ) : null}

      {!signedIn ? null : entries.length ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
            Waiting List (FIFO Order)
          </h3>
          <ol
            aria-label="Players waiting in FIFO order"
            className="divide-y rounded-md border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)' }}
          >
            {entries.map((entry) => (
              <li
                className={`flex items-center justify-between p-3 transition ${
                  entry.isCurrentUser
                    ? ""
                    : "hover:bg-white"
                }`}
                style={entry.isCurrentUser ? { backgroundColor: 'var(--accent-soft)' } : {}}
                key={entry.entryId}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      entry.isCurrentUser
                        ? ""
                        : "bg-slate-200 text-slate-700"
                    }`}
                    style={entry.isCurrentUser ? { backgroundColor: 'var(--accent)', color: 'white' } : { backgroundColor: 'var(--control)', color: 'var(--text)' }}
                  >
                    {entry.position}
                  </span>
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {entry.playerName}
                    </span>
                    {entry.isCurrentUser ? (
                      <span className="rounded-md px-1.5 py-0.2 text-[10px] font-bold" style={{ backgroundColor: 'var(--accent-track)', color: 'var(--accent-ink)' }}>
                        You
                      </span>
                    ) : null}
                  </div>
                </div>
                <time
                  className="shrink-0 text-xs font-medium"
                  style={{ color: 'var(--control)' }}
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
        </div>
      ) : (
        <div className="rounded-md border p-6 text-center text-xs" style={{ borderColor: 'var(--border)', borderStyle: 'dashed', backgroundColor: 'var(--raised)', color: 'var(--muted)' }}>
          No players are waiting yet. Be the first to join.
        </div>
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
      className="rounded-md border p-5 sm:p-6 space-y-4"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--rule)' }}>
        <div>
          <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>Waiting queue</h3>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Review players in order and skip with administrative reason if needed.</p>
        </div>
        <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-ink)' }}>
          {entries.length} waiting
        </span>
      </div>

      {entries.length ? (
        <ol className="divide-y rounded-md border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)' }}>
          {entries.map((entry) => (
            <li
              className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between transition hover:bg-white"
              key={entry.entryId}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--control)', color: 'var(--text)' }}>
                  {entry.position}
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{entry.playerName}</span>
              </div>
              <SkipQueueForm
                entryId={entry.entryId}
                facilityId={facilityId}
                sessionId={sessionId}
              />
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded-md border p-6 text-center text-xs" style={{ borderColor: 'var(--border)', borderStyle: 'dashed', backgroundColor: 'var(--raised)', color: 'var(--muted)' }}>
          No one is waiting.
        </div>
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
    <form action={formAction} className="flex items-center gap-2">
      <label className="sr-only" htmlFor={`skip-reason-${entryId}`}>
        Reason for skipping this player
      </label>
      <input
        className="h-8 rounded-md border px-2.5 text-xs focus-visible:outline-none focus-visible:ring-2"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
        id={`skip-reason-${entryId}`}
        maxLength={500}
        minLength={3}
        name="reason"
        placeholder="Reason required"
        required
      />
      <Button
        className="h-8 rounded-md text-xs font-semibold transition"
        style={{ color: 'var(--negative)', borderColor: 'var(--negative)' }}
        disabled={pending}
        size="sm"
        type="submit"
        variant="outline"
      >
        {pending ? "Saving..." : "Skip"}
      </Button>
      <QueueFeedback {...state} />
    </form>
  );
}
