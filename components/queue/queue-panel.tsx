"use client";

import Link from "next/link";
import {
  CircleAlert,
  CircleCheck,
  LogIn,
  LogOut,
  UserPlus,
  UsersRound,
} from "lucide-react";
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
      <p className="inline-flex items-start gap-2 text-sm text-rose-200" role="alert">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {error}
      </p>
    );
  }
  if (notice) {
    return (
      <p className="inline-flex items-start gap-2 text-sm text-lime-200" role="status">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
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
      className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e6edd9] text-[#45602c]">
            <UsersRound aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold" id="queue-heading">
              Session queue
            </h2>
          <p className="mt-1 text-sm text-slate-400">
            Waiting order is first in, first out.
          </p>
          </div>
        </div>
        {signedIn ? (
          <span className="rounded-full bg-[#f0f3eb] px-3 py-1.5 text-xs font-bold tabular-nums text-[#455348]">
            {entries.length} waiting
          </span>
        ) : null}
      </div>

      {myEntry && canWithdrawEntry(myEntry.status) ? (
        <div className="mt-5 rounded-2xl border border-lime-300/20 bg-lime-300/10 p-4">
          <p className="inline-flex items-center gap-2 font-semibold text-lime-100">
            <CircleCheck aria-hidden="true" className="size-4" />
            {myPosition
              ? `You are #${myPosition} in the queue.`
              : "You are in this queue."}
          </p>
          <form action={leaveFormAction} className="mt-3">
            <Button
              disabled={leaving}
              type="submit"
              variant="outline">
              <LogOut aria-hidden="true" className="size-4" />
              {leaving ? "Leaving..." : "Leave queue"}
            </Button>
          </form>
          <QueueFeedback {...leaveState} />
        </div>
      ) : myEntry?.status === "withdrawn" ? (
        <p className="mt-5 text-sm text-slate-300" role="status">
          You left this queue.
        </p>
      ) : myEntry?.status === "skipped" ? (
        <p className="mt-5 text-sm text-amber-100" role="status">
          Your earlier queue entry was skipped
          {myEntry.admin_note ? `: ${myEntry.admin_note}` : "."}
        </p>
      ) : myEntry?.status === "assigned" ? (
        <p className="mt-5 text-sm text-lime-100" role="status">
          You have been assigned from this queue.
        </p>
      ) : myEntry?.status === "played" ? (
        <p className="mt-5 text-sm text-lime-100" role="status">
          Your match is complete. You can join the queue again when you are ready.
        </p>
      ) : null}

      {!signedIn ? (
        <p className="mt-5 text-sm text-slate-300">
          <Link
            className="inline-flex items-center gap-1 font-bold text-lime-300 hover:text-lime-200"
            href={`/login?next=${encodeURIComponent(`/sessions/${sessionId}`)}`}
          >
            <LogIn aria-hidden="true" className="size-4" />
            Sign in
          </Link>{" "}
          to view the waiting list or join the queue.
        </p>
      ) : canJoin &&
        (!myEntry ||
          canRejoinQueue(myEntry.status)) ? (
        <form action={joinFormAction} className="mt-5">
          <Button
            className="h-11 rounded-full bg-lime-300 px-5 font-bold text-slate-950 hover:bg-lime-200"
            disabled={joining}
            type="submit"
          >
            {joining ? (
              "Joining..."
            ) : (
              <>
                <UserPlus aria-hidden="true" className="size-4" />
                Join queue
              </>
            )}
          </Button>
          <QueueFeedback {...joinState} />
        </form>
      ) : null}

      {!signedIn ? null : entries.length ? (
        <ol
          aria-label="Players waiting in FIFO order"
          className="mt-6 divide-y divide-white/10"
        >
          {entries.map((entry) => (
            <li
              className="flex items-center gap-4 py-3"
              key={entry.entryId}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e8efd9] text-sm font-semibold tabular-nums text-[#3e5b24]">
                {entry.position}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
                {entry.playerName}
                {entry.isCurrentUser ? (
                  <span className="ml-2 text-xs font-semibold text-lime-300">
                    You
                  </span>
                ) : null}
              </span>
              <time
                className="text-xs text-slate-500"
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
        <p className="mt-6 rounded-xl border border-dashed border-white/10 bg-[#f7f8f3] px-4 py-4 text-sm text-slate-400">
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
      className="mt-5 rounded-2xl border border-white/10 bg-[#f7f8f3] p-4"
    >
      <h3 className="inline-flex items-center gap-2 font-semibold">
        <UsersRound aria-hidden="true" className="size-4 text-[#52732f]" />
        Waiting queue
      </h3>
      {entries.length ? (
        <ol className="mt-3 space-y-3">
          {entries.map((entry) => (
            <li
              className="flex flex-col gap-3 rounded-xl bg-slate-950/50 p-3 sm:flex-row sm:items-center"
              key={entry.entryId}
            >
              <span className="text-sm text-slate-200">
                #{entry.position} · {entry.playerName}
              </span>
              <SkipQueueForm
                entryId={entry.entryId}
                facilityId={facilityId}
                sessionId={sessionId}
              />
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-sm text-slate-400">No one is waiting.</p>
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
    <form action={formAction} className="flex flex-1 flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor={`skip-reason-${entryId}`}>
        Reason for skipping this player
      </label>
      <input
        className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
